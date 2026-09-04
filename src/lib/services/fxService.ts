import { CoinbaseFxProvider } from "@/lib/providers/coinbase";
import { FrankfurterProvider } from "@/lib/providers/frankfurter";
import type { FxProvider, FxQuote } from "@/lib/providers/types";

let lastKnownFx: FxQuote | null = null;

export async function getUsdThbQuote(
  provider: FxProvider = new CoinbaseFxProvider(),
  fallbackProvider: FxProvider | null = new FrankfurterProvider(),
): Promise<FxQuote> {
  try {
    const quote = await provider.getUsdThb();
    lastKnownFx = quote;
    return quote;
  } catch (error) {
    if (fallbackProvider) {
      try {
        const fallbackQuote = await fallbackProvider.getUsdThb();
        lastKnownFx = fallbackQuote;
        return fallbackQuote;
      } catch {
        // Continue to the last-known-good fallback below.
      }
    }
    if (lastKnownFx) return { ...lastKnownFx, stale: true };
    throw error;
  }
}

export function clearFxCacheForTests(): void {
  lastKnownFx = null;
}
