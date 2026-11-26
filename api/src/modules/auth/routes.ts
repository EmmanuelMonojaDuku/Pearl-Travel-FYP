import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { ZodType, ZodTypeDef } from 'zod';
import type { AppConfig } from '../../config/env.js';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { ValidationError } from '../../shared/errors.js';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resendVerificationBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './schemas.js';
import type { AuthService } from './service.js';
import type { RequestMeta } from './types.js';

export interface AuthRoutesOptions {
  config: AppConfig;
  authService: AuthService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

function parseBody<TOutput>(schema: ZodType<TOutput, ZodTypeDef, unknown>, rawBody: unknown): TOutput {
  const result = schema.safeParse(rawBody ?? {});
  if (!result.success) {
    throw new ValidationError(
      'Request validation failed.',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }))
    );
  }
  return result.data;
}

function extractRequestMeta(request: FastifyRequest): RequestMeta {
  const userAgentHeader = request.headers['user-agent'];
  return {
    ipAddress: request.ip ?? null,
    userAgent: typeof userAgentHeader === 'string' ? userAgentHeader.slice(0, 500) : null,
  };
}

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (
  fastify: FastifyInstance,
  options: AuthRoutesOptions
) => {
  const { config, authService, authMiddleware } = options;

  const strictAuthRateLimit = {
    rateLimit: {
      max: config.rateLimit.authMax,
      timeWindow: config.rateLimit.authWindowMs,
    },
  };

  fastify.post(
    '/register',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(registerBodySchema, request.body);
      const result = await authService.register(body, extractRequestMeta(request));
      return reply.status(201).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/login',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(loginBodySchema, request.body);
      const result = await authService.login(body, extractRequestMeta(request));
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/verify-email',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(verifyEmailBodySchema, request.body);
      const result = await authService.verifyEmail(body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/resend-verification',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(resendVerificationBodySchema, request.body);
      const result = await authService.resendVerification(body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/refresh',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(refreshBodySchema, request.body);
      const result = await authService.refresh(body, extractRequestMeta(request));
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/logout',
    { preHandler: [authMiddleware.optionalAuthenticate] },
    async (request, reply) => {
      const body = parseBody(logoutBodySchema, request.body);
      const result = await authService.logout(
        body,
        extractRequestMeta(request),
        request.authUser?.userId
      );
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/forgot-password',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(forgotPasswordBodySchema, request.body);
      const result = await authService.forgotPassword(body, extractRequestMeta(request));
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.post(
    '/reset-password',
    { config: strictAuthRateLimit },
    async (request, reply) => {
      const body = parseBody(resetPasswordBodySchema, request.body);
      const result = await authService.resetPassword(body);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    }
  );

  fastify.get(
    '/me',
    { preHandler: [authMiddleware.authenticate] },
    async (request, reply) => {
      const userId = request.authUser!.userId;
      const user = await authService.getMe(userId);
      return reply.status(200).send({
        success: true,
        data: { user },
      });
    }
  );
};
