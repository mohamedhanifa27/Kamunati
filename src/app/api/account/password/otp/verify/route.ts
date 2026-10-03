import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const SERVER_PEPPER = process.env.OTP_PEPPER || 'dev-pepper';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const challenge = await prisma.otpChallenge.findFirst({
    where: { 
      userId: session.user.id,
      purpose: 'PASSWORD_CHANGE',
      consumedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { expiresAt: 'desc' }
  });

  if (!challenge) {
    return NextResponse.json({ error: 'No active challenge found. Please request a new code.' }, { status: 400 });
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    return NextResponse.json({ error: 'Maximum attempts reached. Please request a new code.' }, { status: 403 });
  }

  const hashToTest = crypto.createHmac('sha256', SERVER_PEPPER).update(code + challenge.salt).digest('hex');
  
  const isMatch = crypto.timingSafeEqual(Buffer.from(hashToTest, 'hex'), Buffer.from(challenge.codeHash, 'hex'));

  if (!isMatch) {
    const attempts = challenge.attempts + 1;
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts }
    });
    return NextResponse.json({ error: 'Invalid code', attempts, maxAttempts: challenge.maxAttempts }, { status: 400 });
  }

  // Success: consume challenge and issue grant
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() }
  });

  const changeToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(changeToken).digest('hex');

  await prisma.passwordChangeGrant.create({
    data: {
      userId: session.user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 10 * 60000) // 10 minutes validity
    }
  });

  return NextResponse.json({ success: true, changeToken });
}
