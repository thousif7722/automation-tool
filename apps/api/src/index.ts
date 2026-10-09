import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';
import { getEnv, APP_CONSTANTS } from '@insta-automation/config';
import { connectDatabase, disconnectDatabase } from '@insta-automation/database';

import { logger } from './lib/logger';
import { requestContextMiddleware } from './middleware/requestContext';
import { securityHeadersMiddleware, rateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { workspacesRouter } from './routes/workspaces';
import { workflowsRouter } from './routes/workflows';
import { leadsRouter } from './routes/leads';
import { customersRouter } from './routes/customers';
import { aiRouter } from './routes/ai';
import { contentRouter } from './routes/content';
import { instagramRouter } from './routes/instagram';
import { messagesRouter } from './routes/messages';
import { analyticsRouter } from './routes/analytics';
import { billingRouter } from './routes/billing';
import { adminRouter } from './routes/admin';
import { createAutomationRouter } from './routes/automation';
import { createWebhookRouter } from './webhooks';
import { CommentAutomationEngine } from './services/commentEngine';

let env: ReturnType<typeof getEnv>;
try {
  env = getEnv();
  logger.info(`[Startup] Environment validated successfully. Mode: ${env.NODE_ENV}`);
} catch (err: any) {
  console.error('[Startup Fatal] Environment validation failed:');
  console.error(err.message);
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

app.use(requestContextMiddleware);
app.use(securityHeadersMiddleware);
app.use(rateLimiter({ max: env.NODE_ENV === 'production' ? 100 : 1000 }));

const defaultAllowed = [
  'https://autodm.onewayfix.com',
  'https://admin.autodm.onewayfix.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4000',
];

const envAllowed = [env.WEB_URL, env.ADMIN_URL, env.LANDING_URL, env.API_URL]
  .filter(Boolean)
  .map((u) => u.replace(/\/$/, ''));

const customAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, ''))
  : [];

const allowedOriginsSet = new Set(
  [...defaultAllowed, ...envAllowed, ...customAllowed].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (env.NODE_ENV === 'development' || allowedOriginsSet.has(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: APP_CONSTANTS.MAX_PAYLOAD_BYTES }));
app.use(express.urlencoded({ extended: true, limit: APP_CONSTANTS.MAX_PAYLOAD_BYTES }));

export const commentEngine = new CommentAutomationEngine();

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/content', contentRouter);
app.use('/api/instagram', instagramRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/automations', createAutomationRouter(commentEngine));
app.use('/api/webhooks', createWebhookRouter(commentEngine));

app.use(notFoundHandler);
app.use(errorHandler);

let server: any = null;

export async function startServer(): Promise<any> {
  try {
    await connectDatabase(env.MONGODB_URI);
    logger.info('[Database] MongoDB connection established');
  } catch (err: any) {
    logger.warn(`[Database Warning] MongoDB connection failed: ${err.message}.`);
  }

  const PORT = env.PORT || 4000;
  if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
      logger.info(`🚀 [Instagram Automation OS API] Running on http://localhost:${PORT} (${env.NODE_ENV})`);
    });
  }

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

async function gracefulShutdown(signal: string) {
  logger.info(`[Shutdown] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('[Shutdown] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
