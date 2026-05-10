import { Resend } from "resend";

import { env } from "@/lib/env";

import { escapeHtml } from "./utils";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string, orgName: string): Promise<void> {
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: `Welcome to ${escapeHtml(orgName)}`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your account has been created on ${escapeHtml(orgName)}. You can log in at any time to set up your password and access the platform.</p>
      <p><a href="${env.APP_URL}">${env.APP_URL}</a></p>
    `,
  });
}

export async function sendAccountSetupEmail(
  to: string,
  name: string,
  setupUrl: string
): Promise<void> {
  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: "Set up your account password",
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Click the link below to set your password and access the platform:</p>
      <p><a href="${setupUrl}">Set up your password</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
