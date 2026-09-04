import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calculator } from "@/components/calculator/Calculator";

function fxResponse(status = 200) {
  return Promise.resolve(new Response(JSON.stringify({
    base: "USD", quote: "THB", rate: 33, source: "Coinbase",
    referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false,
  }), { status }));
}

describe("Calculator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => fxResponse()));
  });

  it("turns THB capital into a quantity and a profit", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Sell price USD"), "2");
    // 3300 THB = 100 USD; a 0.1% buy fee leaves 100/1.001 units.
    await waitFor(() => expect(screen.getByTestId("quantity")).toHaveTextContent("99.9000999"));
    expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$99.60");
    expect(screen.getByTestId("profit-thb")).toHaveTextContent("฿3,286.81");
  });

  it("shows a loss when the sell price is below the break-even price", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Sell price USD"), "0.8");
    await waitFor(() => expect(screen.getByText("ขาดทุน")).toBeInTheDocument());
  });

  it("waits for every required input before showing a result", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    expect(screen.queryByTestId("profit-thb")).not.toBeInTheDocument();
    expect(screen.getByText("รอข้อมูลสำหรับคำนวณ")).toBeInTheDocument();
  });

  it("falls back to a manual rate when the FX provider is unavailable", async () => {
    vi.mocked(fetch).mockImplementation(() => fxResponse(503));
    const user = userEvent.setup();
    render(<Calculator />);
    const manualRate = await screen.findByLabelText("Manual USD THB rate");
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Sell price USD"), "2");
    await user.type(manualRate, "33");
    await waitFor(() => expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$99.60"));
  });

  it("shows profit at a ladder of sell prices around the one entered", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Sell price USD"), "2");
    const table = await screen.findByTestId("sensitivity");
    expect(within(table).getByText("-10%")).toBeInTheDocument();
    expect(within(table).getByText("+10%")).toBeInTheDocument();
    // -10% moves the sell price to 1.80.
    expect(within(table).getByText("$1.80")).toBeInTheDocument();
  });

  it("answers what sell price reaches a target profit", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Target profit THB"), "3300");
    await waitFor(() =>
      expect(screen.getByTestId("required-price")).toHaveTextContent("$2.00"));
  });

  it("restores the previous inputs on the next visit", async () => {
    const user = userEvent.setup();
    const first = render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await waitFor(() => expect(window.localStorage.getItem("tracal.calculator.v1")).toContain("3300"));
    first.unmount();

    render(<Calculator />);
    await waitFor(() => expect(screen.getByLabelText("Capital THB")).toHaveValue("3300"));
    expect(screen.getByLabelText("Buy price USD")).toHaveValue("1");
  });

  it("ignores stored data that no longer matches the input shape", async () => {
    window.localStorage.setItem("tracal.calculator.v1", JSON.stringify({ quantity: "5" }));
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    expect(screen.getByLabelText("Capital THB")).toHaveValue("");
  });

  it("resets every input back to the defaults", async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    await screen.findByText(/แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300");
    await user.type(screen.getByLabelText("Buy price USD"), "1");
    await user.type(screen.getByLabelText("Sell price USD"), "2");
    await waitFor(() => expect(screen.getByTestId("profit-thb")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "ล้างค่า" }));
    expect(screen.getByLabelText("Capital THB")).toHaveValue("");
    expect(screen.queryByTestId("profit-thb")).not.toBeInTheDocument();
  });
});
