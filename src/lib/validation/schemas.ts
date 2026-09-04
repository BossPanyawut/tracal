import { z } from "zod";

export const fxQuerySchema = z.object({
  base: z.literal("USD").default("USD"),
  quote: z.literal("THB").default("THB"),
});
