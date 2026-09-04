import { apiError } from "@/lib/http/apiResponse";
import { isRateLimited, requestKey } from "@/lib/http/rateLimit";
import { getUsdThbQuote } from "@/lib/services/fxService";
import { fxQuerySchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  if (isRateLimited(`fx:${requestKey(request)}`)) {
    return apiError("RATE_LIMITED", "Too many requests. Please try again shortly.", 429);
  }
  const url = new URL(request.url);
  const parsed = fxQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Only the USD/THB currency pair is supported.", 400);
  }
  try {
    return Response.json(await getUsdThbQuote());
  } catch {
    return apiError(
      "FX_PROVIDER_UNAVAILABLE",
      "Live USD/THB is temporarily unavailable. Enter a manual rate to continue.",
      503,
    );
  }
}
