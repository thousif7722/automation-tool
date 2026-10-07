import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1),
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z.string().min(2).max(50).optional(),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  logoUrl: z.string().url().optional().nullable(),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'EDITOR', 'VIEWER']),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).default('DRAFT'),
  triggerKeywords: z.array(z.string().min(1)).min(1),
  matchType: z.enum(['exact', 'contains', 'regex', 'fuzzy']).default('contains'),
  publicReplyText: z.string().default(''),
  sendPrivateDM: z.boolean().default(true),
  privateDMText: z.string().default(''),
});

export const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

export const UpdateLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  score: z.number().int().min(0).max(100).optional(),
});

export const SimulateCommentSchema = z.object({
  commentText: z.string().min(1),
  fromUsername: z.string().min(1),
  fromUserId: z.string().optional(),
  mediaId: z.string().optional(),
});

export const SubscribeSchema = z.object({
  planSlug: z.enum(['free', 'starter', 'growth', 'pro', 'business']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
});

export function formatZodErrors(error: z.ZodError) {
  const issues = (error as any).issues || (error as any).errors || [];
  return issues.map((e: any) => ({
    field: Array.isArray(e.path) ? e.path.join('.') : '',
    message: e.message,
  }));
}
