import { subscribeToTriage } from '@/lib/store';
import { vitalsEmitter, getLatestVitals, startVitals } from '@/lib/vitals';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  startVitals();

  // public clients only get a ping, not patient data
  const isPublic = new URL(req.url).searchParams.get('view') === 'public';

  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event, data) => {
        try {
          const body = typeof data === 'string' ? data : JSON.stringify(data);
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${body}\n\n`));
        } catch {
          // closed
        }
      };

      const unsubscribe = subscribeToTriage((json) => send('triage_update', isPublic ? '{}' : json));
      const onReading = (reading) => send('vitals', reading);
      vitalsEmitter.on('reading', onReading);
      send('vitals', getLatestVitals());

      const ping = setInterval(() => send('ping', { time: new Date().toISOString() }), 15000);

      cleanup = () => {
        clearInterval(ping);
        vitalsEmitter.off('reading', onReading);
        unsubscribe();
      };
    },

    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
