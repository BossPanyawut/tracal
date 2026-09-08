import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calculator } from "@/components/calculator/Calculator";
import { DRAFT_KEY, LEGACY_KEY, PLANS_KEY } from "@/lib/plans/storage";
function fxResponse(rate = 33, status = 200) { return Promise.resolve(Response.json({ base: "USD", quote: "THB", rate, source: "Coinbase", referenceDate: "2026-01-01", fetchedAt: "2026-01-01T00:00:00.000Z", stale: false }, { status })); }
beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn(() => fxResponse())); });
async function fillTrade(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Capital THB"), "3300");
  await user.type(screen.getByLabelText("Buy price USD"), "1");
  await user.type(screen.getByLabelText("Sell price USD"), "2");
}
describe("Calculator v2", () => {
  it("shows the original same-FX fee calculation with one reference fetch", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/); await fillTrade(user);
    expect(screen.getByTestId("quantity")).toHaveTextContent("99.9000999");
    expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$99.60");
    expect(screen.getByTestId("profit-thb")).toHaveTextContent("฿3,286.81"); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps manual controls available while loading and after provider failure", async () => {
    vi.mocked(fetch).mockImplementation(() => fxResponse(33, 503));
    const user = userEvent.setup(); render(<Calculator />);
    expect(screen.getByLabelText("Buy FX rate")).toBeEnabled(); await fillTrade(user);
    await user.type(screen.getByLabelText("Buy FX rate"), "33"); await user.type(screen.getByLabelText("Sell FX rate"), "33");
    expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$99.60");
  });
  it("separates USD profit from THB loss and preserves manual rates on refresh", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/);
    for (const [label,value] of [["Capital THB","35000"],["Buy price USD","1000"],["Sell price USD","1100"],["Buy FX rate","35"],["Sell FX rate","31"],["ค่าธรรมเนียมซื้อ","0"],["ค่าธรรมเนียมขาย","0"]]) { await user.clear(screen.getByLabelText(label)); await user.type(screen.getByLabelText(label), value); }
    expect(screen.getByTestId("profit-usd")).toHaveTextContent("+$100.00"); expect(screen.getByTestId("profit-thb")).toHaveTextContent("-฿900.00");
    vi.mocked(fetch).mockImplementation(() => fxResponse(40)); await user.click(screen.getByRole("button", { name: "รีเฟรชอ้างอิง" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); expect(screen.getByLabelText("Buy FX rate")).toHaveValue("35"); expect(screen.getByLabelText("Sell FX rate")).toHaveValue("31");
  });
  it("does not show a result until required inputs are valid", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/);
    await user.type(screen.getByLabelText("Capital THB"), "3300"); await user.type(screen.getByLabelText("Buy price USD"), ".");
    expect(screen.queryByTestId("profit-thb")).not.toBeInTheDocument(); expect(screen.getByText("รอข้อมูลสำหรับคำนวณ")).toBeInTheDocument();
  });
  it("uses engine scenarios and handles target zero and unreachable loss", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/); await fillTrade(user);
    expect(within(screen.getByTestId("sensitivity")).getByText("$1.80")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Target profit THB"), "0"); expect(screen.getByTestId("required-price")).toHaveTextContent("$1.00");
    await user.clear(screen.getByLabelText("Target profit THB")); await user.type(screen.getByLabelText("Target profit THB"), "-4000");
    expect(screen.getByText(/ราคาขายติดลบ/)).toBeInTheDocument();
  });
  it("restores v2 inputs with their applied FX even if the reference changes", async () => {
    const user = userEvent.setup(); const first = render(<Calculator />); await screen.findByText(/^แปลงที่/); await fillTrade(user);
    await waitFor(() => expect(localStorage.getItem(DRAFT_KEY)).toContain("3300")); first.unmount();
    vi.mocked(fetch).mockImplementation(() => fxResponse(40)); render(<Calculator />);
    await waitFor(() => expect(screen.getByLabelText("Capital THB")).toHaveValue("3300")); expect(screen.getByLabelText("Buy FX rate")).toHaveValue("33");
  });
  it("migrates legacy inputs but does not fabricate historical FX", async () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ capitalThb: "3300", buyPriceUsd: "1", sellPriceUsd: "2", buyFee: { mode: "fixed", value: "0" }, sellFee: { mode: "fixed", value: "0" }, manualUsdThb: "", targetProfitThb: "" }));
    render(<Calculator />); await screen.findByText(/ไม่บันทึกเรตอ้างอิงย้อนหลัง/);
    expect(screen.getByLabelText("Buy FX rate")).toHaveValue(""); expect(screen.queryByTestId("profit-thb")).not.toBeInTheDocument(); expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
  });
  it("requires separate USDT inputs and never copies the USD quote", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/);
    await user.selectOptions(screen.getByLabelText("สกุลราคาซื้อขาย"), "USDT");
    expect(screen.getByLabelText("Buy FX rate")).toHaveValue(""); expect(screen.getByLabelText("Buy price USDT")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "ใช้อ้างอิงทั้งสองขา" })).not.toBeInTheDocument();
  });
  it("stops plan writes and offers the untouched raw data when plan storage is corrupt", async () => {
    localStorage.setItem(PLANS_KEY, "{broken");
    render(<Calculator />);
    expect(await screen.findByText(/หยุดการเขียนทับ/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ดาวน์โหลดข้อมูลแผนดิบ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "บันทึกแผน" })).toBeDisabled();
    expect(localStorage.getItem(PLANS_KEY)).toBe("{broken");
  });
  it("resets the calculator without deleting or overwriting the active saved plan", async () => {
    const user = userEvent.setup(); render(<Calculator />); await screen.findByText(/^แปลงที่/); await fillTrade(user);
    await user.type(screen.getByLabelText("ชื่อแผน"), "First plan"); await user.click(screen.getByRole("button", { name: "บันทึกแผน" }));
    await user.click(screen.getByRole("button", { name: "ล้างค่า" }));
    expect(screen.getByLabelText("Capital THB")).toHaveValue("");
    expect(screen.getAllByRole("button", { name: /First plan/ })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "ใช้อ้างอิงทั้งสองขา" }));
    await fillTrade(user);
    await user.type(screen.getByLabelText("ชื่อแผน"), "Second plan");
    await user.click(screen.getByRole("button", { name: "บันทึกแผน" }));
    const stored = JSON.parse(localStorage.getItem(PLANS_KEY) ?? "null") as { plans: Array<{ name: string }> };
    expect(stored.plans.map((plan) => plan.name)).toEqual(["First plan", "Second plan"]);
  });
});
