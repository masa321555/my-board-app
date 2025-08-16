export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export type EmailTemplate = 
  | 'welcome'
  | 'verification'
  | 'password-reset'
  | 'notification';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailRateLimit {
  key: string;
  count: number;
  resetAt: Date;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: EmailTemplate;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  messageId?: string;
  sentAt?: Date;
  attempts: number;
  createdAt: Date;
}