import { tool } from "ai";
import { z } from "zod";

import guitars from "../data/example-guitars";
import {
  createItem as dbCreateItem,
  listItems as dbListItems,
  searchItems as dbSearchItems,
  recommendItem as dbRecommendItem,
  deleteItem as dbDeleteItem,
  type Item,
} from "../lib/mock-db";
import {
  createInvestmentAccount,
  deleteInvestmentAccount,
  listInvestments,
  updateInvestmentAccount,
  computeInsights,
  type InvestmentAccount,
} from "../lib/investments-db";

function toAbsolute(src: string | undefined, origin?: string) {
  if (!src) return src;
  if (!origin) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (!src.startsWith("/")) return `${origin}/${src}`;
  return `${origin}${src}`;
}

export default async function getTools({ origin }: { origin?: string } = {}) {
  const withOrigin = {
    // Demo guitar tools (existing)
    getGuitars: tool({
      description: "Get all products from the database",
      inputSchema: z.object({}),
      execute: async (_input, _ctx) => {
        const products = guitars.map((guitar) => ({
          ...guitar,
          image: origin ? `${origin}${guitar.image}` : guitar.image,
        }));
        return Promise.resolve(products);
      },
    }),
    recommendGuitar: tool({
      description: "Use this tool to recommend a guitar to the user",
      inputSchema: z.object({
        id: z.string().describe("The id of the guitar to recommend"),
      }),
      execute: async ({ id }) => {
        return { id };
      },
    }),

    // POC item tools (file-backed mock DB)
    listItems: tool({
      description: "List all items",
      inputSchema: z.object({}),
      execute: async () => {
        const items = await dbListItems();
        return items.map((i) => ({ ...i, image: toAbsolute(i.image, origin) })) as Item[];
      },
    }),

    searchItems: tool({
      description: "Search items by text (title/description/tags)",
      inputSchema: z.object({ query: z.string().min(1) }),
      execute: async ({ query }) => {
        const items = await dbSearchItems(query);
        return items.map((i) => ({ ...i, image: toAbsolute(i.image, origin) })) as Item[];
      },
    }),

    recommendItem: tool({
      description: "Recommend a single item (naive strategy)",
      inputSchema: z.object({}),
      execute: async () => {
        const rec = await dbRecommendItem();
        return rec ? { ...rec, image: toAbsolute(rec.image, origin) } : null;
      },
    }),

    createItem: tool({
      description: "Create an item",
      inputSchema: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
      }),
      execute: async ({ title, description, tags, image }) => {
        const created = await dbCreateItem({ title, description, tags, image });
        return { ...created, image: toAbsolute(created.image, origin) } as Item;
      },
    }),

    deleteItem: tool({
      description: "Delete an item by id",
      inputSchema: z.object({ id: z.string().min(1) }),
      execute: async ({ id }) => {
        const success = await dbDeleteItem(id);
        return { success, id };
      },
    }),

    // Investment tools (POC)
    createInvestmentAccount: tool({
      description: "Create an investment account",
      inputSchema: z.object({
        institution: z.string().min(1),
        accountType: z.string().min(1),
        name: z.string().min(1),
        balance: z.number().optional(),
        holdings: z
          .array(
            z.object({
              symbol: z.string(),
              quantity: z.number(),
              avgPrice: z.number(),
              sector: z.string().optional(),
            }),
          )
          .optional(),
      }),
      execute: async ({ institution, accountType, name, balance = 0, holdings = [] }) => {
        const created = await createInvestmentAccount({
          institution,
          accountType,
          name,
          balance,
          holdings,
        } as InvestmentAccount);
        return created as InvestmentAccount;
      },
    }),

    updateInvestmentAccount: tool({
      description: "Update an investment account by id",
      inputSchema: z.object({
        id: z.string().min(1),
        patch: z.object({}).passthrough(),
      }),
      execute: async ({ id, patch }) => {
        const updated = await updateInvestmentAccount(id, patch as Partial<InvestmentAccount>);
        return updated;
      },
    }),

    deleteInvestmentAccount: tool({
      description: "Delete an investment account by id",
      inputSchema: z.object({ id: z.string().min(1) }),
      execute: async ({ id }) => {
        const success = await deleteInvestmentAccount(id);
        return { success, id };
      },
    }),

    listInvestments: tool({
      description: "List investments with optional filters",
      inputSchema: z.object({
        filters: z
          .object({
            institution: z.string().optional(),
            accountType: z.string().optional(),
            name: z.string().optional(),
            minBalance: z.number().optional(),
          })
          .partial()
          .optional(),
      }),
      execute: async ({ filters }) => {
        const accounts = await listInvestments(filters as any);
        return accounts as InvestmentAccount[];
      },
    }),

    getInvestmentInsights: tool({
      description: "Compute portfolio insights",
      inputSchema: z.object({}),
      execute: async () => {
        const insights = await computeInsights();
        return insights;
      },
    }),
  } as const;

  return withOrigin;
}
