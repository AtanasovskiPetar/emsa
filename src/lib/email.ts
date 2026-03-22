import { Resend } from "resend";

import { env } from "@/lib/env";

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
