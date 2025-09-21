# Investment Assistant – Step-by-Step Implementation Plan

This follows the current POC pattern (chat + tools + UI cards + file-backed DB).

## 1) Data & Persistence
- Create `src/lib/investments-db.ts` (JSON at `tmp/investments.json`).
  - `listInvestments(filters?)`
  - `createInvestmentAccount(input)`
  - `updateInvestmentAccount(id, patch)`
  - `deleteInvestmentAccount(id)`
  - `computeInsights(scope?, metrics?)` (allocation by institution/sector; totals; growth placeholder)
- Seed with a few Schwab/Fidelity accounts; include small holdings arrays.

## 2) Tools (server)
- Extend `src/utils/demo.tools.ts` with investment tools (keep guitars/items):
  - `createInvestmentAccount{ institution, accountType, name, balance? }` → returns created account
  - `updateInvestmentAccount{ id, patch }` → returns updated account
  - `deleteInvestmentAccount{ id }` → { success, id }
  - `listInvestments{ filters? }` → InvestmentAccount[]
  - `getInvestmentInsights{ scope?, metrics? }` → { totals, allocations, sectors }
- Ensure outputs are minimal and UI-friendly; validate with Zod.

## 3) Chat Rendering
- Add components:
  - `InvestmentAccountCard.tsx` (summary card; institution badge, type, balance, top 3 holdings)
  - `InvestmentInsightsCard.tsx` (simple charts via CSS or lightweight SVG; no heavy deps)
- Update chat render map in `src/routes/index.tsx` (and `example-AIAssistant.tsx`):
  - `tool-createInvestmentAccount`, `tool-updateInvestmentAccount` → single `InvestmentAccountCard`
  - `tool-deleteInvestmentAccount` → status chip
  - `tool-listInvestments` → grid of `InvestmentAccountCard`
  - `tool-getInvestmentInsights` → `InvestmentInsightsCard`

## 4) REST Endpoints (optional for testing)
- `src/routes/api.investments.ts`:
  - `GET /api/investments?filters=...`
  - `POST /api/investments` (create)
  - `PATCH /api/investments/$id` (update)
  - `DELETE /api/investments/$id`

## 5) Prompting/System
- Update system prompt (in `api.demo-chat.ts`) to introduce investment tools and guardrails:
  - Encourage tool use for CRUD/search/insights; avoid fabricating data; surface clarifying questions.

## 6) Voice Optional
- Reuse existing STT/TTS as-is. No changes required.

## 7) Insights Logic (POC)
- `computeInsights`:
  - Totals per institution, accountType
  - Allocation by sector and by ticker (static prices)
  - Simple highlights: largest holding, most diversified account

## 8) Safety & Formatting
- Keep Markdown sanitize and image origin rules.
- Investments products have no images; use institution logos in `public/` or initials.

## 9) Future: MCP UI
- Provide insights/accounts as embedded UI resources (remote resource) with intents:
  - `view_details`, `update_holding`, `delete_account`
  - Host with iframe, map intents to our tool calls.

## 10) Acceptance Tests (manual chat scripts)
- "Create a Schwab brokerage account named Growth with $25,000"
- "Add 5 AAPL at $185 to the Growth account"
- "Show Schwab accounts with balance > $10k"
- "What is my sector allocation across all accounts?"
- "Delete the small test account"

## Deliverables
- `src/lib/investments-db.ts`
- Tool additions in `src/utils/demo.tools.ts`
- Components: `InvestmentAccountCard.tsx`, `InvestmentInsightsCard.tsx`
- Renderers updated in chat files
- (Optional) `src/routes/api.investments.ts`
- Documentation in `doc/investments/`
