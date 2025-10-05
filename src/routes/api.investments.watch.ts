import { createServerFileRoute } from '@tanstack/react-start/server'
import fs from 'fs'
import { getInvestmentsDbFilePath } from '@/lib/investments-db'

export const ServerRoute = createServerFileRoute('/api/investments/watch').methods({
  GET: async () => {
    const dbFile = getInvestmentsDbFilePath()
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder()
        const send = (event: string, data: any) => {
          controller.enqueue(enc.encode(`event: ${event}\n`))
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
        send('hello', { ok: true })
        // Watch the file for changes
        const watcher = fs.watch(dbFile, { persistent: false }, (eventType) => {
          if (eventType === 'change') {
            send('change', { file: dbFile, ts: Date.now() })
          }
        })
        const interval = setInterval(() => send('ping', { ts: Date.now() }), 30000)
        return () => {
          clearInterval(interval)
          watcher.close()
        }
      },
      cancel() {},
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
})
