import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { featureFlags } from '@/lib/featureFlags';
// using bcrypt for password hashing
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  if (!featureFlags.adminUserAccess) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        preferences: true,
        createdAt: true,
        lastLoginAt: true,
        presence: true,
        restrictions: {
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = users.map(u => {
      let displayName = 'User';
      if (u.preferences) {
        try {
          const pref = JSON.parse(u.preferences as string);
          if (pref.displayName) displayName = pref.displayName;
        } catch(e) {}
      }
      return { ...u, displayName };
    });

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!featureFlags.adminUserAccess) return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });

  try {
    const body = await req.json();
    const { email, password, role } = body;
    if (!email || !password) return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'USER',
        status: 'ACTIVE',
        preferences: JSON.stringify({ displayName: email.split('@')[0] })
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
