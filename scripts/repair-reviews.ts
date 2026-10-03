import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting review aggregate repair...');
  
  const medias = await prisma.media.findMany({ select: { id: true, title: true } });
  let fixed = 0;
  
  for (const media of medias) {
    const agg = await prisma.review.aggregate({
      where: { mediaId: media.id, status: 'VISIBLE' },
      _count: true,
      _avg: { rating: true }
    });
    
    await prisma.media.update({
      where: { id: media.id },
      data: {
        reviewCount: agg._count || 0,
        reviewAvgRating: agg._avg.rating || 0
      }
    });
    
    fixed++;
    if (fixed % 100 === 0) console.log(`Processed ${fixed} titles`);
  }
  
  console.log(`Finished repairing ${fixed} titles.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
