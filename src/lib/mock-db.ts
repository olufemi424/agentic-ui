import { promises as fs } from 'fs'
import path from 'path'

export interface Item {
  id: string
  title: string
  description?: string
  tags?: string[]
  image?: string
  createdAt: string
  updatedAt: string
}

const DB_DIR = path.join(process.cwd(), 'tmp')
const DB_FILE = path.join(DB_DIR, 'items.json')

async function ensureDb(): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true })
  try {
    await fs.access(DB_FILE)
  } catch {
    const seed: Item[] = [
      {
        id: '1',
        title: 'Sample Item Alpha',
        description: 'A seeded example item for the POC',
        tags: ['example', 'alpha'],
        image: '/example-guitar-flowers.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Sample Item Beta',
        description: 'Second seeded item',
        tags: ['example', 'beta'],
        image: '/example-guitar-superhero.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    await fs.writeFile(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8')
  }
}

async function readAll(): Promise<Item[]> {
  await ensureDb()
  const raw = await fs.readFile(DB_FILE, 'utf-8')
  return JSON.parse(raw)
}

async function writeAll(items: Item[]): Promise<void> {
  await ensureDb()
  await fs.writeFile(DB_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export async function listItems(): Promise<Item[]> {
  return readAll()
}

export async function createItem(input: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const items = await readAll()
  const now = new Date().toISOString()
  const nextId = (items.length ? Math.max(...items.map((i) => +i.id)) + 1 : 1).toString()
  const item: Item = { id: nextId, createdAt: now, updatedAt: now, ...input }
  items.push(item)
  await writeAll(items)
  return item
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = await readAll()
  const next = items.filter((i) => i.id !== id)
  const changed = next.length !== items.length
  if (changed) await writeAll(next)
  return changed
}

export async function searchItems(query: string): Promise<Item[]> {
  const items = await readAll()
  const q = query.toLowerCase()
  return items.filter((i) =>
    i.title.toLowerCase().includes(q) ||
    (i.description?.toLowerCase().includes(q) ?? false) ||
    (i.tags?.some((t) => t.toLowerCase().includes(q)) ?? false),
  )
}

export async function recommendItem(): Promise<Item | null> {
  const items = await readAll()
  if (!items.length) return null
  // naive recommend: return most recently updated
  const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return sorted[0]
}
