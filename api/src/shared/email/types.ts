export interface VerificationEmailPayload {
  to: string;
  fullName: string;
  verificationToken: string;
  verificationUrl: string;
  expiresInMinutes: number;
}

export interface PasswordResetEmailPayload {
  to: string;
  fullName: string;
  resetToken: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  configured: boolean;
  provider: string;
  messageId?: string;
  reason?: string;
}

export interface EmailService {
  isConfigured(): boolean;
  getProviderName(): string;
  sendVerificationEmail(payload: VerificationEmailPayload): Promise<EmailDeliveryResult>;
  sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<EmailDeliveryResult>;
}
