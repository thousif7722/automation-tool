import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '@insta-automation/database';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'insta-automation-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

healthRouter.get('/readiness', (_req: Request, res: Response) => {
  const dbStatus = isDatabaseConnected();
  if (!dbStatus) {
    return res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
  return res.json({
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});
