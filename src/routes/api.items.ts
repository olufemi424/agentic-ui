import { createServerFileRoute } from "@tanstack/react-start/server";
import { listItems, createItem, deleteItem, searchItems } from "@/lib/mock-db";

export const ServerRoute = createServerFileRoute("/api/items").methods({
  // GET /api/items?query=foo
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("query");
    try {
      const result = q ? await searchItems(q) : await listItems();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to list items" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // POST /api/items  { title, description?, tags?, image? }
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const created = await createItem({
        title: body.title,
        description: body.description,
        tags: body.tags,
        image: body.image,
      });
      return new Response(JSON.stringify(created), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to create item" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

export const DeleteServerRoute = createServerFileRoute("/api/items/$id").methods({
  DELETE: async ({ params }) => {
    try {
      const success = await deleteItem(params.id);
      return new Response(JSON.stringify({ success, id: params.id }), {
        status: success ? 200 : 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to delete item" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
