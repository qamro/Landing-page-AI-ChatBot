import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err?.message || 'Unknown error');
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return res.status(500).json({ error: err?.message, stack: err?.stack });
}
