type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

export async function fetchWithRetry(
  url: string,
  init: NextFetchInit = {},
  retries = 1,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        throw new Error(`Provider returned HTTP ${response.status}.`);
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Provider request failed.");
}

export function positiveIntegerFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
