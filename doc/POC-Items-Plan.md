# Items POC – Conversational CRUD with File-backed Mock DB

## Overview
- Chat-driven item management using the existing LLM + tools pipeline.
- Mock persistence via JSON file at `tmp/items.json` using `src/lib/mock-db.ts`.
- Tools exposed to the model for: create, search, recommend, delete, list.
- Client renders tool outputs inline (cards/lists) in both chat UIs.

## Capabilities (as conversation goals)
1. Create an item
2. Search for an item
3. Recommend an item
4. Delete an item
5. List items (supporting view)

## Architecture
- Server chat: `src/routes/api.demo-chat.ts` wires tools from `src/utils/demo.tools.ts`.
- Tools: file-backed Item tools + existing guitar demo tools.
- Mock DB: `src/lib/mock-db.ts` (Node fs JSON storage, seeded items).
- REST mock: `src/routes/api.items.ts` (GET list/search, POST create, DELETE by id).
- UI: `src/routes/index.tsx` renders tool parts → `ItemCard`.

## Data Model
```ts
interface Item {
  id: string
  title: string
  description?: string
  tags?: string[]
  image?: string
  createdAt: string
  updatedAt: string
}
```

## Tooling (server)
- `listItems{}` → Item[]
- `searchItems{ query }` → Item[]
- `recommendItem{}` → Item | null (naive strategy: most recently updated)
- `createItem{ title, description?, tags?, image? }` → Item
- `deleteItem{ id }` → { success, id }

## Client rendering (chat)
- Text parts → Markdown (remarkGfm + rehype sanitize/highlight/raw)
- Tool parts mapping:
  - `tool-listItems`, `tool-searchItems` → grid of `ItemCard`s
  - `tool-recommendItem`, `tool-createItem` → single `ItemCard`
  - `tool-deleteItem` → status chip

## Step-by-step Implementation
1. Mock DB
   - Add `src/lib/mock-db.ts` with `listItems`, `createItem`, `searchItems`, `recommendItem`, `deleteItem`.
   - Store JSON at `tmp/items.json` with initial seed.
2. Tools
   - Extend `src/utils/demo.tools.ts` to export item tools, preserving guitar demo.
   - Normalize image to absolute using request `origin`.
3. UI renderers
   - Create `src/components/example-ItemCard.tsx` used by chat renderers.
   - Update `src/routes/index.tsx` to:
     - Import `ItemCard`
     - Render new tool parts
     - Fix Markdown plugins: `remarkPlugins={[remarkGfm]}` and `rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}`
4. REST endpoints (optional testing surface)
   - `src/routes/api.items.ts` with `/api/items` (GET list/search, POST create) and `/api/items/$id` (DELETE).
5. Prompting
   - Update system prompt (optional) to describe item tools and the 4 tasks explicitly.
6. QA
   - Test dialogues:
     - "Create an item called Notebook with tags [stationery]"
     - "Search for notebook"
     - "Recommend an item"
     - "Delete item 1"
   - Verify UI cards and status messages render as expected.

## Notes
- Persistence is local to the running server (file system). Suitable for POC.
- Images can be relative to `public/` (normalized to absolute with request origin).
- The guitar demo remains intact; both domains can co-exist in chat.
