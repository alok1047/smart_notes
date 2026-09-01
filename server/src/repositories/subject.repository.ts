import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const subjectRepository = {
  create(data: Prisma.SubjectCreateInput) {
    return prisma.subject.create({ data });
  },

  findByUser(userId: string) {
    return prisma.subject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { lectures: true } } },
    });
  },

  findOwned(id: string, userId: string) {
    return prisma.subject.findFirst({ where: { id, userId } });
  },

  findOwnedWithLectures(id: string, userId: string) {
    return prisma.subject.findFirst({
      where: { id, userId },
      include: { lectures: { orderBy: { lectureNumber: 'asc' } } },
    });
  },

  update(id: string, data: Prisma.SubjectUpdateInput) {
    return prisma.subject.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.subject.delete({ where: { id } });
  },

  incrementLectureCount(id: string, amount: number) {
    return prisma.subject.update({
      where: { id },
      data: { lectureCount: { increment: amount } },
    });
  },

  setLectureCount(id: string, count: number) {
    return prisma.subject.update({
      where: { id },
      data: { lectureCount: count },
    });
  },
};