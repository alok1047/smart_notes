import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const versionRepository = {
  findByLecture(lectureId: string) {
    return prisma.noteVersion.findMany({
      where: { lectureId },
      orderBy: { version: 'desc' },
    });
  },
  
  create(data: Prisma.NoteVersionUncheckedCreateInput) {
    return prisma.noteVersion.create({ data });
  },

  findById(id: string) {
    return prisma.noteVersion.findUnique({ where: { id } });
  },

  delete(id: string) {
    return prisma.noteVersion.delete({ where: { id } });
  },

  async getNextVersion(lectureId: string) {
    const count = await prisma.noteVersion.count({ where: { lectureId } });
    return count + 1;
  }
};
