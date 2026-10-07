import { maskSecret } from '@insta-automation/utils';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitizeLogMetadata(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeLogMetadata);

  const clean: Record<string, any> = {};
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'accesstoken', 'jwt', 'cookie'];

  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      clean[k] = typeof v === 'string' ? maskSecret(v) : '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeLogMetadata(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info(message: string, meta?: Record<string, any>) {
    console.log(JSON.stringify({ level: 'info', message, timestamp: new Date().toISOString(), ...sanitizeLogMetadata(meta) }));
  },
  warn(message: string, meta?: Record<string, any>) {
    console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString(), ...sanitizeLogMetadata(meta) }));
  },
  error(message: string, meta?: Record<string, any>) {
    console.error(JSON.stringify({ level: 'error', message, timestamp: new Date().toISOString(), ...sanitizeLogMetadata(meta) }));
  },
  debug(message: string, meta?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({ level: 'debug', message, timestamp: new Date().toISOString(), ...sanitizeLogMetadata(meta) }));
    }
  },
};
