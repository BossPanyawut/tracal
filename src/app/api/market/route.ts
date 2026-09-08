import { z } from "zod";
import { apiError } from "@/lib/http/apiResponse";
import { isRateLimited, requestKey } from "@/lib/http/rateLimit";
import { getMarketQuote } from "@/lib/providers/market";
export async function GET(request: Request) {
  if (isRateLimited(`market:${requestKey(request)}`)) return apiError("RATE_LIMITED", "Too many requests.", 429);
  const query = z.object({ symbol: z.enum(["BTC", "ETH", "XAU"]) }).strict().safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return apiError("INVALID_REQUEST", "Choose BTC, ETH or XAU in USD.", 400);
  try { return Response.json(await getMarketQuote(query.data.symbol)); }
  catch { return apiError("MARKET_PROVIDER_UNAVAILABLE", "Reference price unavailable. Enter prices manually. Gold reference requires server configuration.", 503); }
}
