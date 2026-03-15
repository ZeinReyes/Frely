import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import axios from 'axios';
import prisma from './database';

const sendBrevoEmail = async (to: string, subject: string, htmlContent: string) => {
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: process.env.BREVO_FROM_NAME || 'Vyrn',
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
};

export const auth = betterAuth({
  // Database
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  // App URL
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET!,

  // Email & Password auth
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,

    // Send password reset email via Brevo
    sendResetPassword: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      void sendBrevoEmail(user.email, 'Reset your Vyrn password', buildPasswordResetEmail(user.name, url));
    },
  },

  // Email verification — separate block, void to prevent timing issues
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    redirectTo: 'http://localhost:3000/dashboard',
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      console.log('📧 Sending verification email to:', user.email);
      void sendBrevoEmail(user.email, 'Verify your Vyrn account', buildVerificationEmail(user.name, url));
      console.log('✅ Email dispatched!');
    },
  },

  // Session config
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },

  // Trusted origins
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],

  // After user signs up — sync fullName from name field
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await prisma.user.update({
            where: { id: user.id },
            data: { fullName: user.name },
          });
        },
      },
    },
  },
});

export type Auth = typeof auth;

// ─────────────────────────────────────────
// EMAIL TEMPLATES
// ─────────────────────────────────────────

function buildVerificationEmail(name: string, url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Inter, sans-serif; background: #F9FAFB; padding: 40px 0; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="background: #6C63FF; padding: 32px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">VYRN</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px;">Welcome, ${name}!</h2>
          <p style="color: #6B7280; margin: 0 0 24px; line-height: 1.6;">
            Thanks for signing up. Please verify your email address to get started.
          </p>
          <a href="${url}" style="display: inline-block; background: #6C63FF; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Verify Email Address
          </a>
          <p style="color: #9CA3AF; margin: 24px 0 0; font-size: 13px;">
            This link expires in 24 hours. If you didn't create a Vyrn account, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildPasswordResetEmail(name: string, url: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Inter, sans-serif; background: #F9FAFB; padding: 40px 0; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <div style="background: #6C63FF; padding: 32px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">VYRN</h1>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #111827; margin: 0 0 12px; font-size: 20px;">Reset your password</h2>
          <p style="color: #6B7280; margin: 0 0 8px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #6B7280; margin: 0 0 24px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <a href="${url}" style="display: inline-block; background: #6C63FF; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
            Reset Password
          </a>
          <p style="color: #9CA3AF; margin: 24px 0 0; font-size: 13px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}