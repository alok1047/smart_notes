import { prisma } from '@/config/prisma';
import { embeddingService } from './ai/embeddingService';
import { createChildLogger } from '@/utils/logger';
import { Prisma } from '@prisma/client';

const logger = createChildLogger('search');

export type SearchMode = 'semantic' | 'keyword' | 'hybrid';

export interface SearchInput {
  q: string;
  mode: SearchMode;
  limit: number;
  userId: string;
  apiKey?: string;
}

export interface SearchOutput {
  query: string;
  mode: SearchMode;
  subjects: Array<Record<string, unknown>>;
  lectures: Array<Record<string, unknown>>;
  chunks: Array<Record<string, unknown>>;
  totalResults: number;
}

interface VectorHit {
  chunk_id: string;
  lecture_id: string;
  lecture_number: number;
  lecture_title: string;
  subject_id: string;
  subject_name: string;
  content: string;
  similarity: number;
  rank?: number;
  rrfScore?: number;
}

interface FtsHit {
  chunk_id: string;
  lecture_id: string;
  lecture_number: number;
  lecture_title: string;
  subject_id: string;
  subject_name: string;
  content: string;
  rank: number;
  similarity?: number;
  rrfScore?: number;
}

type SearchHit = VectorHit | FtsHit;

const TOP_N = 50;

const vectorToSql = (vector: number[]): string => `[${vector.join(',')}]`;

const vectorSearch = async (
  userId: string,
  vector: number[],
  limit: number
): Promise<VectorHit[]> => {
  const rows = await prisma.$queryRaw<VectorHit[]>(
    Prisma.sql`
      SELECT
        nc."id"::text AS chunk_id,
        l."id"::text AS lecture_id,
        l."lecture_number"::int AS lecture_number,
        l."title" AS lecture_title,
        s."id"::text AS subject_id,
        s."name" AS subject_name,
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
  return rows;
};

const ftsSearch = async (userId: string, q: string, limit: number): Promise<FtsHit[]> => {
  const rows = await prisma.$queryRaw<FtsHit[]>(
    Prisma.sql`
      SELECT
        nc."id"::text AS chunk_id,
        l."id"::text AS lecture_id,
        l."lecture_number"::int AS lecture_number,
        l."title" AS lecture_title,
        s."id"::text AS subject_id,
        s."name" AS subject_name,
        nc."content",
        ts_rank_cd(to_tsvector('english', nc."content"), plainto_tsquery('english', ${q})) AS rank
      FROM "note_chunks" nc
      JOIN "lectures" l ON l."id" = nc."lecture_id"
      JOIN "subjects" s ON s."id" = l."subject_id"
      WHERE s."user_id" = ${userId}
        AND to_tsvector('english', nc."content") @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit}
    `
  );
  return rows;
};

const rrfMerge = <T extends { chunk_id: string }>(
  ...rankedLists: T[][]
): Array<T & { rrfScore: number }> => {
  const scores = new Map<string, { item: T; score: number }>();
  const K = 60;

  for (const list of rankedLists) {
    list.forEach((item, index) => {
      const rank = index + 1;
      const existing = scores.get(item.chunk_id);
      if (existing) {
        existing.score += 1 / (K + rank);
      } else {
        scores.set(item.chunk_id, { item, score: 1 / (K + rank) });
      }
    });
  }

  return Array.from(scores.entries())
    .map(([_, { item, score }]) => ({ ...item, rrfScore: score }))
    .sort((a, b) => b.rrfScore - a.rrfScore);
};

const makeSnippet = (content: string, q: string, maxLen = 240): string => {
  const lower = content.toLowerCase();
  const qLower = q.toLowerCase();
  const idx = lower.indexOf(qLower);
  const start = idx > 0 ? Math.max(0, idx - 60) : 0;
  const snippet = content.slice(start, start + maxLen);
  return snippet.length < content.length ? `${snippet}…` : snippet;
};

export const searchService = {
  async search(input: SearchInput): Promise<SearchOutput> {
    const { q, mode, limit, userId } = input;
    const query = q.trim();

    // Subjects matched by name (keyword — ILIKE)
    const subjects = await prisma.subject.findMany({
      where: {
        userId,
        name: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        lectureCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    let chunkHits: SearchHit[] = [];
    const effectiveLimit = Math.max(limit, TOP_N);

    const runFts = async (): Promise<SearchHit[]> => {
      const ftsHits = await ftsSearch(userId, query, effectiveLimit);
      return ftsHits;
    };

    if (mode === 'semantic' || mode === 'hybrid') {
      try {
        const vector = await embeddingService.queryEmbedding(query, input.apiKey);
        const vecHits = await vectorSearch(userId, vector, effectiveLimit);
        chunkHits = mode === 'semantic' ? vecHits : rrfMerge(vecHits, await runFts());
      } catch (error) {
        logger.warn({ err: error }, 'Vector search failed, falling back to keyword');
        chunkHits = await runFts();
      }
    } else {
      chunkHits = await runFts();
    }

    const topChunks = chunkHits.slice(0, limit);

    const lectureMap = new Map<string, SearchHit>();
    for (const hit of topChunks) {
      if (!lectureMap.has(hit.lecture_id)) {
        lectureMap.set(hit.lecture_id, hit);
      }
    }

    const hitScore = (hit: SearchHit): number =>
      hit.similarity ?? hit.rank ?? hit.rrfScore ?? 0;

    const lectures = Array.from(lectureMap.values()).map((hit) => ({
      id: hit.lecture_id,
      _id: hit.lecture_id,
      lectureNumber: hit.lecture_number,
      title: hit.lecture_title,
      subjectId: hit.subject_id,
      subjectName: hit.subject_name,
      snippet: makeSnippet(hit.content, query),
      score: hitScore(hit),
    }));

    const subjectResults = subjects.map((s) => ({ ...s, _id: s.id }));

    return {
      query,
      mode,
      subjects: subjectResults,
      lectures,
      chunks: topChunks.map((hit) => ({
        id: hit.chunk_id,
        _id: hit.chunk_id,
        lectureId: hit.lecture_id,
        lectureNumber: hit.lecture_number,
        lectureTitle: hit.lecture_title,
        subjectId: hit.subject_id,
        subjectName: hit.subject_name,
        snippet: makeSnippet(hit.content, query),
        score: hitScore(hit),
      })),
      totalResults: subjects.length + lectures.length,
    };
  },
};