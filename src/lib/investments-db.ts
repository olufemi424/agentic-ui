import { promises as fs } from 'fs'
import path from 'path'

export interface Holding {
  symbol: string
  quantity: number
  avgPrice: number
  sector?: string
}

export interface InvestmentAccount {
  id: string
  institution: string
  accountType: string
  name: string
  balance: number
  holdings: Holding[]
  createdAt: string
  updatedAt: string
}

const DB_DIR = path.join(process.cwd(), 'tmp')
const DB_FILE = path.join(DB_DIR, 'investments.json')

async function ensureDb(): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true })
  try {
    await fs.access(DB_FILE)
  } catch {
    const now = new Date().toISOString()
    const seed: InvestmentAccount[] = [
      {
        id: 'acct-1',
        institution: 'Charles Schwab',
        accountType: 'Brokerage',
        name: 'Growth',
        balance: 25000,
        holdings: [
          { symbol: 'AAPL', quantity: 10, avgPrice: 175, sector: 'Technology' },
          { symbol: 'MSFT', quantity: 5, avgPrice: 320, sector: 'Technology' },
          { symbol: 'VTI', quantity: 20, avgPrice: 210, sector: 'Index' },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acct-2',
        institution: 'Fidelity',
        accountType: 'Roth IRA',
        name: 'Retirement',
        balance: 18000,
        holdings: [
          { symbol: 'VOO', quantity: 15, avgPrice: 400, sector: 'Index' },
          { symbol: 'NVDA', quantity: 2, avgPrice: 650, sector: 'Technology' },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]
    await fs.writeFile(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8')
  }
}

async function readAll(): Promise<InvestmentAccount[]> {
  await ensureDb()
  const raw = await fs.readFile(DB_FILE, 'utf-8')
  return JSON.parse(raw)
}

async function writeAll(items: InvestmentAccount[]): Promise<void> {
  await ensureDb()
  await fs.writeFile(DB_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export async function listInvestments(filters?: Partial<{
  institution: string
  minBalance: number
  accountType: string
  name: string
}>): Promise<InvestmentAccount[]> {
  const all = await readAll()
  if (!filters) return all
  return all.filter((a) => {
    if (filters.institution && a.institution !== filters.institution) return false
    if (filters.accountType && a.accountType !== filters.accountType) return false
    if (filters.name && !a.name.toLowerCase().includes(filters.name.toLowerCase())) return false
    if (typeof filters.minBalance === 'number' && a.balance < filters.minBalance) return false
    return true
  })
}

export async function createInvestmentAccount(input: Omit<InvestmentAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvestmentAccount> {
  const all = await readAll()
  const now = new Date().toISOString()
  const nextId = `acct-${all.length ? all.length + 1 : 1}`
  const created: InvestmentAccount = { id: nextId, createdAt: now, updatedAt: now, ...input }
  all.push(created)
  await writeAll(all)
  return created
}

export async function updateInvestmentAccount(id: string, patch: Partial<Omit<InvestmentAccount, 'id' | 'createdAt'>>): Promise<InvestmentAccount | null> {
  const all = await readAll()
  const idx = all.findIndex((a) => a.id === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  const updated = { ...all[idx], ...patch, updatedAt: now }
  all[idx] = updated
  await writeAll(all)
  return updated
}

export async function deleteInvestmentAccount(id: string): Promise<boolean> {
  const all = await readAll()
  const next = all.filter((a) => a.id !== id)
  const changed = next.length !== all.length
  if (changed) await writeAll(next)
  return changed
}

export async function computeInsights() {
  const all = await readAll()
  const totals = all.reduce((sum, a) => sum + a.balance, 0)
  const byInstitution = all.reduce<Record<string, number>>((acc, a) => {
    acc[a.institution] = (acc[a.institution] || 0) + a.balance
    return acc
  }, {})
  const bySector = all.flatMap((a) => a.holdings).reduce<Record<string, number>>((acc, h) => {
    const sector = h.sector || 'Other'
    const position = h.quantity * h.avgPrice
    acc[sector] = (acc[sector] || 0) + position
    return acc
  }, {})
  const topHolding = all
    .flatMap((a) => a.holdings.map((h) => ({ ...h, position: h.quantity * h.avgPrice })))
    .sort((a, b) => b.position - a.position)[0] || null
  return { totals, byInstitution, bySector, topHolding }
}
