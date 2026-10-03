import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { order } = await req.json(); // Array of watchlist item IDs
    
    const userId = session.user.id;
    const updates = order.map((id: string, index: number) => 
      prisma.watchlist.updateMany({
        where: { id, userId },
        data: { sortOrder: index }
      })
    );
    
    await prisma.$transaction(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
