## Multi-Model Story Generator: Technical Implementation

This document explains the architecture and key flows of the `ai-sdk-v5-data-parts-demo` app. It uses Next.js App Router, Vercel AI SDK v5 data parts, and OpenRouter to orchestrate multiple model calls with progressive UI streaming.

### Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI/State**: React 19, Functional Components
- **AI SDK**: `ai` v5 and `@ai-sdk/react`
- **Provider**: `@openrouter/ai-sdk-provider`
- **Validation**: `zod`
- **Styling**: Tailwind CSS v4

### High-Level Architecture
```
Browser (React UI)
   |  fetch /api/generate-story (messages)
   v
API Route (Next.js): app/api/generate-story/route.ts
   |  createUIMessageStream / streamObject / streamText
   |  uses OpenRouter provider
   v
OpenRouter (LLM Gateway)
   |  routes to model: google/gemini-2.5-flash-lite
   v
LLM Provider (Gemini via OpenRouter)
```

### Data Structures
- `MyUIMessage`: UI message with data parts
  - `planner-agent`: partial book plan (zod schema)
  - `story-agent`: outline and content streaming states
- `plannerSchema` and `storySchema` (zod) validate structured outputs

### Request Flow: Generate Story
```
[User] --types--> [UI messages]
   |
   | POST /api/generate-story (JSON: { messages })
   v
[Server] createUIMessageStream(execute)
   |
   |-- writer.write( planner: status=processing )
   |
   |-- streamObject({ model: openrouter.chat("google/gemini-2.5-flash-lite"),
   |                  schema: plannerSchema, messages })
   |      |
   |      |-- partialObjectStream ==> writer.write( status=streaming, data=partial )
   |      `-- object (final)      ==> writer.write( status=done, data=bookPlan )
   |
   `-- for each story in bookPlan.stories:
          createStory(writer, story)
```

### Function: createStory(writer, story)
```
createStory
  |
  |-- writer.write( story-agent: outlineStatus=processing, contentStatus=processing )
  |
  |-- streamText({ model: openrouter.chat("google/gemini-2.5-flash-lite"), prompt: outline })
  |     `-- for each chunk:
  |            writer.write( outlineStatus=streaming, outline+=chunk )
  |     `-- writer.write( outlineStatus=done )
  |
  |-- streamText({ model: openrouter.chat("google/gemini-2.5-flash-lite"), prompt: content })
  |     `-- for each chunk:
  |            writer.write( contentStatus=streaming, content+=chunk )
  |     `-- writer.write( contentStatus=done )
  |
  `-- (UI receives progressive updates and renders)
```

### Streaming & Data Parts
- `createUIMessageStream` ties server-side streaming to React UI with typed data parts.
- `writer.write(...)` sends incremental updates to the client for specific message ids.
- UI components subscribe to message stream and render planner progress, outlines, and content as they arrive.

### Key Files
- `openrouter.ts`: initializes provider
```
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY,
});
```
- `app/api/generate-story/route.ts`: server logic
  - Validates schemas, orchestrates object and text streams
  - Emits progress via `writer.write`
- `components/*.tsx`: planner and story agent UI rendering
- `app/page.tsx`: page wiring that submits messages and renders results

### Error Handling Strategy
- Mark statuses: "processing" → "streaming" → "done" | "error"
- Fail fast on invalid payloads (zod)
- Surface server errors as data-part events with `status: "error"`
- Network errors bubble to client; UI shows toasts (see `notification.tsx`)

### Environment & Config
- Requires `OPENROUTER_KEY` in `.env.local`
- Model id: `google/gemini-2.5-flash-lite` (changeable in `route.ts`)

### Sequence Diagram (ASCII)
```
User            UI (React)               API Route                   OpenRouter               Model
 |                 |                          |                          |                      |
 |  type prompt    |                          |                          |                      |
 |---------------->|  submit(messages)        |                          |                      |
 |                 |------------------------->| createUIMessageStream    |                      |
 |                 |                          |---- streamObject ------->|  route to model ---> |
 |                 |                          |<--- partial objects -----| <---- stream chunks -|
 |                 |<-- writer.write() ------ |                          |                      |
 |                 |   planner streaming      |                          |                      |
 |                 |                          |---- streamText (outline)->| ---> model -------->|
 |                 |                          |<--- text chunks ---------| <---- stream chunks -|
 |                 |<-- writer.write() ------ |                          |                      |
 |                 |   outline streaming      |                          |                      |
 |                 |                          |---- streamText (content)->| ---> model -------->|
 |                 |                          |<--- text chunks ---------| <---- stream chunks -|
 |                 |<-- writer.write() ------ |                          |                      |
 |                 |   content streaming      |                          |                      |
 |  sees results   |                          |    final done statuses    |                      |
```

### Performance Notes
- Turbopack dev server; enable caching by default
- Streaming reduces TTFB for long generations
- Keep messages minimal; large prompts increase latency/cost

### Extending
- Swap models by id in `route.ts`
- Add more agents: append parallel `streamObject/streamText` flows
- Add auth and per-user limits before invoking the API route

### Security
- Never expose `OPENROUTER_KEY` to client; keep calls in server routes
- Rate limit the API route in production
- Validate all inputs with zod before model invocation

## UI Pattern with Tool Calls

This app uses a unidirectional streaming pattern where the UI subscribes to server-driven tool calls and renders incremental results.

### Client transport and message contract
- `useChat<MyUIMessage>` is configured with `DefaultChatTransport({ api: "/api/generate-story" })`.
- The server emits assistant message parts with typed data-part kinds:
  - `data-planner-agent` → progressive plan (structured with `plannerSchema`)
  - `data-story-agent` → progressive outline/content for a single story
- Each part has a stable `id` so the client can reconcile updates.

```ascii
React (useChat) --submit--> POST /api/generate-story
   ^                                |
   |                                v
assistant message parts <--- createUIMessageStream(writer.write(...))
```

### Tool-call mapping (server ↔ UI)
- Server “tools” (model invocations):
  - Planner: `streamObject({... schema: plannerSchema })`
  - Story Outline: `streamText({...})`
  - Story Content: `streamText({...})`
- UI components (tool-output renderers):
  - `PlannerAgent` renders `status` + `data.stories` as they stream
  - `StoryAgent` renders dual phases (outline, then content) with badges and tabs

```ascii
[Planner tool streamObject]  -> part: data-planner-agent (status: processing→streaming→done)
[Outline tool streamText]    -> part: data-story-agent   (outlineStatus: processing→streaming→done)
[Content tool streamText]    -> part: data-story-agent   (contentStatus: processing→streaming→done)
```

### Rendering lifecycle (progressive UI)
1) User submits prompt → `sendMessage({ parts: [{ type: "text", text }] })`
2) Server immediately writes a planning placeholder (processing)
3) As `partialObjectStream` yields, UI updates planner list with titles/descriptions
4) When plan is done, server iterates stories and for each:
   - Emits outline stream chunks → UI shows live Markdown as it grows
   - Emits content stream chunks → UI shows live Markdown per chapter
5) Final write marks both phases `done`, tab switches to "Result"

```ascii
User → useChat → writer.write(planner:processing)
                → planner:streaming (partial plan)
                → planner:done (final)
                → story: outline streaming → outline done
                → story: content streaming → content done
```

### Reconciliation and keys
- Parts carry `id` so React lists can key reliably; repeated writes with same `id` replace content in place.
- `PlannerAgent`/`StoryAgent` are pure renderers; state minimal (open/collapsed, active tab).

### Error and UX cues
- Status-badges map to visual states: processing, streaming, done, error
- Skeletons and spinners show during streaming
- Markdown render via `marked` with `dangerouslySetInnerHTML` (server output is trusted from our own endpoint)

### Extending the pattern
- Add a new server tool call → define a new data-part kind (e.g. `data-sentiment-agent`)
- Emit progressive writes under a stable `id`
- Create a dedicated UI component to render that part, and route on `part.type` in `app/page.tsx`

### Interaction-safe Tool UI (no reloads)

When a tool output renders an interactive component (buttons/forms), avoid page reloads by isolating interactions from the chat transport and preventing default form navigation.

Key patterns:
- Use client-only components for tool UIs (`"use client"`).
- Never rely on implicit form submission. Use `onSubmit={e => e.preventDefault()}` and set interactive buttons to `type="button"`.
- Keep tool actions on a side-channel API (not `sendMessage`) to avoid restarting the chat stream. Post to a dedicated endpoint like `/api/tool-action` with an `actionId` from the tool data.
- Use stable keys: render tool parts with `key={part.id}` (not array index) so re-streaming updates don’t remount your component.
- Co-locate ephemeral UI state in React state keyed by `actionId`, not in the streamed content, so state survives incoming updates.
- Memoize renderers to reduce churn during streaming updates (`React.memo`).

ASCII flow (side-channel intent):
```
Model → streamObject/streamText → writer.write({ id: "action-123", type: "data-tool", data: { ... } })
UI (ToolCard) renders with key=action-123
User clicks → fetch POST /api/tool-action { actionId: "action-123", payload }
Server performs action → writer.write update OR returns JSON → UI updates
```

Minimal example: Tool card with button (no reload)
```tsx
"use client";
import React, { useState, useTransition } from "react";

type ToolPart = {
  id: string;           // stable id from writer.write
  title: string;
  ctaLabel?: string;
};

export function ToolCard({ part }: { part: ToolPart }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const onAct = () => {
    start(async () => {
      const res = await fetch("/api/tool-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: part.id }),
      });
      const data = await res.json();
      setResult(data.ok ? "Done" : data.error ?? "Failed");
    });
  };

  return (
    <div className="rounded border p-3">
      <div className="font-medium">{part.title}</div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onAct} disabled={pending}>
          {pending ? "Working…" : part.ctaLabel ?? "Run"}
        </button>
        {result && <span className="text-sm opacity-70">{result}</span>}
      </div>
    </div>
  );
}
```

Server endpoint (side-channel) example
```ts
// app/api/tool-action/route.ts (Next.js App Router)
export const POST = async (req: Request) => {
  const { actionId, payload } = await req.json();
  // Perform the tool-side effect; do NOT call sendMessage here.
  // Option A: Return a JSON result consumed by client state (above)
  // Option B: If you want to broadcast to the stream, have the
  //           chat server write another data-part with the same id.
  return Response.json({ ok: true, actionId });
};
```

Guardrails to prevent reloads:
- Buttons inside forms default to `type="submit"` → set `type="button"`.
- Anchors without JS handlers trigger navigation → prefer `button` or preventDefault.
- Don’t call `sendMessage` for tool-button clicks unless you deliberately want a new chat turn.
- In App Router, avoid `<form action={serverAction}>` for tool UIs you want to stay client-side.

State survival during streams:
- Merge incoming tool updates by `id` instead of replacing whole arrays.
- Keep transient UI flags (open/collapsed, selected tab) in component state keyed by `id` so streaming rerenders don’t reset them.
- Use `dangerouslySetInnerHTML` only for trusted, server-generated markdown; avoid piping user HTML.
