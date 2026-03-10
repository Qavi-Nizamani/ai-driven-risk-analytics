import * as Brevo from "@getbrevo/brevo";
import { createLogger } from "@risk-engine/logger";
import { getEmailClient } from "./client";

const logger = createLogger("email");

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
}

const DEFAULT_FROM = "alerts@vigilry.com";
const DEFAULT_FROM_NAME = "Vigilry";

/**
 * Sends a transactional email via Brevo.
 * Never throws — logs on failure so callers are not affected.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const {
    to,
    subject,
    html,
    from = DEFAULT_FROM,
    fromName = DEFAULT_FROM_NAME,
  } = options;

  const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({
    email,
  }));

  try {
    const client = getEmailClient();
    const email = new Brevo.SendSmtpEmail();
    email.sender = { email: from, name: fromName };
    email.to = recipients;
    email.subject = subject;
    email.htmlContent = html;

    await client.sendTransacEmail(email);
    logger.info({ to, subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to, subject }, "Email send failed");
  }
}
