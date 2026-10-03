import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth'; // root/auth.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        preferences: true,
        createdAt: true,
        role: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let preferences = {};
    try {
      if (user.preferences) {
        preferences = JSON.parse(user.preferences);
      }
    } catch(e) {}

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      displayName: (preferences as any).displayName || session.user.name || user.email.split('@')[0],
      avatar: (preferences as any).avatar || null,
      preferences
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let preferences: any = {};
    if (user.preferences) {
      try { preferences = JSON.parse(user.preferences); } catch (e) {}
    }

    // Update allowed fields
    const allowedKeys = ['displayName', 'avatar', 'maturityLimit', 'kidsMode', 'language', 'subtitle', 'autoplay'];
    let changed = false;
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        preferences[key] = body[key];
        changed = true;
      }
    }

    if (changed) {
      await prisma.user.update({
        where: { id: user.id },
        data: { preferences: JSON.stringify(preferences) }
      });
    }

    return NextResponse.json({ success: true, profile: { ...user, preferences } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
