export type FxQuote = {
  base: "USD";
  quote: "THB";
  rate: number;
  source: string;
  referenceDate: string;
  fetchedAt: string;
  stale: boolean;
};

export interface FxProvider {
  getUsdThb(): Promise<FxQuote>;
}
