import { z } from "zod";
import { numericText } from "@/lib/calculation/v2";
const positive = numericText.refine((v) => Number(v) > 0, "ต้องมากกว่า 0");
export const transactionSchema = z.object({
  id: z.string().min(1).max(1500), occurredAt: z.iso.datetime(),
  asset: z.string().regex(/^[A-Z0-9]{1,12}$/), quoteCurrency: z.enum(["USD", "USDT"]),
  side: z.enum(["buy", "sell"]), quantity: positive, price: numericText, feeQuote: numericText,
  fx: positive, extraCostThb: numericText,
});
export type Transaction = z.infer<typeof transactionSchema>;
export const journalSchema = z.object({ version: z.literal(1), transactions: z.array(transactionSchema).max(1000) });
