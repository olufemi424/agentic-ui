## TS AI v5 – AI Agent + Tooling Pattern


### 1) Features in this codebase

- **Chat with AI (OpenAI gpt-4o-mini via ai-sdk)**: Streaming chat, markdown rendering, code highlighting.
- **Tool calling**: Model can call `getGuitars` and `recommendGuitar` through server-exposed tools.
- **Product demo**: Static guitar dataset rendered as rich cards; model recommendations show actionable UI.
- **Voice I/O**: Client-side audio recording → `/api/transcribe` (Whisper-1) → text; AI output → `/api/tts` (TTS-1) → playable audio.
- **Image origin safety**: Server constructs absolute image URLs; client normalizes known guitar images to current origin.
- **UI variants**: Full chat page (`/`) and compact floating assistant (`example-AIAssistant`).
- **MCP demo (SSE)**: Conceptual example to expose tools over SSE (`/api/sse`, `/api/messages`).
- **Modern stack**: TanStack Start + Router, TanStack Store, Tailwind, TypeScript.


### 2) Project overview (end‑to‑end)

- **Frontend**
  - `src/routes/index.tsx`: Main chat UI using `useChat` with `DefaultChatTransport` to `/api/demo-chat`.
  - `src/components/example-AIAssistant.tsx`: Toggleable assistant with the same streaming/chat patterns.
  - `example-GuitarRecommendation.tsx`: Renders a recommended guitar; deep links into product page and closes the assistant.
  - Voice UI: `transcribe-button.tsx` + `useTranscribe` hook; `tts-button.tsx` + `useTextToSpeech` hook.
- **Server**
  - `src/routes/api.demo-chat.ts`: Core chat endpoint. Binds `origin`, wires `tools`, calls `streamText`, returns `result.toUIMessageStreamResponse()`.
  - `src/utils/demo.tools.ts`: Tool definitions. `getGuitars` returns dataset with absolute image URLs. `recommendGuitar` returns selected id.
  - `src/routes/api.transcribe.ts`: Audio → text (Whisper-1).
  - `src/routes/api.tts.ts`: Text → speech (TTS-1, mp3 binary).
  - MCP demo: `src/utils/demo.sse.ts`, `src/routes/api.sse.ts`, `src/routes/api.messages.ts`.
- **Data + Pages**
  - `src/data/example-guitars.ts` + `src/routes/example.guitars/*` for listing/detail pages.


### 3) How AI tool-calls integrate with the UI

- **Server advertises tools to the model**
  - In `/api/demo-chat`, `streamText({ model, messages, tools, system })` exposes tool schemas to the model.
  - `tools` are Zod-described, typed, and implement `execute` to return structured JSON.
- **Model invokes tools**
  - The model emits a tool call like `getGuitars{}` or `recommendGuitar{ id }` when helpful.
  - The AI runtime executes the function and streams back tool results as structured parts.
- **Client renders tool outputs as UI blocks**
  - Messages contain `parts`. Text parts render via `ReactMarkdown`.
  - Tool parts render custom components when `part.type === "tool-recommendGuitar"` and `part.state === "output-available"`.
  - Example: A `GuitarRecommendation` card appears inline in the chat with image, price, and a "View Details" action.
- **Origin-safe images**
  - Server computes absolute URLs using request `origin`. Client also normalizes known guitar images to current `window.location.origin`.


### 4) How the AI agent redefines UX in this app

- **From chat to action**: The assistant doesn’t just reply; it can inject actionable UI (recommendation cards) in the conversation.
- **Human-in-the-loop**: The agent proposes; the user decides (e.g., click "View Details"). The UI updates immediately via router navigation and store updates.
- **Multimodal convenience**: Speak to the app and hear responses. Transcription + TTS reduce friction for both input and output.
- **Trust by construction**: Origin handling prevents model-fabricated image hosts; tool schemas constrain behaviors; server executes the actual side effects.
- **Composable**: Tool UI cards can be expanded into flows: purchase, form-fill, scheduling—without leaving the chat context.


### 5) A reusable framework/pattern for any application

- **Define tools (server-side)**
  - Each capability is a typed function with `description`, `inputSchema`, `execute`.
  - Tools perform real work (DB queries, API calls, mutations) and return minimal structured outputs designed for UI rendering.
- **Expose tools to the model**
  - Pass `tools` into `streamText` (or equivalent). Keep a clear system prompt describing allowed tools and constraints.
- **Design UI renderers for tool outputs**
  - For each tool that returns UI-worthy data, add a renderer in the chat stream: map `part.type` → component.
  - Keep the component actionable: buttons that navigate, mutate state, or call APIs.
- **Close the loop with human actions**
  - After a tool card action, update state/navigate so the main UI reflects the change.
  - Optionally emit a follow-up user message back into the chat to keep the agent aware of what happened.
- **Origin and safety**
  - Build absolute URLs on the server; sanitize/normalize on the client. Validate inputs with Zod. Limit tool step count if needed.
- **Extending to arbitrary domains**
  - Replace guitars with your domain objects and flows: tickets, invoices, tasks, reservations, etc.
  - Example tool set:
    - `listItems{ filters }` → UI list card with images, stats, links.
    - `recommendItem{ id }` → recommendation card with CTA.
    - `createItem{ fields }` → returns a summary card and navigates to detail.
    - `updateItem{ id, patch }` → returns updated fields; UI shows a diff/confirmation.


### 6) Concrete implementation notes (from this repo)

- **Server chat**: `src/routes/api.demo-chat.ts`
  - Derives `origin` from `X-Forwarded-*` or request URL.
  - `streamText` with `openai('gpt-4o-mini')`, `convertToModelMessages(messages)`, `tools`, `system`.
- **Tools**: `src/utils/demo.tools.ts`
  - `getGuitars`: dataset → absolute URLs with `origin`.
  - `recommendGuitar`: returns `{ id }` which the client maps to a card.
- **Client chat**: `src/routes/index.tsx`, `src/components/example-AIAssistant.tsx`
  - `useChat` + `DefaultChatTransport` to `/api/demo-chat`.
  - Renders text via Markdown and maps tool-parts to `GuitarRecommendation`.
  - TTS button collects all text parts in a message and plays audio.
- **Voice**: `src/components/transcribe-button.tsx`, `src/hooks/useTranscribe.ts`, `src/routes/api.transcribe.ts`
- **TTS**: `src/components/tts-button.tsx`, `src/hooks/useTextToSpeech.ts`, `src/routes/api.tts.ts`
- **Product pages**: `src/routes/example.guitars/*` with client navigation from recommendation card.
- **MCP demo**: `src/utils/demo.sse.ts`, `/api/sse`, `/api/messages` show how an MCP tool server could stream events.


### 7) Applying the pattern quickly

- Start with your domain and write 2–3 tools with minimal structured outputs.
- Add renderers for the tool parts to show compact, actionable UI in chat.
- Wire `useChat` to your server chat route; pass tools to your model runtime.
- Keep images and external links origin-safe; sanitize Markdown.
- Iterate: let the AI propose, the human choose, and the app reflect changes immediately.


### ASCII: Prompt → LLM → Dynamic Action Component Flow

```text
+-------+            +----------------+            +--------------------+             +---------------------+            +---------+
| User  |            | React Client   |            |  /api/demo-chat    |             |  AI runtime/model   |            | Tools   |
|       |            | (useChat UI)   |            |  (Server Route)    |             | (streamText + tools)|            |(server) |
+---+---+            +-------+--------+            +---------+----------+             +----------+----------+            +----+----+
    |                         |                               |                                   |                         |
    | 1) Type prompt          |                               |                                   |                         |
    |------------------------>| 2) sendMessage()              |                                   |                         |
    |                         |  → POST messages ------------->                                   |                         |
    |                         |                               | 3) derive origin                  |                         |
    |                         |                               | 4) tools = getTools({origin}) --->                          |
    |                         |                               | 5) streamText({model, tools,      |                         |
    |                         |                               |   messages, system}) ------------>|                         |
    |                         |                               |                                   | 6) (optional) call getGuitars{}
    |                         |                               |                                   |<------------------------|
    |                         |                               |                                   | 7) return guitars JSON (absolute image URLs)
    |                         |                               |<----------------------------------|                         |
    |                         | 8) SSE: UIMessage chunks (text parts + tool parts)                |                         |
    |                         |<------------------------------|                                   |                         |
    |                         | 9) Render each part:                                              |                         |
    |                         |    - text → ReactMarkdown                                         |                         |
    |                         |    - tool-recommendGuitar (output-available) →                    |                         |
    |                         |        <GuitarRecommendation id=... />                            |                         |
    |                         |                                                                   |                         |
    | 10) See actionable card; click CTA → navigate to detail page                                |                         |
    |                         | → Router updates UI; assistant panel may close via store          |                         |
    v                         v                                                                   v                         v
```


### 8) Code examples (concise, copy-paste ready)

#### Server chat route (`/api/demo-chat`)

```ts
import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import getTools from '@/utils/demo.tools'

const SYSTEM_PROMPT = `You are a helpful assistant for a store that sells guitars.`

export const ServerRoute = createServerFileRoute('/api/demo-chat').methods({
  POST: async ({ request }) => {
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
      stopWhen: stepCountIs(5),
      system: SYSTEM_PROMPT,
      tools,
    })

    return result.toUIMessageStreamResponse()
  },
})
```

#### Tools (server-side, origin-aware images)

```ts
import { tool } from 'ai'
import { z } from 'zod'
import guitars from '../data/example-guitars'

export default async function getTools({ origin }: { origin?: string } = {}) {
  const getGuitars = tool({
    description: 'Get all products from the database',
    inputSchema: z.object({}),
    execute: async () =>
      guitars.map((guitar) => ({
        ...guitar,
        image: origin ? `${origin}${guitar.image}` : guitar.image,
      })),
  })

  const recommendGuitar = tool({
    description: 'Use this tool to recommend a guitar to the user',
    inputSchema: z.object({ id: z.string() }),
    execute: async ({ id }) => ({ id }),
  })

  return { getGuitars, recommendGuitar }
}
```

#### Client chat hook + send

```tsx
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: '/api/demo-chat' }),
})

// ... in JSX
<form
  onSubmit={(e) => {
    e.preventDefault()
    sendMessage({ text: input })
    setInput('')
  }}
>
  {/* textarea + buttons */}
</form>
```

#### Render text parts and dynamic tool cards

```tsx
{messages.map(({ id, role, parts }) => (
  <div key={id}>
    {parts.map((part, index) => {
      if (part.type === 'text') {
        return <ReactMarkdown key={index}>{part.text}</ReactMarkdown>
      }
      if (
        part.type === 'tool-recommendGuitar' &&
        part.state === 'output-available' &&
        (part.output as { id: string })?.id
      ) {
        return (
          <GuitarRecommendation
            key={index}
            id={(part.output as { id: string }).id}
          />
        )
      }
      return null
    })}
  </div>
))}
```

#### Image origin normalization (defensive client)

```ts
function normalizeImageSrc(src?: string): string | undefined {
  if (!src) return src
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(src, base)
    const filename = url.pathname.split('/').pop() || ''
    const isGuitarImage = /^example-guitar-.*\.(jpg|jpeg|png|webp)$/i.test(filename)
    if (isGuitarImage) {
      const origin = typeof window !== 'undefined' ? window.location.origin : url.origin
      return `${origin}/${filename}`
    }
    return url.href
  } catch {
    return src
  }
}
```

#### Voice: Transcribe (Whisper-1) – hook + API

```tsx
// Hook usage
const { status, startRecording, stopRecording, isTranscribing } = useTranscribe((text) => {
  setInput((prev) => `${prev} ${text}`)
})

<button onClick={() => (status === 'recording' ? stopRecording() : startRecording())} />
```

```ts
// API route
import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { experimental_transcribe as transcribe } from 'ai'

export const ServerRoute = createServerFileRoute('/api/transcribe').methods({
  POST: async ({ request }) => {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const arrayBuffer = await audioFile.arrayBuffer()
    const audio = new Uint8Array(arrayBuffer)
    const result = await transcribe({ model: openai.transcription('whisper-1'), audio })
    return new Response(JSON.stringify({ text: result.text }), { status: 200 })
  },
})
```

#### Voice: Text-to-Speech (TTS-1) – button + API

```tsx
// Button usage
const { convertTextToSpeech, isGeneratingSpeech } = useTextToSpeech()
<TTSButton text={parts.filter((p) => p.type === 'text').map((p) => p.text).join(' ')} />
```

```ts
// API route
import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from '@ai-sdk/openai'
import { experimental_generateSpeech as generateSpeech } from 'ai'

export const ServerRoute = createServerFileRoute('/api/tts').methods({
  POST: async ({ request }) => {
    const { text } = await request.json()
    const audio = await generateSpeech({
      model: openai.speech('tts-1'),
      text,
      outputFormat: 'mp3',
      voice: 'alloy',
    })
    return new Response(audio.audio.uint8Array, { headers: { 'Content-Type': 'audio/mpeg' } })
  },
})
```
