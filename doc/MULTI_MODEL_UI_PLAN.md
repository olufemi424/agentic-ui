### Multi-Model UI Component Implementation Plan (agentic-ui)

- Scope: Add a client-first, streaming-friendly UI component that orchestrates multiple LLM models/tools concurrently, aligned with `agentic-ui` patterns (TanStack Start, `useChat` + `DefaultChatTransport`, data-parts, side-channel actions).
- Outcome: Users can choose one or more models, submit once, and see progressive, interleaved results for each model without page reloads.

## 1) UX and Data-Model Definition
- **User Controls**: Model selector (multi-select), temperature slider, max steps, and a per-model on/off toggle.
- **UI Messages**: Extend the message contract with per-model metadata in a new data-part kind, e.g. `data-multi-model-status`.
- **Data Parts** (server-emitted):
  - `data-model-plan` (per model): status=processing→streaming→done, schema: `{ id, modelId, title, description }`.
  - `data-model-output` (per model): streaming text chunks and final content, schema: `{ id, modelId, outline?, content?, tokens?, cost? }`.
  - `data-multi-model-status`: orchestrator status across all selected models, schema: `{ sessionId, models:[{ modelId, status }], startedAt, finishedAt? }`.
- **Keys**: Every part must carry a stable `id`. For multi-model, use composite ids like `mm-{session}-{modelId}`.

## 2) Client Wiring (No Reloads, Progressive Rendering)
- **Transport**: Continue using `useChat` with `DefaultChatTransport({ api: "/api/demo-chat" })` to receive streamed parts.
- **Submission**: Submit a single chat message with a `models` array (selected model ids) in the assistant/system context, not as UI-only state.
- **Containers**: Add a dedicated container component, e.g. `MultiModelPanel`, that:
  - Renders controls (model selector, sliders) and a submit button (`type="button"`).
  - Renders a grid of `ModelResultCard` components keyed by `mm-{session}-{modelId}`.
  - Captures `submit` and `click` events (capture phase) to prevent accidental navigation, mirroring existing chat containers.
- **Rendering**:
  - `ModelResultCard` subscribes to the current message parts and filters by its `modelId` key.
  - Show progressive outline/content with markdown; include token/cost counters if emitted.
  - Keep ephemeral UI state (expanded/collapsed, active tab) in React state keyed by `id` so streams don’t reset it.

## 3) Server Orchestration (Parallel Streams)
- **API Route**: Reuse `src/routes/api.demo-chat.ts` pattern: `streamText`/`streamObject` per model.
- **Parallelism**: For each selected model, launch an independent stream:
  - Emit `data-model-plan` partials via `streamObject(...partialObjectStream)`.
  - Emit `data-model-output` outline/content via `streamText` with progressive writes.
- **Coordinator**: Emit a `data-multi-model-status` part to reflect overall progress: when first model starts (processing), on each model completion (update), and when all complete (done).
- **Error Handling**: If one model fails, mark only that model as `error`; keep others streaming.
- **Origin Handling**: Continue deriving `origin` from `x-forwarded-*` headers to keep image/asset URLs correct.

## 4) Tool Mapping (Per-Model Customizations)
- **Schemas**: Optionally use per-model schemas if models return structured data (e.g., planner vs. outline differences).
- **Tools**: Map model ids to provider adapters (e.g., OpenAI, Anthropic) based on env keys present; skip models missing credentials and emit a `data-model-plan` with `status: "error"` for visibility.
- **Cost/Token**: If providers expose usage, append incremental token counts to `data-model-output` so UI can show live token/cost meters.

## 5) UI Components (Atomic, Stream-Safe)
- `MultiModelPanel`: model selection + submission + grid layout.
- `ModelResultCard({ id, modelId })`:
  - Header with model name and status badge.
  - Body with two tabs: Outline (streaming markdown) and Content (streaming markdown).
  - Footer with token/cost counters; optional copy-to-clipboard.
- **Markdown**: Reuse existing `ReactMarkdown` pipeline with `rehypeRaw`, `rehypeSanitize`, `rehypeHighlight`, honoring `normalizeImageSrc`.

## 6) State & Reconciliation Strategy
- Maintain a dictionary keyed by `mm-{session}-{modelId}` for parts.
- When new parts arrive with the same `id`, replace content in-place (not append), matching existing data-part reconciliation patterns.
- Memoize renderers (`React.memo`) and derive minimal slices to reduce churn.

## 7) Side-Channel Actions (No Chat Turn Restarts)
- For per-model actions (e.g., "Stop", "Rerun", "Promote to Final"), use a side-channel endpoint (e.g., `/api/multi-model-action`).
- Never use form submits; ensure buttons are `type="button"` and click handlers `preventDefault` when appropriate.
- The server endpoint can either write back another data-part (same `id`) or return JSON for local state updates.

## 8) Telemetry & Debugging Hooks
- Log per-model start/stop timestamps, token usage, and errors.
- In dev, show a small diagnostic panel: WS connected, number of active model streams, last write timestamp.

## 9) Acceptance Criteria
- Selecting multiple models streams interleaved outputs without page reloads.
- Network panel shows no `document` requests during interactions; only XHR/fetch.
- Each model card updates progressively and independently; one failure does not cancel others.
- Buttons and links in the panel do not trigger navigation unless explicitly using the router.
- HMR does not full-reload on interactions.

## 10) QA Checklist
- Single-model run behaves identically to current chat flow.
- Two-model run: verify both cards stream in parallel; timing differences OK.
- Simulated provider failure for one model: other model completes normally; error badge visible.
- Markdown with images resolves correctly via `normalizeImageSrc`.
- Token/cost counters update monotonically; no negative values or NaN.

## 11) File Map (planned edits/additions)
- Add: `src/components/MultiModelPanel.tsx` (client component with controls + grid)
- Add: `src/components/ModelResultCard.tsx` (render streamed parts per model)
- Update (light): `src/routes/index.tsx` to mount `MultiModelPanel` below the chat area
- Update (server): `src/routes/api.demo-chat.ts` to branch on presence of `models[]` for multi-stream orchestration; otherwise keep current single-model behavior
- Docs: this file; optionally add a quickstart snippet to `README.md`

## 12) Rollout Plan
- Phase 1: Wire UI and stream-only outputs (no side-channel actions).
- Phase 2: Add side-channel actions and token/cost meters.
- Phase 3: Provider capability matrix and graceful degradation (hide models without credentials).
