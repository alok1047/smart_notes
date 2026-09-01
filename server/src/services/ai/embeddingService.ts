import { getRedis, redisKey } from '@/config/redis';
import { generateEmbedding } from './aiService';
import { chunkForLecture } from '@/services/chunk.service';
import { chunkRepository } from '@/repositories/chunk.repository';
import { prisma } from '@/config/prisma';
import { createChildLogger } from '@/utils/logger';
import crypto from 'node:crypto';

const logger = createChildLogger('embedding');

const EMBEDDING_TTL = 60 * 60; // 1 hour cache

const contentHash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

const vectorToSql = (vector: number[]): string => {
  return `[${vector.join(',')}]`;
};

export const embeddingService = {
  /**
   * Generate an embedding for a single text, cached in Redis.
   */
  async embedWithCache(text: string, apiKey?: string): Promise<number[]> {
    const hash = contentHash(text);
    const cacheKey = redisKey('embedding', hash);

    try {
      const redis = getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as number[];
      }

      const vector = await generateEmbedding(text, apiKey);
      await redis.set(cacheKey, JSON.stringify(vector), 'EX', EMBEDDING_TTL);
      return vector;
    } catch (error) {
      logger.warn({ err: error }, 'Redis cache lookup failed, embedding without cache');
      return generateEmbedding(text, apiKey);
    }
  },

  /**
   * Batch embed many texts.
   */
  async embedBatch(texts: string[], apiKey?: string): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embedWithCache(text, apiKey));
    }
    return results;
  },

  /**
   * Re-chunk a lecture's content and re-embed all chunks into pgvector.
   * Used after note saves (debounced externally / job queue in Phase 3).
   */
  async embedLecture(
    lectureId: string,
    content: string,
    options: { apiKey?: string; force?: boolean } = {}
  ): Promise<number> {
    const chunks = chunkForLecture(content, lectureId);
    if (chunks.length === 0) {
      await chunkRepository.deleteByLecture(lectureId);
      return 0;
    }

    // Skip if unchanged (same content hash, no force)
    if (!options.force) {
      const existing = await chunkRepository.findByLecture(lectureId);
      if (existing.length === chunks.length) {
        const same = existing.every((c, i) => contentHash(c.content) === contentHash(chunks[i].content));
        if (same) return existing.length;
      }
    }

    const vectors = await this.embedBatch(chunks.map((c) => c.content), options.apiKey);

    await prisma.$transaction(async (tx) => {
      await tx.noteChunk.deleteMany({ where: { lectureId } });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await tx.$executeRawUnsafe(
          `INSERT INTO "note_chunks" ("id", "lecture_id", "content", "embedding", "chunk_index", "metadata")
           VALUES ($1, $2, $3, $4::vector, $5, $6::jsonb)`,
          crypto.randomUUID(),
          lectureId,
          chunk.content,
          vectorToSql(vectors[i]),
          i,
          JSON.stringify(chunk.metadata)
        );
      }
    });

    logger.info({ lectureId, chunks: chunks.length }, 'Lecture embedded');
    return chunks.length;
  },

  async embedLectureContent(lectureId: string, content: string, apiKey?: string): Promise<number> {
    return this.embedLecture(lectureId, content, { apiKey });
  },

  /**
   * Convert a query to its vector for pgvector KNN search.
   */
  async queryEmbedding(query: string, apiKey?: string): Promise<number[]> {
    return this.embedWithCache(query, apiKey);
  },
};

export { vectorToSql };