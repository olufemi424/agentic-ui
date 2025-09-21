import { createServerFileRoute } from "@tanstack/react-start/server";
import {
  listInvestments,
  createInvestmentAccount,
  updateInvestmentAccount,
  deleteInvestmentAccount,
} from "@/lib/investments-db";

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
    const created = await createInvestmentAccount({
      institution: body.institution,
      accountType: body.accountType,
      name: body.name,
      balance: body.balance ?? 0,
      holdings: body.holdings ?? [],
    } as any);
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  },
});

export const ItemServerRoute = createServerFileRoute("/api/investments/$id").methods({
  PATCH: async ({ params, request }) => {
    const patch = await request.json();
    const updated = await updateInvestmentAccount(params.id, patch);
    return new Response(JSON.stringify(updated), {
      status: updated ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  },
  DELETE: async ({ params }) => {
    const success = await deleteInvestmentAccount(params.id);
    return new Response(JSON.stringify({ success, id: params.id }), {
      status: success ? 200 : 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});
