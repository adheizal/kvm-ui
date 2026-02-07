import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import Joi from 'joi';

export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => detail.message);
      logger.warn(`Validation error: ${details.join(', ')}`);
      return res.status(400).json({
        error: 'Validation Error',
        details,
      });
    }

    req.body = value;
    return next();
  };
}
