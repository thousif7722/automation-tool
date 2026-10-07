import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

function loadEnvFiles() {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config();
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:3001'),
  LANDING_URL: z.string().url().default('http://localhost:3002'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  ACTIVE_AI_PROVIDER: z.enum(['ollama', 'bedrock', 'gemini', 'openai']).default('ollama'),
  OLLAMA_HOST: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('amazon.nova-lite-v1:0'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

const DANGEROUS_DEFAULTS = [
  'super_secret_jwt_key_change_in_production',
  'your_jwt_secret',
  'changeme',
  'secret',
  'password',
];

function validateEnv(): Env {
  loadEnvFiles();
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = (result.error as any).issues || (result.error as any).errors || [];
    const errors = issues.map((e: any) => `  • ${Array.isArray(e.path) ? e.path.join('.') : ''}: ${e.message}`).join('\n');
    throw new Error(`[Config] Environment validation failed:\n${errors}`);
  }

  const env = result.data;
  if (env.NODE_ENV === 'production') {
    if (DANGEROUS_DEFAULTS.some((d) => env.JWT_SECRET.toLowerCase().includes(d))) {
      throw new Error('[Config] JWT_SECRET appears to be a default value.');
    }
    if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length < 32) {
      throw new Error('[Config] ENCRYPTION_KEY (>=32 chars) is required in production.');
    }
  }
  return env;
}

let _env: Env | null = null;
export function getEnv(): Env {
  if (!_env) _env = validateEnv();
  return _env;
}
export function resetEnv(): void { _env = null; }

export interface PlanDefinition {
  name: string;
  slug: 'free' | 'starter' | 'growth' | 'pro' | 'business';
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  instagramAccountLimit: number;
  workflowLimit: number;
  monthlyDmLimit: number;
  leadLimit: number;
  teamMemberLimit: number;
  analyticsLevel: 'basic' | 'advanced' | 'enterprise';
  features: string[];
  active: boolean;
}

export const SYSTEM_PLANS: PlanDefinition[] = [
  {
    name: 'FREE',
    slug: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    currency: 'INR',
    instagramAccountLimit: 1,
    workflowLimit: 3,
    monthlyDmLimit: 500,
    leadLimit: 100,
    teamMemberLimit: 1,
    analyticsLevel: 'basic',
    features: ['1 Instagram Account', '3 Active Workflows', '500 Automated DMs/mo'],
    active: true,
  },
  {
    name: 'PRO',
    slug: 'pro',
    monthlyPrice: 3999,
    annualPrice: 38390,
    currency: 'INR',
    instagramAccountLimit: 10,
    workflowLimit: 100,
    monthlyDmLimit: 100000,
    leadLimit: 25000,
    teamMemberLimit: 5,
    analyticsLevel: 'advanced',
    features: ['10 Instagram Accounts', '100 Active Workflows', '100k DMs/mo'],
    active: true,
  },
];

export function getPlanBySlug(slug: string): PlanDefinition {
  return SYSTEM_PLANS.find((p) => p.slug === slug) ?? SYSTEM_PLANS[0];
}

export const APP_CONSTANTS = {
  BCRYPT_ROUNDS: 12,
  TOKEN_EXPIRY_DAYS: 7,
  MAX_PAYLOAD_BYTES: 1_048_576,
  AUDIT_LOG_RETENTION_DAYS: 90,
} as const;
