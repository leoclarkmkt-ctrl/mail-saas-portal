import nodemailer from "nodemailer";

export type ResetEmailPayload = {
  to: string;
  resetLink: string;
  locale: "en" | "zh";
};

const templates = {
  en: (link: string) => ({
    subject: "NSUK Mail Portal password reset",
    html: `
      <p>Dear user,</p>
      <p>We received a request to reset your NSUK Mail Portal password.</p>
      <p><a href="${link}">Reset your password</a> (valid for 60 minutes).</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  }),
  zh: (link: string) => ({
    subject: "NSUK 邮箱门户重置密码",
    html: `
      <p>您好，</p>
      <p>我们收到了重置 NSUK 邮箱门户密码的请求。</p>
      <p><a href="${link}">点击重置密码</a>（60 分钟内有效）。</p>
      <p>若非本人操作，请忽略此邮件。</p>
    `
  })
};

export async function sendResetEmail(payload: ResetEmailPayload) {
  const host = process.env.EMAIL_SMTP_HOST;
  const port = Number(process.env.EMAIL_SMTP_PORT ?? "587");
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("Missing email configuration");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const template = templates[payload.locale](payload.resetLink);

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: template.subject,
    html: template.html
  });
}
