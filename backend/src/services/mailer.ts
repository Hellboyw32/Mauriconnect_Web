import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export function createSmtpMailer(options: { host: string; port: number; secure: boolean; user: string; password: string; from: string }): Mailer {
  const transport = nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.secure,
    auth: options.user ? { user: options.user, pass: options.password } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return {
    async send(message) {
      await transport.sendMail({ from: options.from, ...message });
    },
  };
}

/** Development: writes each email as an .eml file you can open in any mail client. */
export function createPreviewMailer(dir: string, from: string): Mailer {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' });
  return {
    async send(message) {
      const info = await transport.sendMail({ from, ...message });
      await fs.mkdir(dir, { recursive: true });
      const safeSubject = message.subject.replace(/[^A-Za-z0-9-]+/g, '_').slice(0, 60);
      await fs.writeFile(path.join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}_${safeSubject}.eml`), info.message as Buffer);
    },
  };
}

/** Tests: keeps messages in memory and can be told to fail. */
export class MemoryMailer implements Mailer {
  readonly sent: MailMessage[] = [];
  failuresLeft = 0;

  async send(message: MailMessage) {
    if (this.failuresLeft > 0) {
      this.failuresLeft--;
      throw new Error('SMTP unavailable (simulated)');
    }
    this.sent.push(message);
  }
}
