# AI-Driven Investment Assistant – High-Level Overview

## Purpose
Conversational assistant to manage a brokerage account (e.g., Charles Schwab) through natural language. It augments chat responses with interactive UI blocks and tool-driven actions.

## Core Capabilities
- Create an investment account (mocked for POC)
- Manage an account: update account data and delete accounts
- Query investments with filters (by type, balance, institution, date)
- Generate insights over current investment data (summaries, allocations, trends)
- Voice I/O (optional): speech-to-text for prompts, text-to-speech for results

## Architecture Alignment
- Chat-first UX using existing route `src/routes/index.tsx` as baseline
- Server-side tools describe capabilities (Zod schemas), executed by `/api/demo-chat`
- File-backed mock DB for investments (JSON in `tmp/investments.json`)
- UI cards injected in chat to visualize accounts and insights
- Optional REST endpoints for testing and external integration

## Data Model (POC)
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

## Example User Flows
- "Create a Schwab brokerage account named Growth with $25,000 starting balance"
- "Show me accounts at Schwab with balance > $10k"
- "Update the Growth account: add 5 AAPL at $185"
- "Delete the small test account"
- "What are my top sectors and allocation by institution?"

## Tool Set (Server)
- `createInvestmentAccount{ institution, accountType, name, balance? }`
- `updateInvestmentAccount{ id, patch }`
- `deleteInvestmentAccount{ id }`
- `listInvestments{ filters? }`
- `getInvestmentInsights{ scope?, metrics? }`

## Rendering in Chat
- Account cards: institution logo, name, type, balance, key holdings
- Insights cards: pie chart (allocation), bar chart (sectors), key stats
- CRUD feedback: status chips (created/updated/deleted)

## Non-Goals (POC)
- Real brokerage connectivity or order execution
- Real-time market data; use static prices or small mocked updates
- Security hardening beyond origin-safe images and markdown sanitization
