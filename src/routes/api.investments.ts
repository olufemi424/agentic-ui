import { createServerFileRoute } from "@tanstack/react-start/server";
import {
  listInvestments,
  createInvestmentAccount,
  updateInvestmentAccount,
  deleteInvestmentAccount,
} from "@/lib/investments-db";

function normalizeHolding(raw: any) {
  if (!raw) return null
  if (typeof raw === 'string') {
    const m = raw.match(/^(?:\s*(\d+(?:\.\d+)?))?\s*([A-Za-z]{1,8})\s*(?:at|@)?\s*(\d+(?:\.\d+)?)/i)
    if (m) {
      const qty = m[1] ? Number(m[1]) : NaN
      const sym = m[2]
      const price = Number(m[3])
      if (!isNaN(qty) && sym && !isNaN(price)) return { symbol: sym.toUpperCase(), quantity: qty, avgPrice: price }
    }
    return null
  }
  const symbol = (raw.symbol || raw.ticker || '').toString().toUpperCase()
  const quantity = raw.quantity ?? raw.qty
  const avgPrice = raw.avgPrice ?? raw.price ?? raw.cost
  const sector = raw.sector ? String(raw.sector) : undefined
  const qn = Number(quantity)
  const pn = Number(avgPrice)
  if (!symbol || isNaN(qn) || isNaN(pn)) return null
  return { symbol, quantity: qn, avgPrice: pn, sector }
}

export const ServerRoute = createServerFileRoute("/api/investments").methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const institution = url.searchParams.get("institution") || undefined;
    const accountType = url.searchParams.get("accountType") || undefined;
    const name = url.searchParams.get("name") || undefined;
    const minBalance = url.searchParams.get("minBalance");

    const filters: any = {
      institution,
      accountType,
      name,
      minBalance: minBalance ? Number(minBalance) : undefined,
    };

    const result = await listInvestments(filters);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  POST: async ({ request }) => {
    const body = await request.json();
    const holdings = Array.isArray(body.holdings) ? body.holdings.map(normalizeHolding).filter(Boolean) : []
    const created = await createInvestmentAccount({
      institution: body.institution,
      accountType: body.accountType,
      name: body.name,
      balance: Number(body.balance ?? 0),
      holdings,
    } as any);
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// Note: PATCH/DELETE moved to src/routes/api.investments.$id.ts to ensure proper route registration
