import type { RequestHandler } from 'express';
import { strParam } from '@/utils/helpers';
import { serialize, serializeMany } from '@/utils/serialize';
import { subjectService } from '@/services/subject.service';

export const createSubject: RequestHandler = async (req, res, next) => {
  try {
    const { name, lectureCount, description, color } = req.body as {
      name: string;
      lectureCount?: number;
      description?: string;
      color?: string;
    };
    const result = await subjectService.create({
      name,
      userId: req.user!.id,
      lectureCount: lectureCount ?? 1,
      description,
      color,
    });
    res.status(201).json({ ...result, subject: serialize(result.subject) });
  } catch (error) {
    next(error);
  }
};

export const getSubjects: RequestHandler = async (req, res, next) => {
  try {
    const subjects = await subjectService.listByUser(req.user!.id);
    res.json(serializeMany(subjects));
  } catch (error) {
    next(error);
  }
};

export const deleteSubject: RequestHandler = async (req, res, next) => {
  try {
    const result = await subjectService.delete(strParam(req.params.id), req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateSubject: RequestHandler = async (req, res, next) => {
  try {
    const result = await subjectService.update(strParam(req.params.id), req.user!.id, req.body);
    res.json({ ...result, subject: serialize(result.subject) });
  } catch (error) {
    next(error);
  }
};