import { z } from 'zod';
import { ALL_USER_ROLES } from '../../shared/roles.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().max(120).optional().default(''),
});

export const overviewQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const travellersQuerySchema = paginationQuerySchema.extend({
  nationality: z.string().trim().max(120).optional().default(''),
  profileStatus: z.enum(['all', 'complete', 'incomplete']).default('all'),
});

export const journeysQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['all', 'planned', 'ready', 'in_transit', 'crossed', 'cancelled']).default('all'),
  travelMode: z.enum(['all', 'road', 'air', 'rail']).default('all'),
  borderPostId: z.string().uuid().optional(),
  sortBy: z.enum(['travel_date', 'created_at', 'updated_at']).default('travel_date'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const borderPostCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Border post code must use uppercase letters, numbers, or hyphens.'),
  name: z.string().trim().min(3).max(180),
  countryPair: z.string().trim().min(3).max(120),
  region: z.string().trim().min(2).max(120),
  postType: z.string().trim().min(2).max(60).default('Land Border Post'),
  operatingHours: z.string().trim().min(2).max(120).default('24 Hours / 7 Days'),
  status: z.enum(['active', 'maintenance', 'restricted']).default('active'),
  notes: z.string().trim().max(1000).optional(),
});

export const borderPostUpdateSchema = borderPostCreateSchema.partial().omit({ code: true });

export const assignOfficerSchema = z.object({
  userId: z.string().uuid(),
});

export const contentQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(['all', 'draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'])
    .default('all'),
  contentType: z.enum(['all', 'guidance', 'faq', 'notice']).default('all'),
  category: z
    .enum(['all', 'immigration', 'health', 'customs', 'border_post', 'transport'])
    .default('all'),
});

export const contentUpsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase letters, numbers, and hyphens only.'),
  contentType: z.enum(['guidance', 'faq', 'notice']).default('guidance'),
  category: z.enum(['immigration', 'health', 'customs', 'border_post', 'transport']),
  title: z.string().trim().min(4).max(240),
  summary: z.string().trim().min(10).max(600),
  body: z.string().trim().min(20).max(15000),
  officialAuthority: z.string().trim().min(3).max(220),
  borderPostId: z.string().uuid().nullable().optional(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const contentUpdateSchema = contentUpsertSchema.partial().omit({ slug: true });

export const requirementsQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(['all', 'draft', 'pending_review', 'approved', 'rejected', 'published', 'archived'])
    .default('all'),
  category: z.enum(['all', 'entry', 'exit', 'visa', 'health', 'customs']).default('all'),
});

export const requirementUpsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Requirement code must use lowercase letters, numbers, and hyphens.'),
  category: z.enum(['entry', 'exit', 'visa', 'health', 'customs']),
  title: z.string().trim().min(4).max(240),
  summary: z.string().trim().min(8).max(600),
  simpleExplanation: z.string().trim().min(15).max(5000),
  applicableCondition: z.string().trim().min(4).max(500),
  officialSource: z.string().trim().min(3).max(220),
  mandatory: z.boolean().default(true),
  ruleMetadata: z.record(z.unknown()).default({}),
  borderPostId: z.string().uuid().nullable().optional(),
});

export const requirementUpdateSchema = requirementUpsertSchema.partial().omit({ code: true });

export const workflowRejectSchema = z.object({
  reason: z.string().trim().min(5, 'Rejection reason must be at least 5 characters.').max(500),
});

export const readinessQrQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['all', 'valid', 'expired', 'revoked']).default('all'),
  borderPostId: z.string().uuid().optional(),
});

export const revokeQrSchema = z.object({
  reason: z.string().trim().min(5, 'Revocation reason is required.').max(400),
});

export const usersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['all', 'traveller', 'admin_staff', 'border_officer']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
});

export const updateUserRolesSchema = z.object({
  roles: z.array(z.enum(ALL_USER_ROLES as [string, ...string[]])).min(1, 'At least one role is required.'),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const auditLogsQuerySchema = paginationQuerySchema.extend({
  eventType: z.string().trim().max(80).optional().default(''),
});

export const reportsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

export const updateSettingSchema = z.object({
  value: z.union([z.string().max(200), z.number().min(0).max(10000), z.boolean()]),
});
