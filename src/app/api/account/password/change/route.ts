import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mailer';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

const zxcvbnFactory = new ZxcvbnFactory({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
});
const zxcvbn = zxcvbnFactory.check.bind(zxcvbnFactory);

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { changeToken, newPassword } = await req.json();
  if (!changeToken || !newPassword) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const tokenHash = crypto.createHash('sha256').update(changeToken).digest('hex');

  const grant = await prisma.passwordChangeGrant.findFirst({
    where: { 
      tokenHash,
      userId: session.user.id,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!grant) {
    return NextResponse.json({ error: 'Invalid or expired grant' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Validate new password rules server-side
  if (newPassword.length < 12) {
    return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
  }

  const isSame = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSame) {
    return NextResponse.json({ error: 'Cannot reuse the same password' }, { status: 400 });
  }

  // Zxcvbn check
  const username = user.email.split('@')[0];
  let displayName = username;
  try {
    if (user.preferences) {
      displayName = JSON.parse(user.preferences).displayName || username;
    }
  } catch (e) {}

  const result = zxcvbn(newPassword, [username, user.email, displayName]);
  if (result.score < 3) {
    return NextResponse.json({ error: 'Password is too weak' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Transaction
  await prisma.$transaction([
    prisma.passwordChangeGrant.update({
      where: { id: grant.id },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash,
        mustChangePassword: false 
      }
    })
  ]);

  console.log(`AUDIT: PASSWORD_CHANGED for user ${user.id}`);

  await sendEmail({
    to: user.email,
    subject: 'Your password was changed',
    text: 'Your password was changed successfully.',
    html: '<p>Your password was changed successfully.</p>'
  });

  return NextResponse.json({ success: true });
}
