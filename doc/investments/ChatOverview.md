## AI-Driven Investment Assistant — Chat Overview (Slides)

### Slide 1 — What it is
Conversational assistant to view and manage investment accounts with interactive UI.

- Core actions: create, list/query, update, delete accounts; generate insights.
- Voice I/O optional.
- File-backed mock DB: `tmp/investments.json`.

### Slide 2 — End-to-end request flow

```text
User
  |
  v
Frontend UI (chat in `src/routes/index.tsx`)
  |
  v
POST /api/demo-chat  → Orchestrator → Tools (Zod-typed) → DB / Services
  |                                              |
  |                                              v
  └─ SSE stream of assistant messages + UI blocks ← results
  |
  v
Chat timeline renders text + cards (account/insights/action)
```

- Tools are described in `src/utils/demo.tools.ts`.
- DB operations in `src/lib/investments-db.ts`.
### Slide 3 — Server-side tool contract

```text
/api/demo-chat
  ├─ createInvestmentAccount{ institution, accountType, name, balance? }
  ├─ updateInvestmentAccount{ id, patch }
  ├─ deleteInvestmentAccount{ id }
  ├─ listInvestments{ filters? }
  └─ getInvestmentInsights{ scope?, metrics? }
```

- Validated with Zod; results streamed back as chat chunks.
- Each tool returns typed payloads that the UI can render.

### Slide 4 — Data model (POC)

```ts
interface InvestmentAccount {
  id: string
  institution: 'Charles Schwab' | 'Fidelity' | 'Vanguard' | string
  accountType: 'Brokerage' | 'Roth IRA' | 'Traditional IRA' | '401k' | string
  name: string
  balance: number
  holdings: Array<{
    symbol: string
    quantity: number
    avgPrice: number
    sector?: string
  }>
  createdAt: string
  updatedAt: string
}
```

### Slide 5 — Rendering in chat

```text
+-----------------------------------------------------------+
|  AccountCard                                              |
|  [Logo] Name  (Type)     Balance: $xx,xxx.xx              |
|  Holdings: AAPL 5, VOO 10, ...                           |
+-----------------------------------------------------------+

+-----------------------------------------------------------+
|  InsightsCard                                             |
|  Allocation Pie  |  Sector Bars  |  Key Stats             |
+-----------------------------------------------------------+
```

- Cards are injected as structured payloads in streamed messages.
- The chat timeline mixes plain text and rich cards.
### Slide 6 — Minimal architecture diagram

```text
             +-----------------------+
             |  Frontend (React)     |
             |  `src/routes/index`   |
             +-----------+-----------+
                         |
                   POST /api/demo-chat
                         |
               +---------v----------+
               |   Orchestrator     |
               |  Tool selection    |
               +----+----------+----+
                    |          |
                    |          |
             +------v--+   +---v------------------+
             | Tools   |   | investments-db.ts    |
             | (Zod)   |   | (file-backed store)  |
             +---------+   +---------+------------+
                                   |
                            tmp/investments.json
```

### Slide 7 — Typical narratives
- "Create a Schwab brokerage account named Growth with $25k"
- "Show me Schwab accounts with balance > $10k"
- "Update Growth: add 5 AAPL at $185"
- "Delete the small test account"
- "What are my top sectors and allocation by institution?"

### Slide 8 — Extensibility
- Swap the mock DB for a real service.
- Add auth/ACL and per-user tenancy.
- Add live market data; enrich insights.
- Add more cards: performance, risk, transactions.
