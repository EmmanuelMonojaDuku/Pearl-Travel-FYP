import type {
  EmailDeliveryResult,
  EmailService,
  PasswordResetEmailPayload,
  VerificationEmailPayload,
} from './types.js';

/**
 * Explicit unconfigured adapter used when EMAIL_PROVIDER=disabled.
 * Never claims email delivery succeeded when no provider is configured.
 */
export class UnconfiguredEmailService implements EmailService {
  public isConfigured(): boolean {
    return false;
  }

  public getProviderName(): string {
    return 'disabled';
  }

  public async sendVerificationEmail(
    _payload: VerificationEmailPayload
  ): Promise<EmailDeliveryResult> {
    return {
      delivered: false,
      configured: false,
      provider: 'disabled',
      reason:
        'Transactional email provider is not configured (EMAIL_PROVIDER=disabled). Verification email was not dispatched.',
    };
  }

  public async sendPasswordResetEmail(
    _payload: PasswordResetEmailPayload
  ): Promise<EmailDeliveryResult> {
    return {
      delivered: false,
      configured: false,
      provider: 'disabled',
      reason:
        'Transactional email provider is not configured (EMAIL_PROVIDER=disabled). Password reset email was not dispatched.',
    };
  }
}
