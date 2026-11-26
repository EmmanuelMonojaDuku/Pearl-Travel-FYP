import { z } from 'zod';

const collapseSpaces = (val: string) => val.replace(/\s+/g, ' ');

const optionalCleanString = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .transform(collapseSpaces)
    .optional()
    .transform((val) => (val === '' ? undefined : val));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('A valid email address is required.')
  .max(320, 'Email address must not exceed 320 characters.');

export const passwordPolicySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(128, 'Password must not exceed 128 characters.')
  .refine((val) => /[A-Z]/.test(val), 'Password must include at least one uppercase letter.')
  .refine((val) => /[a-z]/.test(val), 'Password must include at least one lowercase letter.')
  .refine((val) => /[0-9]/.test(val), 'Password must include at least one number.');

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordPolicySchema,
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters.')
      .max(200)
      .transform(collapseSpaces)
      .optional(),
    firstName: optionalCleanString(100),
    lastName: optionalCleanString(100),
    nationality: optionalCleanString(120),
    gender: optionalCleanString(40),
    phoneNumber: optionalCleanString(40),
    countryCode: optionalCleanString(12),
    travelPurpose: optionalCleanString(60),
    emergencyContactName: optionalCleanString(200),
    emergencyContactPhone: optionalCleanString(40),
    emergencyContactRelation: optionalCleanString(100),
  })
  .refine(
    (data) => Boolean(data.fullName || (data.firstName && data.firstName.length >= 1)),
    {
      message: 'Either fullName or firstName is required.',
      path: ['fullName'],
    }
  );

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(128),
});

export const verifyEmailBodySchema = z.object({
  token: z.string().trim().min(16, 'Invalid verification token.').max(512),
});

export const resendVerificationBodySchema = z.object({
  email: emailSchema,
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().trim().min(16, 'Invalid refresh token.').max(512),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().trim().min(16, 'Invalid refresh token.').max(512),
  allSessions: z.boolean().optional().default(false),
});

export const forgotPasswordBodySchema = z.object({
  email: emailSchema,
});

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(16, 'Invalid password reset token.').max(512),
  newPassword: passwordPolicySchema,
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailBodySchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationBodySchema>;
export type RefreshInput = z.infer<typeof refreshBodySchema>;
export type LogoutInput = z.infer<typeof logoutBodySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordBodySchema>;
