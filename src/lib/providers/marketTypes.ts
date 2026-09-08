import { z } from "zod";
export const marketQuoteSchema = z.object({
  symbol: z.enum(["BTC", "ETH", "XAU"]), currency: z.literal("USD"), price: z.string().regex(/^\d{1,18}(\.\d{1,12})?$/).refine((v) => Number(v) > 0),
  unit: z.enum(["unit", "troy_ounce"]), source: z.string().min(1).max(100), marketUpdatedAt: z.iso.datetime().nullable(), fetchedAt: z.iso.datetime(), stale: z.boolean(),
});
export type MarketQuote = z.infer<typeof marketQuoteSchema>;
