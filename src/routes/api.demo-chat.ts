import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'

import getTools from '@/utils/demo.tools'

const SYSTEM_PROMPT = `You are a helpful assistant.

Rules:
- For any CREATE/UPDATE/DELETE on investments, DO NOT execute directly.
- First call the corresponding propose-* tool to return a proposed action payload.
- Wait for the user to confirm via the UI. Only then, after user confirmation, may the system execute the actual tool.
- Queries (list/search/insights) can be executed autonomously.

Image safety:
- When showing product images, use the exact URLs provided by tools. Do not change domains.
`

export const ServerRoute = createServerFileRoute('/api/demo-chat').methods({
  POST: async ({ request }) => {
    try {
      const { messages } = await request.json()

      const reqUrl = new URL(request.url)
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
        stopWhen: stepCountIs(6),
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
