import { createServerFileRoute } from "@tanstack/react-start/server";
import { updateInvestmentAccount, deleteInvestmentAccount } from "@/lib/investments-db";

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

export const ServerRoute = createServerFileRoute("/api/investments/$id").methods({
  PATCH: async ({ params, request }) => {
    const body = await request.json();
    let patch: any = { ...body };
    if (Array.isArray(body.addHoldings)) {
      patch.addHoldings = body.addHoldings.map(normalizeHolding).filter(Boolean);
    }
    if (Array.isArray(body.holdings)) {
      patch.holdings = body.holdings.map(normalizeHolding).filter(Boolean);
    }
    const updated = await updateInvestmentAccount(params.id, patch);
    const status = updated ? 200 : 404
    const payload = updated || { error: `Investment account ${params.id} not found` }
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },
  DELETE: async ({ params }) => {
    const success = await deleteInvestmentAccount(params.id);
    const status = success ? 200 : 404
    const payload = { success, id: params.id }
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },
});
