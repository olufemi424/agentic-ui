import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'

import getTools from '@/utils/demo.tools'

const SYSTEM_PROMPT = `You are a helpful assistant for a store that sells guitars.

You can use the following tools to help the user:

- getGuitars: Get all guitars from the database
- recommendGuitar: Recommend a guitar to the user
`

export const ServerRoute = createServerFileRoute('/api/demo-chat').methods({
  POST: async ({ request }) => {
    try {
      const { messages } = await request.json()

      const tools = await getTools()

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
