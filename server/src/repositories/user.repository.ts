import { prisma } from '@/config/prisma';
import type { Prisma } from '@prisma/client';

export const userRepository = {
  findByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  upsertByGoogleId(data: { googleId: string; name: string; email: string; avatar: string }) {
    return prisma.user.upsert({
      where: { googleId: data.googleId },
      update: {
        name: data.name,
        email: data.email,
        avatar: data.avatar,
      },
      create: {
        googleId: data.googleId,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
      },
    });
  },

  create(data: { email: string; name: string; passwordHash: string }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
};