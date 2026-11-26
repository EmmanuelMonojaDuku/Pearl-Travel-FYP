import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { TokenService } from '../modules/auth/tokens.js';
import type { AuthenticatedContextUser } from '../modules/auth/types.js';
import { ForbiddenError, UnauthorizedError } from '../shared/errors.js';
import type { UserRole } from '../shared/roles.js';

declare module 'fastify' {
  interface FastifyRequest {
    authUser: AuthenticatedContextUser | null;
  }
}

export function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw new UnauthorizedError('Missing Authorization header.', 'MISSING_AUTH_HEADER');
  }

  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    throw new UnauthorizedError(
      'Authorization header must use Bearer <token> format.',
      'INVALID_AUTH_HEADER'
    );
  }

  return parts[1];
}

export function createAuthMiddleware(tokenService: TokenService) {
  const authenticate: preHandlerHookHandler = async (
    request: FastifyRequest,
    _reply: FastifyReply
  ) => {
    const token = extractBearerToken(request.headers.authorization);
    request.authUser = await tokenService.verifyAccessToken(token);
  };

  const optionalAuthenticate: preHandlerHookHandler = async (
    request: FastifyRequest,
    _reply: FastifyReply
  ) => {
    if (!request.headers.authorization) {
      request.authUser = null;
      return;
    }

    try {
      const token = extractBearerToken(request.headers.authorization);
      request.authUser = await tokenService.verifyAccessToken(token);
    } catch {
      request.authUser = null;
    }
  };

  const requireRoles = (...allowedRoles: UserRole[]): preHandlerHookHandler => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.authUser) {
        throw new UnauthorizedError('Authentication required.', 'UNAUTHORIZED');
      }

      const hasRole = request.authUser.roles.some((role) => allowedRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenError(
          `Requires one of the following roles: ${allowedRoles.join(', ')}.`,
          'INSUFFICIENT_ROLE'
        );
      }
    };
  };

  return {
    authenticate,
    optionalAuthenticate,
    requireRoles,
  };
}
