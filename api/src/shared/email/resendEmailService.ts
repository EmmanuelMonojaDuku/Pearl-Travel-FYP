import type {
  EmailDeliveryResult,
  EmailService,
  PasswordResetEmailPayload,
  VerificationEmailPayload,
} from './types.js';

export interface ResendConfig {
  apiKey: string;
  from: string;
}

export class ResendEmailService implements EmailService {
  private readonly apiKey: string;
  private readonly from: string;

  constructor(config: ResendConfig) {
    this.apiKey = config.apiKey;
    this.from = config.from;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.from);
  }

  public getProviderName(): string {
    return 'resend';
  }

  public async sendVerificationEmail(
    payload: VerificationEmailPayload
  ): Promise<EmailDeliveryResult> {
    const subject = 'Verify your Pearl Travel account email';
    const text = [
      `Hello ${payload.fullName},`,
      '',
      'Please verify your Pearl Travel email address using the link below:',
      payload.verificationUrl,
      '',
      `This single-use verification link expires in ${payload.expiresInMinutes} minutes.`,
      'If you did not create a Pearl Travel account, you can safely ignore this message.',
    ].join('\n');

    return this.dispatchEmail(payload.to, subject, text);
  }

  public async sendPasswordResetEmail(
    payload: PasswordResetEmailPayload
  ): Promise<EmailDeliveryResult> {
    const subject = 'Reset your Pearl Travel password';
    const text = [
      `Hello ${payload.fullName},`,
      '',
      'A password reset was requested for your Pearl Travel account. Use the single-use link below:',
      payload.resetUrl,
      '',
      `This link expires in ${payload.expiresInMinutes} minutes.`,
      'If you did not request a password reset, please ignore this message.',
    ].join('\n');

    return this.dispatchEmail(payload.to, subject, text);
  }

  private async dispatchEmail(
    to: string,
    subject: string,
    text: string
  ): Promise<EmailDeliveryResult> {
    if (!this.isConfigured()) {
      return {
        delivered: false,
        configured: false,
        provider: 'resend',
        reason: 'Missing RESEND_API_KEY or EMAIL_FROM.',
      };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown upstream error');
      return {
        delivered: false,
        configured: true,
        provider: 'resend',
        reason: `Email provider returned HTTP ${response.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const body = (await response.json()) as { id?: string };
    return {
      delivered: true,
      configured: true,
      provider: 'resend',
      messageId: body.id,
    };
  }
}
