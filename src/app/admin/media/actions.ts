'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function deleteMedia(id: string) {
  try {
    await prisma.media.delete({
      where: { id }
    });
    revalidatePath('/admin/media');
  } catch (error) {
    console.error('Failed to delete media:', error);
    throw new Error('Failed to delete media');
  }
}
