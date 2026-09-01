import { lectureRepository } from '@/repositories/lecture.repository';
import { subjectRepository } from '@/repositories/subject.repository';
import { versionRepository } from '@/repositories/version.repository';
import { NotFoundError } from '@/errors/NotFoundError';
import { ForbiddenError } from '@/errors';
import { wordCount } from '@/utils/helpers';
import { processNotes, streamNotes } from './ai/aiService';
import { embeddingService } from './ai/embeddingService';
import { createChildLogger } from '@/utils/logger';
import type { AIOptions } from '@/types/ai.types';
import type { Prisma } from '@prisma/client';

const lectureLogger = createChildLogger('lecture-service');

const triggerEmbedding = (lectureId: string, content: string, apiKey?: string) => {
  if (!content || !content.trim()) return;
  embeddingService.embedLectureContent(lectureId, content, apiKey).catch((err) => {
    lectureLogger.warn({ err, lectureId }, 'Background embedding failed');
  });
};

export const lectureService = {
  async getSingle(id: string, userId: string) {
    const lecture = await lectureRepository.findById(id);
    if (!lecture) throw new NotFoundError('Lecture');

    const subject = await subjectRepository.findOwned(lecture.subjectId, userId);
    if (!subject) throw new ForbiddenError('Not authorized');

    return { lecture, subject };
  },

  async listBySubject(subjectId: string, userId: string) {
    const subject = await subjectRepository.findOwned(subjectId, userId);
    if (!subject) throw new NotFoundError('Subject');

    const lectures = await lectureRepository.findBySubject(subjectId);
    return { subject, lectures };
  },

  async add(subjectId: string, userId: string) {
    const subject = await subjectRepository.findOwned(subjectId, userId);
    if (!subject) throw new NotFoundError('Subject');

    const count = await lectureRepository.countBySubject(subjectId);
    const lectureNumber = count + 1;

    const lecture = await lectureRepository.create({
      subjectId,
      lectureNumber,
      title: `Lecture ${lectureNumber}`,
      rawNotes: '',
      processedNotes: '',
    });

    await subjectRepository.setLectureCount(subjectId, lectureNumber);

    return lecture;
  },

  async update(id: string, userId: string, data: { title?: string; rawNotes?: string; processedNotes?: string }) {
    const lecture = await lectureRepository.findOwned(id, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    const updateData: Prisma.LectureUpdateInput = {};
    let embedContent: string | undefined;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.rawNotes !== undefined) {
      updateData.rawNotes = data.rawNotes;
      updateData.wordCount = wordCount(data.rawNotes);
    }
    if (data.processedNotes !== undefined) {
      updateData.processedNotes = data.processedNotes;
      embedContent = data.processedNotes;
    } else if (data.rawNotes !== undefined) {
      embedContent = data.rawNotes;
    }

    const updated = await lectureRepository.update(id, updateData);

    if (embedContent) {
      triggerEmbedding(id, embedContent);
    }

    return { lecture: updated };
  },

  async delete(id: string, userId: string) {
    const lecture = await lectureRepository.findOwned(id, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    await lectureRepository.delete(id);

    const remainingCount = await lectureRepository.countBySubject(lecture.subjectId);
    await subjectRepository.setLectureCount(lecture.subjectId, remainingCount);

    return { message: 'Lecture deleted' };
  },

  async process(id: string, userId: string, body: { aiProvider?: string; apiKey?: string; options?: AIOptions }) {
    const lecture = await lectureRepository.findOwned(id, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    if (!lecture.rawNotes || lecture.rawNotes.trim().length === 0) {
      const error = new Error('No raw notes to process. Write some notes first!');
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const subject = await subjectRepository.findOwned(lecture.subjectId, userId);
    const options = this.withSubjectPrompt(body.options, subject?.systemPrompt);

    const processedNotes = await processNotes(lecture.rawNotes, body.aiProvider, body.apiKey, options);

    return {
      message: 'Notes processed successfully. Waiting for user approval.',
      processedNotes,
      lecture,
    };
  },

  withSubjectPrompt(options: AIOptions = {}, systemPrompt?: string) {
    if (!systemPrompt || !systemPrompt.trim()) return options;
    return { ...options, subjectPrompt: systemPrompt };
  },

  async processStream(
    id: string,
    userId: string,
    body: { aiProvider?: string; apiKey?: string; options?: AIOptions },
    onChunk: (chunk: string) => void,
    onStage?: (stage: string) => void
  ) {
    const lecture = await lectureRepository.findOwned(id, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    if (!lecture.rawNotes || lecture.rawNotes.trim().length === 0) {
      const error = new Error('No raw notes to process. Write some notes first!');
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const subject = await subjectRepository.findOwned(lecture.subjectId, userId);
    const options = this.withSubjectPrompt(body.options, subject?.systemPrompt);

    onStage?.('structure');
    const fullText = await streamNotes(lecture.rawNotes, body.aiProvider, body.apiKey, options, onChunk);

    if (lecture.processedNotes) {
      const nextVersion = await versionRepository.getNextVersion(id);
      await versionRepository.create({
        lectureId: id,
        rawNotes: lecture.rawNotes,
        processedNotes: lecture.processedNotes,
        version: nextVersion,
      });
    }

    await lectureRepository.update(id, {
      processedNotes: fullText,
      status: 'PROCESSED',
    });

    // Honest stage reporting for the processing modal: chunking + embedding
    // ("knowledge"), then vectors indexed for RAG. Best-effort — a failed
    // embed must never fail the processing run.
    if (fullText && fullText.trim()) {
      onStage?.('knowledge');
      try {
        await embeddingService.embedLectureContent(id, fullText, body.apiKey);
      } catch (err) {
        lectureLogger.warn({ err, lectureId: id }, 'Embedding during process-stream failed');
      }
      onStage?.('rag');
    }

    return fullText;
  },

  async getVersions(lectureId: string, userId: string) {
    const lecture = await lectureRepository.findOwned(lectureId, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    return versionRepository.findByLecture(lectureId);
  },

  async deleteVersion(versionId: string, userId: string) {
    const version = await versionRepository.findById(versionId);
    if (!version) throw new NotFoundError('Version');

    const lecture = await lectureRepository.findOwned(version.lectureId, userId);
    if (!lecture) throw new NotFoundError('Lecture');

    await versionRepository.delete(versionId);
    return { message: 'Version deleted' };
  },

  async getRecent(userId: string) {
    const subjects = await subjectRepository.findByUser(userId);
    const subjectIds = subjects.map((s) => s.id);
    if (subjectIds.length === 0) return [];

    const lectures = await lectureRepository.findRecentBySubjectIds(subjectIds, 6);
    const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

    return lectures.map((l) => ({
      ...l,
      subjectName: subjectMap.get(l.subjectId) || 'Subject',
    }));
  },
};