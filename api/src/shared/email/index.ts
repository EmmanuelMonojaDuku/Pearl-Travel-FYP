import type { AppConfig } from '../../config/env.js';
import { ResendEmailService } from './resendEmailService.js';
import type { EmailService } from './types.js';
import { UnconfiguredEmailService } from './unconfiguredEmailService.js';

export type {
  EmailDeliveryResult,
  EmailService,
  PasswordResetEmailPayload,
  VerificationEmailPayload,
} from './types.js';
export { ResendEmailService } from './resendEmailService.js';
export { UnconfiguredEmailService } from './unconfiguredEmailService.js';

export function createEmailService(config: AppConfig): EmailService {
  if (config.email.provider === 'resend') {
    return new ResendEmailService({
      apiKey: config.email.resendApiKey,
      from: config.email.from,
    });
  }

  return new UnconfiguredEmailService();
}
