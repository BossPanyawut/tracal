import { z } from "zod";
export const fxQuerySchema = z.object({
  base: z.literal("USD").default("USD"),
  quote: z.literal("THB").default("THB"),
});

export const marketQuerySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("crypto"),
    id: z.enum(["bitcoin", "ethereum"]),
  }),
  z.object({ type: z.literal("gold"), id: z.string().optional() }),
]);
