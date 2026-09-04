import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "MARKET_PROVIDER_UNAVAILABLE"
  | "FX_PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED";

export function apiError(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message, manualInputAllowed: true } },
    { status },
  );
}
