import { Response, NextFunction } from 'express';
import { authService } from '@/utils/auth';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types';

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization');
    const token = authService.extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      logger.warn('Authentication failed: Invalid token');
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    req.user = payload;
    return next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('authorization');
    const token = authService.extractTokenFromHeader(authHeader);

    if (token) {
      const payload = authService.verifyToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    return next();
  } catch {
    return next();
  }
}
