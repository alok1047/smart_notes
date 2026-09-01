import { prisma } from '@/config/prisma';
import { Prisma } from '@prisma/client';
import { embeddingService } from './embeddingService';
import { aiRegistry } from './aiService';
import type { AIOptions } from '@/types/ai.types';
import { createChildLogger } from '@/utils/logger';

const logger = createChildLogger('rag');

export type QueryIntent = 'factual' | 'explanation' | 'comparison';

export interface RagCitation {
  lectureId: string;
  lectureNumber: number;
  lectureTitle: string;
  chunkIndex: number;
  snippet: string;
}

export interface RagResult {
  answer: string;
  citations: RagCitation[];
  intent: QueryIntent;
}

interface RetrievedChunk {
  chunkId: string;
  lectureId: string;
  lectureNumber: number;
  lectureTitle: string;
  content: string;
  score: number;
}

const TOP_K = 6;
const VECTOR_CANDIDATES = 20;
const FTS_CANDIDATES = 20;

const classifyIntent = (query: string): QueryIntent => {
  const q = query.toLowerCase();
  if (/\b(compare|vs|versus|difference|similar|contrast|better|which is better)\b/.test(q)) {
    return 'comparison';
  }
  if (/\b(why|how|explain|explain|describe|what is the reason|elaborate)\b/.test(q)) {
    return 'explanation';
  }
  return 'factual';
};

const vectorToSql = (vector: number[]): string => `[${vector.join(',')}]`;

const vectorRetrieve = async (userId: string, vector: number[], limit: number): Promise<RetrievedChunk[]> => {
  const rows = await prisma.$queryRaw<
    Array<{
      chunk_id: string;
      lecture_id: string;
      lecture_number: number;
      lecture_title: string;
      content: string;
      similarity: number;
    }>
  >(
    Prisma.sql`
      SELECT
        nc."id"::text AS chunk_id,
        l."id"::text AS lecture_id,
        l."lecture_number"::int AS lecture_number,
        l."title" AS lecture_title,
        nc."content",
        1 - (nc."embedding" <=> ${vectorToSql(vector)}::vector) AS similarity
      FROM "note_chunks" nc
      JOIN "lectures" l ON l."id" = nc."lecture_id"
      JOIN "subjects" s ON s."id" = l."subject_id"
      WHERE s."user_id" = ${userId}
        AND nc."embedding" IS NOT NULL
      ORDER BY nc."embedding" <=> ${vectorToSql(vector)}::vector
      LIMIT ${limit}
    `
  );

  return rows.map((r) => ({
    chunkId: r.chunk_id,
    lectureId: r.lecture_id,
    lectureNumber: r.lecture_number,
    lectureTitle: r.lecture_title,
    content: r.content,
    score: r.similarity,
  }));
};

const ftsRetrieve = async (userId: string, query: string, limit: number): Promise<RetrievedChunk[]> => {
  const rows = await prisma.$queryRaw<
    Array<{
      chunk_id: string;
      lecture_id: string;
      lecture_number: number;
      lecture_title: string;
      content: string;
      rank: number;
    }>
  >(
    Prisma.sql`
      SELECT
        nc."id"::text AS chunk_id,
        l."id"::text AS lecture_id,
        l."lecture_number"::int AS lecture_number,
        l."title" AS lecture_title,
        nc."content",
        ts_rank_cd(to_tsvector('english', nc."content"), plainto_tsquery('english', ${query})) AS rank
      FROM "note_chunks" nc
      JOIN "lectures" l ON l."id" = nc."lecture_id"
      JOIN "subjects" s ON s."id" = l."subject_id"
      WHERE s."user_id" = ${userId}
        AND to_tsvector('english', nc."content") @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
    `
  );

  return rows.map((r) => ({
    chunkId: r.chunk_id,
    lectureId: r.lecture_id,
    lectureNumber: r.lecture_number,
    lectureTitle: r.lecture_title,
    content: r.content,
    score: r.rank,
  }));
};

const rrfMerge = (...lists: RetrievedChunk[][]): RetrievedChunk[] => {
  const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();
  const K = 60;

  for (const list of lists) {
    list.forEach((chunk, index) => {
      const rank = index + 1;
      const existing = scores.get(chunk.chunkId);
      if (existing) {
        existing.score += 1 / (K + rank);
      } else {
        scores.set(chunk.chunkId, { chunk, score: 1 / (K + rank) });
      }
    });
  }

  return Array.from(scores.values())
    .map(({ chunk, score }) => ({ ...chunk, score }))
    .sort((a, b) => b.score - a.score);
};

const reRank = (chunks: RetrievedChunk[], query: string, topK: number): RetrievedChunk[] => {
  const qTokens = new Set(query.toLowerCase().split(/\W+/).filter((t) => t.length > 2));

  const scored = chunks.map((chunk) => {
    const lower = chunk.content.toLowerCase();
    let lexicalBoost = 0;
    for (const token of qTokens) {
      if (lower.includes(token)) lexicalBoost += 1;
    }
    const positionPenalty = Math.max(0, 1 - chunk.lectureNumber * 0.02);
    return {
      ...chunk,
      score: chunk.score * 1.5 + lexicalBoost + positionPenalty,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};

const buildContext = (chunks: RetrievedChunk[]): string => {
  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}] Lecture ${c.lectureNumber}${c.lectureTitle ? `: ${c.lectureTitle}` : ''}\n${c.content}`
    )
    .join('\n\n---\n\n');
};

const buildPrompt = (query: string, context: string, intent: QueryIntent): string => {
  const intentGuide: Record<QueryIntent, string> = {
    factual:
      'Answer factually with exact details from the notes. Quote specific numbers, terms, and definitions as written.',
    explanation:
      'Explain the concept clearly using the notes as the source of truth. Build up the explanation step by step.',
    comparison:
      'Compare the topics mentioned using a clear structure (e.g. a table or bulleted list). Highlight differences and similarities exactly as described in the notes.',
  };

  return `You are an AI study assistant answering questions ONLY from the student's own lecture notes.

INTENT: ${intent}
${intentGuide[intent]}

RULES:
1. Answer ONLY from the provided context. If the context does not contain the answer, say: "This isn't covered in your notes yet."
2. Ground every claim in the context. Do not hallucinate or add outside knowledge.
3. Cite sources inline using the format [Source N] where N matches the source list below. Do NOT add a separate "Sources" or citation list at the end of your answer.
4. Use clean Markdown.

STUDENT QUESTION: ${query}

CONTEXT (numbered sources):
${context}`;
};

export const ragService = {
  /**
   * Retrieval-only mode — returns the top-K chunks for a query.
   * Used by hybrid search and for debugging.
   */
  async retrieve(userId: string, query: string, opts: { mode?: 'semantic' | 'hybrid' | 'keyword'; apiKey?: string } = {}): Promise<RetrievedChunk[]> {
    const mode = opts.mode ?? 'hybrid';

    if (mode === 'keyword') {
      return ftsRetrieve(userId, query, TOP_K);
    }

    let vectorChunks: RetrievedChunk[] = [];
    {
      try {
        const vector = await embeddingService.queryEmbedding(query, opts.apiKey);
        vectorChunks = await vectorRetrieve(userId, vector, VECTOR_CANDIDATES);
      } catch (error) {
        logger.warn({ err: error }, 'Vector retrieval failed');
      }
    }

    if (mode === 'semantic') {
      return vectorChunks.slice(0, TOP_K);
    }

    const ftsChunks = await ftsRetrieve(userId, query, FTS_CANDIDATES);
    return reRank(rrfMerge(vectorChunks, ftsChunks), query, TOP_K);
  },

  /**
   * Full RAG: retrieve → re-rank → generate grounded answer with citations.
   */
  async answer(
    userId: string,
    subjectId: string,
    query: string,
    opts: { provider?: string; apiKey?: string; options?: AIOptions } = {}
  ): Promise<RagResult> {
    const intent = classifyIntent(query);

    // Restrict retrieval to chunks of lectures in this subject
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) {
      throw new Error('Subject not found');
    }

    const lectureIds = await prisma.lecture.findMany({
      where: { subjectId },
      select: { id: true },
    });
    const ids = lectureIds.map((l) => l.id);

    if (ids.length === 0) {
      return {
        answer:
          'I cannot answer this because you have not created any lectures for this subject yet. Create a lecture and write some notes first!',
        citations: [],
        intent,
      };
    }

    // Retrieve from the subject's lectures
    const subjectScoped = async (retrieve: typeof ragService.retrieve) => {
      const all = await retrieve(userId, query, { mode: 'hybrid', apiKey: opts.apiKey });
      return all.filter((c) => ids.includes(c.lectureId)).slice(0, TOP_K);
    };

    const chunks = await subjectScoped(ragService.retrieve);

    if (chunks.length === 0) {
      return {
        answer:
          'I cannot answer this because none of your notes for this subject match this question. Try asking about something in your notes!',
        citations: [],
        intent,
      };
    }

    const context = buildContext(chunks);
    const prompt = buildPrompt(query, context, intent);

    const provider = aiRegistry.get(opts.provider);
    const rawAnswer = await provider.generateText(prompt, opts.apiKey || undefined, opts.options);

    // Post-process: verify citations — only keep citations whose source appears in answer
    const usedSourceNumbers = new Set<number>();
    const sourceRe = /\[Source (\d+)\]/g;
    let match: RegExpExecArray | null;
    while ((match = sourceRe.exec(rawAnswer)) !== null) {
      usedSourceNumbers.add(parseInt(match[1], 10));
    }

    const citations: RagCitation[] = chunks
      .map((c, i) => ({
        lectureId: c.lectureId,
        lectureNumber: c.lectureNumber,
        lectureTitle: c.lectureTitle,
        chunkIndex: i,
        snippet: c.content.slice(0, 160),
      }))
      .filter((_, i) => usedSourceNumbers.size === 0 || usedSourceNumbers.has(i + 1));

    return { answer: rawAnswer, citations, intent };
  },
};

export type { RetrievedChunk };