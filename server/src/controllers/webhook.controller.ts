import type { RequestHandler } from 'express';
import { webhookRepository } from '@/repositories/chunk.repository';
import { prisma } from '@/config/prisma';
import { strParam } from '@/utils/helpers';
import { generateSecret, hashSecret } from '@/utils/crypto';
import { NotFoundError } from '@/errors/NotFoundError';

const prismaWebhookDelete = async (id: string, userId: string) => {
  return prisma.webhook.deleteMany({ where: { id, userId } });
};

export const createWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { url, events } = req.body as { url: string; events: string[] };
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'url and events are required' });
      return;
    }

    const secret = generateSecret();
    const webhook = await webhookRepository.create({
      userId: req.user!.id,
      url,
      events: events as never,
      secret: hashSecret(secret),
    });

    res.status(201).json({ webhook, secret });
  } catch (error) {
    next(error);
  }
};

export const listWebhooks: RequestHandler = async (req, res, next) => {
  try {
    const webhooks = await webhookRepository.findByUser(req.user!.id);
    res.json(webhooks);
  } catch (error) {
    next(error);
  }
};

export const deleteWebhook: RequestHandler = async (req, res, next) => {
  try {
    const webhook = await prismaWebhookDelete(strParam(req.params.id), req.user!.id);
    if (!webhook) throw new NotFoundError('Webhook');
    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    next(error);
  }
};