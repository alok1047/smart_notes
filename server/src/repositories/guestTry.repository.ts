import { prisma } from '@/config/prisma';

export const guestTryRepository = {
  findByAnonymousId(anonymousId: string) {
    return prisma.guestTryUsage.findUnique({ where: { anonymousId } });
  },

  upsert(anonymousId: string, usedAt: Date) {
    return prisma.guestTryUsage.upsert({
      where: { anonymousId },
      update: { usedCount: { increment: 1 }, usedAt },
      create: { anonymousId, usedCount: 1, usedAt },
    });
  },
};