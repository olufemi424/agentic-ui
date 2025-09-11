import { tool } from "ai";
import { z } from "zod";

import guitars from "../data/example-guitars";

const getGuitars = tool({
  description: "Get all products from the database",
  inputSchema: z.object({}),
  execute: async (_input, _context) => {
    const origin = (_context as unknown as { origin?: string })?.origin || "";
    const products = guitars.map((guitar) => ({
      ...guitar,
      image: origin ? `${origin}${guitar.image}` : guitar.image,
    }));
    return Promise.resolve(products);
  },
});

const recommendGuitar = tool({
  description: "Use this tool to recommend a guitar to the user",
  inputSchema: z.object({
    id: z.string().describe("The id of the guitar to recommend"),
  }),
  execute: async ({ id }) => {
    return {
      id,
    };
  },
});

export default async function getTools({ origin }: { origin?: string } = {}) {
  // Bind origin into the tool execution context using closure over tool.execute via ai SDK context param
  const withOrigin = {
    getGuitars: tool({
      description: getGuitars.description,
      inputSchema: z.object({}),
      execute: async (_input, _ctx) => {
        const products = guitars.map((guitar) => ({
          ...guitar,
          image: origin ? `${origin}${guitar.image}` : guitar.image,
        }));
        return Promise.resolve(products);
      },
    }),
    recommendGuitar,
  };

  return withOrigin;
}
