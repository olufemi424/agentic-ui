import { useEffect, useRef, useState } from 'react'

export default function useInvestmentsWatch() {
  const [ts, setTs] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/investments.watch')
    esRef.current = es
    const onPing = (e: MessageEvent) => {
      // keep-alive
    }
    const onChange = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        setTs(data.ts || Date.now())
      } catch {
        setTs(Date.now())
      }
    }
    es.addEventListener('ping', onPing as any)
    es.addEventListener('change', onChange as any)
    return () => {
      es.removeEventListener('ping', onPing as any)
      es.removeEventListener('change', onChange as any)
      es.close()
      esRef.current = null
    }
  }, [])

  return ts
}
