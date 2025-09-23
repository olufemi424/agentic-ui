# Human-in-the-Loop Actions for Investments

Goal: For create/update/delete, the agent proposes an action and renders an Action Component for the user to confirm or edit. Pure queries (list/search/insights) remain autonomous.

## Principles
- Agent does NOT mutate state autonomously for mutations.
- Model returns a proposed action payload and a UI prompt to confirm/edit.
- User confirms in-chat via an action card. Only then is the tool executed.

## Data contract (tool output for mutations)
Return a structured proposal instead of executing immediately:
```ts
// Example: propose create investment account
{
  type: 'proposed-action',
  action: 'createInvestmentAccount',
  payload: { institution, accountType, name, balance, holdings },
  rationale?: string,
  requiresConfirmation: true
}
```

## Client UI components
- `InvestmentActionCard.tsx` – Renders the proposed action with editable fields and Confirm/Cancel buttons.
  - Props: `{ action: string; payload: any; onConfirm(payload); onCancel(); }`
  - Includes a multi-row holdings editor (add/remove rows; symbol, quantity, avgPrice, sector) and client-side numeric coercion.
- `InvestmentAccountCard.tsx` – Display after confirmation and tool execution.
- `InvestmentInsightsCard.tsx` – unchanged for queries.

## Flow
1. User asks: “Create a Schwab brokerage account named Growth with $25,000”.
2. Model calls `proposeCreateInvestmentAccount{...}` (new tool) → returns `proposed-action` payload (no DB write).
3. Chat renders `InvestmentActionCard` with fields prefilled.
4. User clicks Confirm → client calls real tool `createInvestmentAccount` (existing), passing payload.
5. Server executes and returns the created account → show `InvestmentAccountCard` and a success message.
6. Cancel → discard proposal, optionally keep as a draft.

## Tools (server)
Add non-mutating propose-tools:
- `proposeCreateInvestmentAccount{ institution, accountType, name, balance?, holdings? }` → returns proposed payload
- `proposeUpdateInvestmentAccount{ id, patch }` → returns proposed payload (diff optional)
- `proposeDeleteInvestmentAccount{ id }` → returns proposed payload

Keep existing mutating tools for execution on confirm:
- `createInvestmentAccount`, `updateInvestmentAccount`, `deleteInvestmentAccount`

## Rendering map in chat
- On tool part with `type === 'tool-proposeCreateInvestmentAccount' | 'tool-proposeUpdateInvestmentAccount' | 'tool-proposeDeleteInvestmentAccount'` and output `proposed-action`:
  - Render `<InvestmentActionCard action=... payload=... onConfirm=... />`
  - Confirm triggers POST to `/api/investments` or tool call via `/api/demo-chat` follow-up message like: `"Confirm create"` with hidden metadata, or call REST directly from the component.

## Implementation Steps
1. Tools
   - Add propose-tools in `src/utils/demo.tools.ts` returning structured `proposed-action` objects.
2. Components
   - Create `src/components/InvestmentActionCard.tsx` with editable fields, validations, confirm/cancel.
3. Chat renderers
   - Update `src/routes/index.tsx` and `components/example-AIAssistant.tsx` to render proposed-action tool parts with `InvestmentActionCard`.
   - On Confirm: call REST (`/api/investments`) or trigger another tool via a small client helper.
4. Server routes
   - Already implemented `/api/investments` for create/update/delete.
   - Normalize holdings on POST/PATCH: coerce numbers, apply alias keys, parse basic free-text patterns.
5. Safety
   - Enforce human confirmation path by instructing the model in the system prompt: “For create/update/delete, use propose-* tools; do not execute without confirmation.”
6. Telemetry (optional)
   - Log propose vs executed; track cancellations; measure time-to-confirm.

## Required code updates (file-by-file)

- `src/utils/demo.tools.ts`
  - Add non-mutating propose tools:
    - `proposeCreateInvestmentAccount`
    - `proposeUpdateInvestmentAccount`
    - `proposeDeleteInvestmentAccount`
  - Each returns a `{ type: 'proposed-action', action, payload, requiresConfirmation: true }` shape.
  - Keep existing mutating tools (`createInvestmentAccount`, `updateInvestmentAccount`, `deleteInvestmentAccount`) untouched for post-confirm execution.

- `src/routes/api.demo-chat.ts`
  - Update `SYSTEM_PROMPT` to instruct the model:
    - For any create/update/delete, first call corresponding propose-* tool.
    - Only proceed to execute after the user has confirmed in the UI.
  - Optional: reduce `stopWhen` or temperature if needed for deterministic proposals.

- `src/components/InvestmentActionCard.tsx` (new)
  - Render a form-like card with fields derived from `payload`.
  - Props: `{ action: string; payload: any; onConfirm: (payload:any)=>void; onCancel: ()=>void }`.
  - Basic validation and ability to edit common fields: `institution`, `accountType`, `name`, `balance`, and, for update, a JSON patch block.
  - On Confirm → call a client helper to hit REST endpoints.

- `src/utils/investments.client.ts` (new)
  - `createInvestment(payload) → POST /api/investments`
  - `updateInvestment(id, patch) → PATCH /api/investments/:id`
  - `deleteInvestment(id) → DELETE /api/investments/:id`
  - Export typed helpers used by `InvestmentActionCard`.

- `src/routes/index.tsx`
  - Extend part renderer to handle propose tool parts:
    - `tool-proposeCreateInvestmentAccount`
    - `tool-proposeUpdateInvestmentAccount`
    - `tool-proposeDeleteInvestmentAccount`
  - Map them to `<InvestmentActionCard />` and wire `onConfirm` to client helpers; on success, render resulting `InvestmentAccountCard` and a success status chip.

- `src/components/example-AIAssistant.tsx`
  - Mirror the same proposed-action rendering behavior in the mini assistant.

- `src/routes/api.investments.ts` (existing)
  - No changes required; already supports POST, PATCH, DELETE.
  - Optional: add server-side validation/error messages surfaced back to chat on failed confirm.

- `src/styles.css` / `src/demo.index.css`
  - Optional: add small styles for action cards (buttons/inputs) to fit chat aesthetics.

## Acceptance criteria
- Proposed actions render with editable fields and require explicit user confirmation.
- Confirm executes the correct REST call and the UI reflects changes (card or chip) without full-page reload.
- Queries (list/search/insights) remain autonomous (no confirmation UI).
- System prompt updated so the agent consistently proposes instead of executing for mutations.

## Example JSONs
- Proposed create:
```json
{
  "type": "proposed-action",
  "action": "createInvestmentAccount",
  "payload": {
    "institution": "Charles Schwab",
    "accountType": "Brokerage",
    "name": "Growth",
    "balance": 25000,
    "holdings": []
  },
  "requiresConfirmation": true
}
```
- Proposed update:
```json
{
  "type": "proposed-action",
  "action": "updateInvestmentAccount",
  "payload": {
    "id": "acct-1",
    "patch": { "balance": 26000 }
  },
  "requiresConfirmation": true
}
```
- Proposed delete:
```json
{
  "type": "proposed-action",
  "action": "deleteInvestmentAccount",
  "payload": { "id": "acct-2" },
  "requiresConfirmation": true
}
```

## Notes
- Queries (list/search/insights) remain direct; no confirmation UI.
- Advanced: show a diff for updates, rationale strings from the model, and confidence indicators to match the design doc’s progressive disclosure ideas.
