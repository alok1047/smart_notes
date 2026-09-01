import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const lectureRepository = {
  findById(id: string) {
    return prisma.lecture.findUnique({ where: { id } });
  },

  findOwned(id: string, userId: string) {
    return prisma.lecture.findFirst({
      where: { id, subject: { userId } },
    });
  },

  findBySubject(subjectId: string) {
    return prisma.lecture.findMany({
      where: { subjectId },
      orderBy: { lectureNumber: 'asc' },
    });
  },

  create(data: Prisma.LectureUncheckedCreateInput) {
    return prisma.lecture.create({ data });
  },

  update(id: string, data: Prisma.LectureUpdateInput) {
    return prisma.lecture.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.lecture.delete({ where: { id } });
  },

  countBySubject(subjectId: string) {
    return prisma.lecture.count({ where: { subjectId } });
  },

  createMany(data: Prisma.LectureCreateManyInput[]) {
    return prisma.lecture.createMany({ data });
  },

  countBySubjectIds(subjectIds: string[]) {
    return prisma.lecture.groupBy({
      by: ['subjectId'],
      where: { subjectId: { in: subjectIds } },
      _count: { _all: true },
    });
  },

  findRecentBySubjectIds(subjectIds: string[], limit = 6) {
    return prisma.lecture.findMany({
      where: { subjectId: { in: subjectIds } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  },

  findProcessedBySubject(subjectId: string) {
    return prisma.lecture.findMany({
      where: {
        subjectId,
        processedNotes: { not: '' },
      },
      select: { id: true, title: true, lectureNumber: true, processedNotes: true },
      orderBy: { lectureNumber: 'asc' },
    });
  },

  upsert(data: Prisma.LectureUncheckedCreateInput) {
    return prisma.lecture.upsert({
      where: {
        subjectId_lectureNumber: {
          subjectId: data.subjectId,
          lectureNumber: data.lectureNumber,
        },
      },
      update: {},
      create: data,
    });
  },
};