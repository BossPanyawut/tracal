import { z } from "zod";
export const widgetSchema = z.object({
  brand: z.string().trim().min(1).max(60).default("TRACAL"),
  accent: z.string().regex(/^[0-9a-fA-F]{6}$/).default("fcd535"),
}).strict();
export function widgetQuery(brand: string, accent: string) { const value = widgetSchema.parse({ brand, accent }); return new URLSearchParams(value).toString(); }
