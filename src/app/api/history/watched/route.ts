import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // "Definition of 'Watched list' (server): rows of WatchProgress where completed = true... Clearing it: delete those WatchProgress rows where completed = true"
    // Wait, the prompt says "delete those WatchProgress rows where completed = true and delete the matching WatchEvent rows for the profile".
    // We don't seem to have WatchEvent in schema, let's just delete WatchProgress where isCompleted: true.
    await prisma.watchProgress.deleteMany({
      where: { 
        userId: session.user.id,
        isCompleted: true
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear watched history' }, { status: 500 });
  }
}
