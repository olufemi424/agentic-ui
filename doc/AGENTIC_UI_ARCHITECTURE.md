# Agentic UI - Technical Architecture

**Stack**: TanStack Start (Vite SSR) + React 19 + AI SDK v5 + OpenAI

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Main Chat UI  │  │  Mini Assistant  │  │ Multi-Model UI  │  │
│  │  (index.tsx)   │  │ (AIAssistant.tsx)│  │(MultiModelPanel)│  │
│  └────────┬───────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                   │                     │           │
│           └───────────────────┴─────────────────────┘           │
│                              │                                  │
│                     useChat (AI SDK v5)                         │
│                   DefaultChatTransport                          │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ POST /api/demo-chat
                               │ (streaming UI messages)
┌──────────────────────────────┼──────────────────────────────────┐
│                    TanStack Start Server                        │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │            /api/demo-chat (createServerFileRoute)          │ │
│  │  • Detects metadata (__meta__, __action_result__)          │ │
│  │  • Calls streamText({ model: openai('gpt-4o-mini'), ... }) │ │
│  │  • Returns result.toUIMessageStreamResponse()              │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                 │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │                    demo.tools.ts                           │ │
│  │  • getGuitars, recommendGuitar                             │ │
│  │  • listItems, createItem, deleteItem                       │ │
│  │  • listInvestments, getInvestmentInsights                  │ │
│  │  • proposeCreate/Update/Delete (human-in-loop)             │ │
│  │  • createInvestmentAccount, updateInvestmentAccount        │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                 │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │           Data Layer (File-backed Mock DBs)                │ │
│  │  • investments-db.ts  → OS temp dir (not repo)             │ │
│  │  • mock-db.ts         → tmp/items.json                     │ │
│  │  • example-guitars.ts → static in-memory                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                     OpenAI API (gpt-4o-mini)                     │
└──────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App Root (__root.tsx)
├── Header
│   ├── Link: Home
│   └── Link: Guitar Demo
│
├── Route: / (index.tsx)
│   ├── ChatPage
│   │   ├── Messages
│   │   │   ├── Message (user/assistant)
│   │   │   │   ├── Text (ReactMarkdown)
│   │   │   │   ├── GuitarRecommendation (tool output)
│   │   │   │   ├── InvestmentAccountCard (tool output)
│   │   │   │   ├── InvestmentInsightsCard (tool output)
│   │   │   │   ├── InvestmentActionCard (proposed action)
│   │   │   │   └── ItemCard (tool output)
│   │   │   └── ...
│   │   ├── Layout (InitalLayout | ChattingLayout)
│   │   │   ├── Textarea (main input)
│   │   │   ├── TranscribeButton (voice input)
│   │   │   ├── TTSButton (text-to-speech)
│   │   │   └── Send button
│   │   └── MultiModelPanel
│   │       ├── Model selector (checkbox list)
│   │       ├── Temperature slider
│   │       ├── Run button
│   │       ├── [Dev] Simulate Error / Mark All Done
│   │       └── ModelResultCard[] (one per selected model)
│   │           ├── Status badge (processing/streaming/done/error)
│   │           ├── Content (streamed text)
│   │           └── Token/Cost counters
│   └── AIAssistant (mini chat panel)
│       ├── Toggle button
│       └── Panel (when open)
│           ├── Messages (same structure as main chat)
│           ├── Textarea (mini input)
│           └── Send button
│
└── Route: /example/guitars
    └── (Guitar demo routes)
```

## Data Flow Patterns

### 1. Standard Chat Turn (No Tools)

```
User types → sendMessage({ text }) → POST /api/demo-chat
                                         ↓
                                   streamText(model, messages)
                                         ↓
                            toUIMessageStreamResponse()
                                         ↓
                              (streaming text chunks)
                                         ↓
                        useChat updates messages state
                                         ↓
                              ReactMarkdown renders
```

### 2. Tool Execution Flow

```
User: "list my investments"
         ↓
POST /api/demo-chat
         ↓
streamText({ model, tools: { listInvestments, ... } })
         ↓
Model calls tool: listInvestments({ filters: {...} })
         ↓
Tool executes: await listInvestments(filters)
         ↓
investments-db.ts reads from OS temp dir
         ↓
Returns array of InvestmentAccount
         ↓
Stream emits: { type: "tool-listInvestments", output: [...] }
         ↓
Client: Messages component filters parts
         ↓
Renders: InvestmentAccountCard[] (grid)
```

### 3. Human-in-the-Loop Action Flow

```
User: "create a new investment account at Vanguard"
         ↓
POST /api/demo-chat
         ↓
Model calls: proposeCreateInvestmentAccount({...})
         ↓
Tool returns: { type: 'proposed-action', action: 'createInvestmentAccount', payload: {...} }
         ↓
Stream emits: { type: "tool-proposeCreateInvestmentAccount", output: {...} }
         ↓
Client renders: InvestmentActionCard (with Confirm/Cancel buttons)
         ↓
User clicks Confirm
         ↓
onResult callback: fetch POST /api/investments (side-channel)
         ↓
Server: createInvestmentAccount(payload) → writes to OS temp dir
         ↓
SSE watch detects file change → emits 'change' event (optional)
         ↓
Client: onResult sends follow-up message
         ↓
sendMessage({ text: "__action_result__ {...}" })
         ↓
POST /api/demo-chat (new turn with result)
         ↓
Model generates acknowledgement: "✓ Created account at Vanguard..."
```

### 4. Multi-Model Panel Flow (Step 1-9 Implemented)

```
User selects models + temperature → clicks Run
         ↓
onRun({ models: ['openai:gpt-4o-mini', ...], temperature: 0.8 })
         ↓
sendMessage({ text: "__meta__ {\"models\":[...],\"temperature\":0.8}" })
         ↓
POST /api/demo-chat
         ↓
Server detects "__meta__" → parses temperature override
         ↓
streamText({ model: openai('gpt-4o-mini'), temperature: 0.8, ... })
         ↓
Stream returns text chunks
         ↓
Client: MultiModelPanel derives latestAssistantText
         ↓
Renders ModelResultCard[] with shared content (placeholder for now)
         ↓
[Future: parallel per-model streaming with custom data-parts]
```

## Event Interception & No-Reload Guarantees

```
Chat Container (chatRootRef or panelRef)
         ↓
useEffect: addEventListener("submit", preventDefault, { capture: true })
useEffect: addEventListener("click", preventDefault for button[type="submit"] or a[href], { capture: true })
         ↓
All child buttons: type="button" (no implicit submit)
All actions: fetch() side-channel, not form posts
         ↓
Result: No document navigation, no HMR full reload
```

### File Write Isolation

```
Before: tmp/investments.json (under project root)
         ↓ Vite watches tmp/
         ↓ File write → HMR full reload ❌

After:  OS temp dir (/tmp/agentic-ui or TMPDIR)
         ↓ Outside project root
         ↓ File write → NO reload ✅
         ↓ SSE watch: /api/investments/watch → EventSource 'change' event
```

## Key API Routes

| Route                        | Method | Purpose                                      |
|------------------------------|--------|----------------------------------------------|
| `/api/demo-chat`             | POST   | Main chat endpoint; streams UI messages      |
| `/api/investments`           | GET    | List investments (query filters)             |
| `/api/investments`           | POST   | Create investment account                    |
| `/api/investments/$id`       | PATCH  | Update investment account (side-channel)     |
| `/api/investments/$id`       | DELETE | Delete investment account (side-channel)     |
| `/api/investments/watch`     | GET    | SSE endpoint for file change notifications   |
| `/api/items`                 | GET    | List items                                   |
| `/api/items`                 | POST   | Create item                                  |
| `/api/models`                | GET    | Fetch available models (based on env keys)   |
| `/api/transcribe`            | POST   | Voice-to-text (optional)                     |
| `/api/tts`                   | POST   | Text-to-speech (optional)                    |

## State Management

```
TanStack Store (example-assistant.ts)
         ↓
showAIAssistant: boolean (toggle mini assistant)

useChat (AI SDK v5)
         ↓
messages: UIMessage[] (chat history)
sendMessage(msg) (append user turn + trigger stream)

Local Component State
         ↓
MultiModelPanel: selected models, temperature, lastRun, statusByModel
ModelResultCard: placeholder content from latestAssistantText
```

## Tool Categories

### 1. Query Tools (Direct Execution)
- `getGuitars`, `recommendGuitar`
- `listItems`, `searchItems`, `recommendItem`
- `listInvestments`, `getInvestmentInsights`

### 2. Mutating Tools (Direct Execution)
- `createItem`, `deleteItem`

### 3. Human-in-Loop Tools (Propose → Confirm)
- `proposeCreateInvestmentAccount` → UI renders `InvestmentActionCard` → User confirms → `createInvestmentAccount` (side-channel)
- `proposeUpdateInvestmentAccount` → User confirms → `updateInvestmentAccount` (side-channel)
- `proposeDeleteInvestmentAccount` → User confirms → `deleteInvestmentAccount` (side-channel)

## Security & Best Practices

- **API Keys**: Server-only; never exposed to client
- **CORS**: Same-origin by default (TanStack Start SSR)
- **Input Validation**: Zod schemas on tool inputs
- **Event Interception**: Capture-phase listeners prevent accidental navigation
- **File Isolation**: Mock data writes outside repo to avoid HMR reloads
- **Type Safety**: TypeScript strict mode; all tool inputs/outputs typed

## Future Enhancements (Step 4 Parallel Streaming - Pending)

```
Server: Detect models[] in __meta__
         ↓
For each model: spawn parallel streamText() with stable id
         ↓
Emit custom data-parts: "data-model-output" with { id: "mm-session-{modelId}", content, status }
         ↓
Client: MultiModelPanel filters parts by modelId
         ↓
ModelResultCard renders per-model independent streams
         ↓
Error in one model → only that card shows error; others proceed
```

## Testing Strategy (Current)

- Manual: DevTools Network panel (no "Doc" requests on interactions)
- Manual: Console (no HMR full reload messages)
- Manual: Breakpoints on `beforeunload/pagehide` (none triggered)
- Linting: TypeScript + ESLint (all files clean)

## Performance Notes

- **Streaming**: Reduces TTFB; UI updates incrementally
- **React Memoization**: `useMemo` for derived state (latestAssistantText, tokensApprox)
- **Event Delegation**: Single capture listener per container vs. per-element
- **SSE Keep-Alive**: 30s ping interval for `/api/investments/watch`

## Development Workflow

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (port 3001)
pnpm build            # Build for production
pnpm test             # Run Vitest tests
```

**Hot Module Replacement**: Vite + React Fast Refresh; file changes hot-reload without full page refresh (unless writes to watched dirs).

## Environment Variables

| Variable              | Required | Purpose                          |
|-----------------------|----------|----------------------------------|
| `OPENAI_API_KEY`      | Yes      | OpenAI gpt-4o-mini access        |
| `ANTHROPIC_API_KEY`   | Optional | Enable Anthropic models          |
| `MISTRAL_API_KEY`     | Optional | Enable Mistral models            |

## File Structure (Key Modules)

```
src/
├── components/
│   ├── example-AIAssistant.tsx      # Mini chat panel
│   ├── MultiModelPanel.tsx          # Multi-model UI (Step 1-9)
│   ├── ModelResultCard.tsx          # Per-model result display
│   ├── InvestmentActionCard.tsx     # Human-in-loop confirm/cancel UI
│   ├── InvestmentAccountCard.tsx    # Display investment account
│   ├── InvestmentInsightsCard.tsx   # Portfolio insights
│   └── example-GuitarRecommendation.tsx
├── routes/
│   ├── __root.tsx                   # Root layout
│   ├── index.tsx                    # Main chat page
│   ├── api.demo-chat.ts             # Chat endpoint (streaming)
│   ├── api.investments.ts           # Investments CRUD (GET, POST)
│   ├── api.investments.$id.ts       # Investments CRUD (PATCH, DELETE)
│   ├── api.investments.watch.ts     # SSE file watcher
│   └── api.models.ts                # Available models endpoint
├── lib/
│   ├── investments-db.ts            # Investment data layer
│   └── mock-db.ts                   # Items data layer
├── utils/
│   ├── demo.tools.ts                # Tool definitions for AI SDK
│   └── investments.client.ts        # Side-channel fetch helpers
├── hooks/
│   └── useInvestmentsWatch.ts       # SSE hook for file changes
└── store/
    └── example-assistant.ts         # TanStack Store (showAIAssistant)
```

## ASCII Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Agentic UI Pattern                      │
├─────────────────────────────────────────────────────────────┤
│  1. User input → sendMessage                                │
│  2. Server: streamText + tools                              │
│  3. Tool execution (query | propose | mutate)               │
│  4. Stream emits UI message parts                           │
│  5. Client: render by part.type                             │
│  6. Proposed actions → InvestmentActionCard                 │
│  7. User confirms → side-channel fetch                      │
│  8. onResult → sendMessage(__action_result__)               │
│  9. Model acknowledges → coherent conversation              │
└─────────────────────────────────────────────────────────────┘
```

---

**Version**: Current implementation (Steps 0-9 complete; Step 4 parallel streaming pending)
**Last Updated**: 2025-10-03
