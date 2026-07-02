import * as nodemailer from "nodemailer";

export type SmtpSecurityType = "none" | "ssl_tls" | "starttls";

export type SendSmtpEmailInput = {
  host: string;
  port: number;
  securityType: SmtpSecurityType;
  username?: string | null;
  password?: string | null;
  fromEmail: string;
  fromName?: string | null;
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function buildFromAddress({
  fromEmail,
  fromName,
}: {
  fromEmail: string;
  fromName?: string | null;
}) {
  const trimmedName = String(fromName ?? "").trim();

  if (!trimmedName) {
    return fromEmail;
  }

  return `"${trimmedName.replace(/"/g, "'")}" <${fromEmail}>`;
}

export async function sendSmtpEmail({
  host,
  port,
  securityType,
  username,
  password,
  fromEmail,
  fromName,
  to,
  subject,
  text,
  html,
}: SendSmtpEmailInput) {
  const normalizedUsername = String(username ?? "").trim();
  const normalizedPassword = String(password ?? "");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: securityType === "ssl_tls",
    requireTLS: securityType === "starttls",
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth:
      normalizedUsername && normalizedPassword
        ? {
          user: normalizedUsername,
          pass: normalizedPassword,
        }
        : undefined,
  });

  await transporter.sendMail({
    from: buildFromAddress({
      fromEmail,
      fromName,
    }),
    to,
    subject,
    text,
    html,
  });
}