import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calculator } from "@/components/calculator/Calculator";

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

describe("Calculator", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn((input: string | URL | Request) => {
      const url = input.toString();
      if (url.startsWith("/api/fx")) {
        return jsonResponse({
          base: "USD", quote: "THB", rate: 34, source: "Coinbase",
          referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
        });
      }
      return jsonResponse({
        type: "crypto", symbol: "BTC", currency: "USD", price: 65000,
        source: "CoinGecko", marketUpdatedAt: "2026-01-01T00:00:00.000Z",
        fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
      });
    }));
  });

  it("calculates in real time with Binance Spot default fees", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/Coinbase/);
    await user.type(screen.getByLabelText("Quantity"), "0.1");
    await user.type(screen.getByLabelText("Buy price USD"), "50000");
    await user.type(screen.getByLabelText("Sell price USD"), "60000");
    await waitFor(() => expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$989.00"));
    expect(screen.getByTestId("profit-thb")).toHaveTextContent("+฿33,626.00");
    expect(screen.getByTestId("roi")).toHaveTextContent("+19.76%");
  });

  it("uses the live reference price only after the user chooses it", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await user.type(screen.getByLabelText("Quantity"), "0.1");
    await user.type(screen.getByLabelText("Buy price USD"), "50000");
    await user.click(await screen.findByRole("button", { name: /use as sell price/i }));
    expect(screen.getByLabelText("Sell price USD")).toHaveValue("65000");
    expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$1,488.50");
  });

  it("opens manual FX when the live provider fails", async () => {
    vi.mocked(fetch).mockImplementation((input: string | URL | Request) => {
      if (input.toString().startsWith("/api/fx")) {
        return jsonResponse({ error: { message: "Enter a manual rate." } }, 503);
      }
      return jsonResponse({
        symbol: "BTC", currency: "USD", price: 65000, source: "CoinGecko",
        marketUpdatedAt: null, fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
      });
    });
    const user = userEvent.setup();
    render(<Calculator />);
    const manualRate = await screen.findByLabelText("Manual USD THB rate");
    await user.type(screen.getByLabelText("Quantity"), "0.1");
    await user.type(screen.getByLabelText("Buy price USD"), "50000");
    await user.type(screen.getByLabelText("Sell price USD"), "60000");
    await user.type(manualRate, "35");
    expect(screen.getByTestId("profit-thb")).toHaveTextContent("+฿34,615.00");
  });
});
