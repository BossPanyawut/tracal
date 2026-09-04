import { apiError } from "@/lib/http/apiResponse";
import { isRateLimited, requestKey } from "@/lib/http/rateLimit";
import { getCryptoQuote, getGoldQuote } from "@/lib/services/marketDataService";
import { marketQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  if (isRateLimited(`market:${requestKey(request)}`)) {
    return apiError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);
  }
  const url = new URL(request.url);
  const parsed = marketQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Choose a supported market asset.", 400);
  }

  try {
    const quote =
      parsed.data.type === "gold"
        ? await getGoldQuote()
        : await getCryptoQuote(parsed.data.id);
    return Response.json({ type: parsed.data.type, ...quote });
  } catch {
    return apiError(
      "MARKET_PROVIDER_UNAVAILABLE",
      "Live market price is temporarily unavailable. Enter a price manually to continue.",
      503,
    );
  }
}
