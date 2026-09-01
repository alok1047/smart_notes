import { subjectRepository } from '@/repositories/subject.repository';
import { lectureRepository } from '@/repositories/lecture.repository';
import { NotFoundError } from '@/errors/NotFoundError';
import { ForbiddenError } from '@/errors';
import type { Prisma } from '@prisma/client';

export interface CreateSubjectInput {
  name: string;
  userId: string;
  lectureCount: number;
  description?: string;
  color?: string;
}

export const subjectService = {
  async create(data: CreateSubjectInput) {
    const subject = await subjectRepository.create({
      name: data.name,
      user: { connect: { id: data.userId } },
      lectureCount: data.lectureCount,
      description: data.description || '',
      color: data.color || '#208383',
    } satisfies Prisma.SubjectCreateInput);

    const lectures = Array.from({ length: data.lectureCount }, (_, i) => ({
      subjectId: subject.id,
      lectureNumber: i + 1,
      title: '',
      rawNotes: '',
      processedNotes: '',
    }));

    await lectureRepository.createMany(lectures);

    return { message: 'Subject created successfully', subject };
  },

  async listByUser(userId: string) {
    const subjects = await subjectRepository.findByUser(userId);
    return subjects.map((s) => ({
      ...s,
      lectureCount: s.lectureCount,
      actualLectureCount: s._count.lectures,
    }));
  },

  async delete(id: string, userId: string) {
    const subject = await subjectRepository.findOwned(id, userId);
    if (!subject) throw new NotFoundError('Subject');
    await subjectRepository.delete(id);
    return { message: 'Subject and its lectures deleted successfully' };
  },

  async update(id: string, userId: string, data: { systemPrompt?: string; description?: string; color?: string }) {
    const subject = await subjectRepository.findOwned(id, userId);
    if (!subject) throw new NotFoundError('Subject');
    const updated = await subjectRepository.update(id, {
      ...(typeof data.systemPrompt === 'string' ? { systemPrompt: data.systemPrompt } : {}),
      ...(typeof data.description === 'string' ? { description: data.description } : {}),
      ...(typeof data.color === 'string' ? { color: data.color } : {}),
    });
    return { message: 'Subject updated successfully', subject: updated };
  },

  async ensureOwned(id: string, userId: string) {
    const subject = await subjectRepository.findOwned(id, userId);
    if (!subject) throw new ForbiddenError('Not authorized');
    return subject;
  },
};