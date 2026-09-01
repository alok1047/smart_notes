import type { RequestHandler } from 'express';
import { authService } from '@/services/auth.service';

export const googleAuth: RequestHandler = async (req, res, next) => {
  try {
    const { token } = req.body as { token: string };
    const result = await authService.googleAuth(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};