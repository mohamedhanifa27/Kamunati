export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferences = await req.json();
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferences: JSON.stringify(preferences) }
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync preferences' }, { status: 500 });
  }
}

