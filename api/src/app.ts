import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { type AppConfig, loadConfig } from './config/env.js';
import { PostgresDatabaseClient } from './database/pool.js';
import type { DatabaseClient } from './database/types.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { adminRoutes } from './modules/admin/routes.js';
import { adminManagementRoutes } from './modules/admin/management.js';
import { AssistantService } from './modules/assistant/service.js';
import { assistantRoutes } from './modules/assistant/routes.js';
import { createProviders, type EmbeddingProvider, type LlmProvider } from './modules/assistant/providers.js';
import { ContentService } from './modules/content/service.js';
import { meRoutes } from './modules/me/routes.js';
import { QrService } from './modules/qr/service.js';
import { qrRoutes } from './modules/qr/routes.js';
import { QrSigner } from './modules/qr/signing.js';
import { RulesService } from './modules/rules/service.js';
import { rulesRoutes } from './modules/rules/routes.js';
import { PasswordService } from './modules/auth/password.js';
import { type AuthRepository, PostgresAuthRepository } from './modules/auth/repository.js';
import { authRoutes } from './modules/auth/routes.js';
import { AuthService } from './modules/auth/service.js';
import { TokenService } from './modules/auth/tokens.js';
import { createEmailService, type EmailService } from './shared/email/index.js';
import { AppError } from './shared/errors.js';

export interface BuildAppOptions {
  config?: AppConfig;
  db?: DatabaseClient;
  authRepository?: AuthRepository;
  emailService?: EmailService;
  embeddingProvider?: EmbeddingProvider | null;
  llmProvider?: LlmProvider | null;
  logger?: boolean;
}

export interface BuiltApplication {
  app: FastifyInstance;
  config: AppConfig;
  db: DatabaseClient;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
  tokenService: TokenService;
  passwordService: PasswordService;
  authService: AuthService;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<BuiltApplication> {
  const config = options.config ?? loadConfig();
  const db = options.db ?? new PostgresDatabaseClient(config);
  const authRepository = options.authRepository ?? new PostgresAuthRepository(db);
  const passwordService = new PasswordService(config);
  const tokenService = new TokenService(config);
  const emailService = options.emailService ?? createEmailService(config);
  const authMiddleware = createAuthMiddleware(tokenService);

  const authService = new AuthService(
    config,
    authRepository,
    passwordService,
    tokenService,
    emailService
  );

  const app = Fastify({
    logger:
      options.logger !== undefined
        ? options.logger
        : config.nodeEnv === 'test'
          ? false
          : {
              level: config.logLevel,
              redact: ['req.headers.authorization', 'req.body.password', 'req.body.newPassword'],
            },
    trustProxy: true,
  });

  app.decorateRequest('authUser', null);

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed by CORS policy.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(rateLimit, {
    global: true,
    max: config.rateLimit.globalMax,
    timeWindow: config.rateLimit.globalWindowMs,
    errorResponseBuilder: (_request, context) =>
      new AppError(
        429,
        'RATE_LIMIT_EXCEEDED',
        `Too many requests. Please try again in ${Math.ceil(context.ttl / 1000)} seconds.`
      ),
  });

  app.setErrorHandler((error: FastifyError | AppError | Error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      });
    }

    const fastifyErr = error as FastifyError;
    if (fastifyErr.statusCode && fastifyErr.statusCode >= 400 && fastifyErr.statusCode < 500) {
      return reply.status(fastifyErr.statusCode).send({
        success: false,
        error: {
          code: fastifyErr.code || 'BAD_REQUEST',
          message: fastifyErr.message || 'Invalid request.',
        },
      });
    }

    app.log.error(error, 'Unhandled internal server error');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal error occurred.',
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found.`,
      },
    });
  });

  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      data: {
        status: 'ok',
        service: 'pearl-travel-api',
        version: '0.1.0',
        environment: config.nodeEnv,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.get('/health/database', async (_request, reply) => {
    const health = await db.checkHealth();
    const httpStatus = health.status === 'healthy' ? 200 : 503;

    return reply.status(httpStatus).send({
      success: health.status === 'healthy',
      data: health,
    });
  });

  await app.register(authRoutes, {
    prefix: '/api/v1/auth',
    config,
    authService,
    authMiddleware,
  });

  const signer = new QrSigner(config.qr.privateKey, config.qr.keyId, config.nodeEnv !== 'production');
  const rulesService = new RulesService(db);
  const qrService = new QrService(db, signer, rulesService);

  const providers = createProviders(config);
  const assistant = new AssistantService(
    db,
    config,
    options.embeddingProvider !== undefined ? options.embeddingProvider : providers.embeddings,
    options.llmProvider !== undefined ? options.llmProvider : providers.llm
  );
  // Publishing guidance indexes it for semantic retrieval. Indexing problems never block publishing.
  const contentService = new ContentService(db, async (kind, id) => {
    if (kind === 'content') await assistant.indexContentItem(id).catch((e) => app.log.warn(e, 'KB indexing failed'));
  });

  await app.register(assistantRoutes, { prefix: '/api/v1/assistant', assistant, db, authMiddleware });
  await app.register(meRoutes, { prefix: '/api/v1/me', db, authMiddleware });
  await app.register(adminManagementRoutes, { prefix: '/api/v1/admin', db, content: contentService, assistant, authMiddleware });
  await app.register(rulesRoutes, { prefix: '/api/v1/rules', rules: rulesService });
  await app.register(qrRoutes, { prefix: '/api/v1/qr', qr: qrService, signer, authMiddleware });

  await app.register(adminRoutes, {
    prefix: '/api/v1/admin',
    db,
    authMiddleware,
  });

  app.addHook('onClose', async () => {
    await db.close();
  });

  return {
    app,
    config,
    db,
    authMiddleware,
    tokenService,
    passwordService,
    authService,
  };
}
