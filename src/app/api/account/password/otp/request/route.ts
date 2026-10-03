import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mailer';

const prisma = new PrismaClient();
const SERVER_PEPPER = process.env.OTP_PEPPER || 'dev-pepper';
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

// Extremely basic in-memory rate limiter for dev purposes
const rateLimitCache = new Map<string, { requests: number, resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  let entry = rateLimitCache.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { requests: 0, resetAt: now + windowMs };
    rateLimitCache.set(key, entry);
  }
  entry.requests++;
  if (entry.requests > limit) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }
  return 0;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 1 per 60s, 5 per hour
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const retryAfterUser = checkRateLimit(`user_${session.user.id}_60s`, 1, 60 * 1000) 
                      || checkRateLimit(`user_${session.user.id}_1h`, 5, 3600 * 1000);
  const retryAfterIp = checkRateLimit(`ip_${ip}_1h`, 10, 3600 * 1000);
  
  const retryAfter = Math.max(retryAfterUser || 0, retryAfterIp || 0);
  if (retryAfter > 0) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: { 'Retry-After': retryAfter.toString() } });
  }

  const { currentPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Verify current password (skip if admin-created and must change)
  if (!user.mustChangePassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'That password is not correct' }, { status: 400 });
  }

  // Generate code
  const code = crypto.randomInt(0, 1000000).toString().padStart(OTP_LENGTH, '0');
  
  // Hash code
  const salt = crypto.randomBytes(16).toString('hex');
  const codeHash = crypto.createHmac('sha256', SERVER_PEPPER).update(code + salt).digest('hex');

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60000);

  // Invalidate previous challenges
  await prisma.otpChallenge.updateMany({
    where: { userId: user.id, purpose: 'PASSWORD_CHANGE', consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() } // Mark consumed so they are invalid
  });

  await prisma.otpChallenge.create({
    data: {
      userId: user.id,
      purpose: 'PASSWORD_CHANGE',
      codeHash,
      salt,
      attempts: 0,
      maxAttempts: 5,
      expiresAt
    }
  });

  // Send email
  await sendEmail({
    to: user.email,
    subject: 'Kamunati Password Change Code',
    text: `Your security code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <h2>Password Change Request</h2>
      <p>Your security code is <strong>${code}</strong>.</p>
      <p>It expires in ${OTP_TTL_MINUTES} minutes.</p>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Device: Approximate device info</p>
      <p><em>If you didn't request this, please secure your account.</em></p>
    `
  });

  return NextResponse.json({ success: true, email: user.email });
}
