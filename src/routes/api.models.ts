import { createServerFileRoute } from '@tanstack/react-start/server'

export const ServerRoute = createServerFileRoute('/api/models').methods({
  GET: async () => {
    // Detect available providers via env. This is a simple presence check.
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
    const hasMistral = !!process.env.MISTRAL_API_KEY

    const models = [
      hasOpenAI && { id: 'openai:gpt-4o-mini', label: 'OpenAI: gpt-4o-mini' },
      hasAnthropic && { id: 'anthropic:claude-3-5-sonnet', label: 'Anthropic: Claude 3.5 Sonnet' },
      hasMistral && { id: 'mistral:large-latest', label: 'Mistral: Large (latest)' },
    ].filter(Boolean)

    return new Response(JSON.stringify({ models }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
})
