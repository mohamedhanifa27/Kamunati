import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/featureFlags';
import { getDashboardMetrics } from '@/lib/admin/metrics';

// Keep connection open and send SSE updates
export async function GET(req: Request) {
  if (!featureFlags.adminRealtime || !featureFlags.adminLiveCards) {
    return NextResponse.json({ error: 'NOT_IMPLEMENTED' }, { status: 501 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let seq = 1;

      // 1. Snapshot on load
      try {
        const metrics = await getDashboardMetrics();
        const payload = `data: ${JSON.stringify({ type: 'snapshot', seq, data: metrics })}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
        seq++;
      } catch (err) {
        console.error('SSE snapshot error:', err);
      }

      // 2. Deltas pushed by server (simulate live updates with polling for this demo)
      const interval = setInterval(async () => {
        try {
          const metrics = await getDashboardMetrics();
          const payload = `data: ${JSON.stringify({ type: 'delta', seq, data: metrics })}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
          seq++;
        } catch (err) {
          console.error('SSE delta error:', err);
        }
      }, 5000); // 5s delta polling

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
