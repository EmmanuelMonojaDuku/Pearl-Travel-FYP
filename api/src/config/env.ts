import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const booleanStringSchema = z
  .enum(['true', 'false', '1', '0'])
  .default('true')
  .transform((val) => val === 'true' || val === '1');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_EMAILS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
    .refine(
      (emails) => emails.every((email) => z.string().email().safeParse(email).success),
      'ADMIN_EMAILS must contain only valid comma-separated email addresses.'
    ),

  DATABASE_URL: z.string().optional().default(''),
  MIGRATION_DATABASE_URL: z.string().optional().default(''),
  DB_SSL_MODE: z.enum(['require', 'verify-full', 'disable']).default('require'),
  DB_SSL_REJECT_UNAUTHORIZED: booleanStringSchema,
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(500).default(5000),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  JWT_ISSUER: z.string().min(1).default('pearl-travel-api'),
  JWT_AUDIENCE: z.string().min(1).default('pearl-travel-clients'),

  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).max(31536000).default(2592000),
  EMAIL_VERIFICATION_TTL_SECONDS: z.coerce.number().int().min(300).max(604800).default(86400),
  PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().min(300).max(86400).default(1800),

  ARGON2_MEMORY_COST_KIB: z.coerce.number().int().min(4096).max(524288).default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().min(2).max(20).default(3),
  ARGON2_PARALLELISM: z.coerce.number().int().min(1).max(8).default(1),

  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),

  REQUIRE_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // QR pass signing (Ed25519, PKCS#8 PEM, optionally base64-encoded). Required in production.
  QR_SIGNING_PRIVATE_KEY: z.string().optional().default(''),
  QR_SIGNING_KEY_ID: z.string().min(1).max(40).default('k1'),

  // RAG assistant. Any OpenAI-compatible API works (OpenAI, Azure OpenAI, OpenRouter, a local server).
  LLM_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  LLM_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  RAG_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.3),
  RAG_TOP_K: z.coerce.number().int().min(1).max(10).default(4),
  /** When approved guidance has no answer, let the model answer general travel questions, clearly labelled as not from approved guidance. */
  RAG_ALLOW_GENERAL: z.enum(['true', 'false']).default('true'),

  EMAIL_PROVIDER: z.enum(['disabled', 'resend']).default('disabled'),
  EMAIL_FROM: z.string().email().default('noreply@example.com'),
  RESEND_API_KEY: z.string().optional().default(''),
});

export type AppConfig = Readonly<{
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  corsOrigins: string[];
  appBaseUrl: string;
  adminEmails: string[];
  requireEmailVerification: boolean;
  qr: { privateKey: string; keyId: string };
  rag: { baseUrl: string; apiKey: string; model: string; embeddingModel: string; minSimilarity: number; topK: number; allowGeneral: boolean };
  database: {
    url: string;
    migrationUrl: string;
    sslMode: 'require' | 'verify-full' | 'disable';
    sslRejectUnauthorized: boolean;
    poolMax: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  auth: {
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    jwtIssuer: string;
    jwtAudience: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
    emailVerificationTtlSeconds: number;
    passwordResetTtlSeconds: number;
    argon2MemoryCostKib: number;
    argon2TimeCost: number;
    argon2Parallelism: number;
  };
  rateLimit: {
    globalMax: number;
    globalWindowMs: number;
    authMax: number;
    authWindowMs: number;
  };
  email: {
    provider: 'disabled' | 'resend';
    from: string;
    resendApiKey: string;
  };
}>;

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid API environment configuration: ${details}`);
  }

  const data = parsed.data;
  if (data.NODE_ENV === 'production') {
    if (
      data.JWT_ACCESS_SECRET.startsWith('CHANGE_ME') ||
      data.JWT_REFRESH_SECRET.startsWith('CHANGE_ME')
    ) {
      throw new Error('Production deployment cannot use placeholder JWT secrets.');
    }
    if (!data.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production mode.');
    }
  }

  if (data.EMAIL_PROVIDER === 'resend' && !data.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend.');
  }

  return {
    nodeEnv: data.NODE_ENV,
    host: data.HOST,
    port: data.PORT,
    logLevel: data.LOG_LEVEL,
    corsOrigins: data.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    appBaseUrl: data.APP_BASE_URL.replace(/\/+$/, ''),
    adminEmails: data.ADMIN_EMAILS,
    requireEmailVerification: data.REQUIRE_EMAIL_VERIFICATION,
    qr: { privateKey: data.QR_SIGNING_PRIVATE_KEY.trim(), keyId: data.QR_SIGNING_KEY_ID },
    rag: {
      baseUrl: data.LLM_BASE_URL.replace(/\/+$/, ''),
      apiKey: data.LLM_API_KEY.trim(),
      model: data.LLM_MODEL,
      embeddingModel: data.EMBEDDING_MODEL,
      minSimilarity: data.RAG_MIN_SIMILARITY,
      topK: data.RAG_TOP_K,
      allowGeneral: data.RAG_ALLOW_GENERAL === 'true',
    },
    database: {
      url: data.DATABASE_URL.trim(),
      migrationUrl: (data.MIGRATION_DATABASE_URL || data.DATABASE_URL).trim(),
      sslMode: data.DB_SSL_MODE,
      sslRejectUnauthorized: data.DB_SSL_REJECT_UNAUTHORIZED,
      poolMax: data.DB_POOL_MAX,
      idleTimeoutMs: data.DB_IDLE_TIMEOUT_MS,
      connectionTimeoutMs: data.DB_CONNECTION_TIMEOUT_MS,
    },
    auth: {
      jwtAccessSecret: data.JWT_ACCESS_SECRET,
      jwtRefreshSecret: data.JWT_REFRESH_SECRET,
      jwtIssuer: data.JWT_ISSUER,
      jwtAudience: data.JWT_AUDIENCE,
      accessTokenTtlSeconds: data.ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenTtlSeconds: data.REFRESH_TOKEN_TTL_SECONDS,
      emailVerificationTtlSeconds: data.EMAIL_VERIFICATION_TTL_SECONDS,
      passwordResetTtlSeconds: data.PASSWORD_RESET_TTL_SECONDS,
      argon2MemoryCostKib: data.ARGON2_MEMORY_COST_KIB,
      argon2TimeCost: data.ARGON2_TIME_COST,
      argon2Parallelism: data.ARGON2_PARALLELISM,
    },
    rateLimit: {
      globalMax: data.RATE_LIMIT_MAX,
      globalWindowMs: data.RATE_LIMIT_WINDOW_MS,
      authMax: data.AUTH_RATE_LIMIT_MAX,
      authWindowMs: data.AUTH_RATE_LIMIT_WINDOW_MS,
    },
    email: {
      provider: data.EMAIL_PROVIDER,
      from: data.EMAIL_FROM,
      resendApiKey: data.RESEND_API_KEY,
    },
  };
}
