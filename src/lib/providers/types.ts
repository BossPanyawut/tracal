import { z } from "zod";
export const fxQuoteSchema = z.object({
  base: z.literal("USD"), quote: z.literal("THB"), rate: z.number().positive().finite(),
  source: z.string().min(1).max(100), referenceDate: z.iso.date().nullable(), fetchedAt: z.iso.datetime(), stale: z.boolean(),
});
export type FxQuote = z.infer<typeof fxQuoteSchema>;
export interface FxProvider { getUsdThb(): Promise<FxQuote>; }
