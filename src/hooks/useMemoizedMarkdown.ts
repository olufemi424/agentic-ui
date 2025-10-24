import { useMemo, useRef } from 'react'

// Simple hash function for text caching
function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

export function useMemoizedMarkdown(text: string) {
  const cacheRef = useRef<Map<string, string>>(new Map())

  return useMemo(() => {
    const hash = hashText(text)

    if (cacheRef.current.has(hash)) {
      return cacheRef.current.get(hash)!
    }

    // Store text in cache (already validated/parsed by ReactMarkdown)
    cacheRef.current.set(hash, text)

    // Prevent unbounded growth
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value
      if (firstKey) {
        cacheRef.current.delete(firstKey)
      }
    }

    return text
  }, [text])
}
