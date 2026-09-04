const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const requests = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, now = Date.now()): boolean {
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export function requestKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
