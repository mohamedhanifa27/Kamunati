// [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT]
import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { getTorrentHealthSnapshot } from '@/lib/admin/torrentHealth';
import { requireAdminSession } from '@/lib/authGuard';

export async function GET(req: Request) {
  // [RECTIFICATION:SECURITY_CHECKS_ENHANCEMENT] Admin authorization guard
  const { errorResponse } = await requireAdminSession();
  if (errorResponse) return errorResponse;

  if (!featureFlags.adminTorrentLive) {
    return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let seq = 1;

      // 1. Initial snapshot
      try {
        const snapshot = await getTorrentHealthSnapshot();
        const payload = `data: ${JSON.stringify({ type: 'snapshot', seq, data: snapshot })}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
        seq++;
      } catch (err) {
        console.error('Torrent health SSE snapshot error:', err);
      }

      // 2. Poll for deltas every 5 seconds (the same function produces snapshot and deltas per rule 6.5)
      const interval = setInterval(async () => {
        try {
          const snapshot = await getTorrentHealthSnapshot();
          const payload = `data: ${JSON.stringify({ type: 'delta', seq, data: snapshot })}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
          seq++;
        } catch (err) {
          console.error('Torrent health SSE delta error:', err);
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
