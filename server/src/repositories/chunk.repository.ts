import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const chunkRepository = {
  createMany(data: Prisma.NoteChunkUncheckedCreateInput[]) {
    return prisma.noteChunk.createMany({ data });
  },

  deleteByLecture(lectureId: string) {
    return prisma.noteChunk.deleteMany({ where: { lectureId } });
  },

  findByLecture(lectureId: string) {
    return prisma.noteChunk.findMany({
      where: { lectureId },
      orderBy: { chunkIndex: 'asc' },
    });
  },
};

export const webhookRepository = {
  create(data: Prisma.WebhookUncheckedCreateInput) {
    return prisma.webhook.create({ data });
  },
  findByUser(userId: string) {
    return prisma.webhook.findMany({ where: { userId } });
  },
};