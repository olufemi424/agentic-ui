import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'

import getTools from '@/utils/demo.tools'

const SYSTEM_PROMPT = `You are a helpful assistant for a store that sells guitars.

You can use the following tools to help the user:

- getGuitars: Get all guitars from the database
- recommendGuitar: Recommend a guitar to the user

Important: When showing product images, use the exact URLs provided by tools. Do not change domains or rewrite image hosts.
`

export const ServerRoute = createServerFileRoute('/api/demo-chat').methods({
  POST: async ({ request }) => {
    try {
      const { messages } = await request.json()

      const reqUrl = new URL(request.url)
      // Prefer X-Forwarded-Proto/Host when present (behind proxies)
      const forwardedProto = request.headers.get('x-forwarded-proto')
      const forwardedHost = request.headers.get('x-forwarded-host')
      const origin = forwardedHost
        ? `${forwardedProto || 'https'}://${forwardedHost}`
        : reqUrl.origin

      const tools = await getTools({ origin })

      const result = await streamText({
        model: openai('gpt-4o-mini'),
        messages: convertToModelMessages(messages),
        temperature: 0.7,
        stopWhen: stepCountIs(5),
        system: SYSTEM_PROMPT,
        tools,
      })

      return result.toUIMessageStreamResponse()
    } catch (error) {
      console.error('Chat API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process chat request' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  },
})
