import { transactionSchema, type Transaction } from "./schema";
import { D, numericText } from "@/lib/calculation/v2";
export const CSV_HEADER = ["id", "occurredAt", "asset", "quoteCurrency", "side", "quantity", "price", "feeQuote", "fx", "extraCostThb"] as const;
export function csvRows(raw: string): string[][] {
  if (new Blob([raw]).size > 1_048_576) throw new Error("CSV ต้องไม่เกิน 1 MiB");
  raw = raw.replace(/^\uFEFF/, "");
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (quoted) {
      if (c === '"') { if (raw[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += c;
    } else if (c === '"') {
      if (cell || closed) throw new Error("เครื่องหมายคำพูดใน CSV ไม่ถูกต้อง"); quoted = true;
    } else if (c === "," || c === "\n" || c === "\r") {
      row.push(cell); cell = ""; closed = false;
      if (c !== ",") { if (c === "\r" && raw[i + 1] === "\n") i++; if (row.some((v) => v.trim())) rows.push(row); row = []; }
    } else { if (closed && c !== " ") throw new Error("CSV มีตัวอักษรหลังปิดคำพูด"); if (!closed) cell += c; }
  }
  if (quoted) throw new Error("CSV ปิดเครื่องหมายคำพูดไม่ครบ");
  row.push(cell); if (row.some((v) => v.trim())) rows.push(row);
  if (rows.length > 1001) throw new Error("นำเข้าได้สูงสุด 1000 รายการ");
  return rows;
}
function safeCell(value: string) { const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value; return `"${safe.replaceAll('"', '""')}"`; }
export function exportJournalCsv(transactions: Transaction[]) {
  return [CSV_HEADER.join(","), ...transactions.map((t) => CSV_HEADER.map((key) => safeCell(t[key])).join(","))].join("\r\n");
}
export function importJournalCsv(raw: string, options: { format: "tracal" | "binance"; fx?: string }) {
  const rows = csvRows(raw); if (rows.length < 2) throw new Error("CSV ไม่มีรายการ");
  const headers = rows[0].map((s) => s.trim());
  if (new Set(headers).size !== headers.length) throw new Error("ชื่อคอลัมน์ CSV ซ้ำ");
  const required = options.format === "tracal" ? CSV_HEADER : ["Date(UTC)", "Pair", "Side", "Price", "Executed", "Fee"];
  for (const name of required) if (!headers.includes(name)) throw new Error(`ไม่มีคอลัมน์ ${name}`);
  const errors: string[] = [], transactions: Transaction[] = [], occurrences = new Map<string, number>();
  rows.slice(1).forEach((cells, index) => {
    try {
      if (cells.length !== headers.length) throw new Error("จำนวนคอลัมน์ไม่ตรง header");
      const r = Object.fromEntries(headers.map((key, i) => [key, cells[i].trim()]));
      if (options.format === "tracal") {
        // Only undo the escaping we apply on export; values remain plain text in React.
        if (r.id.startsWith("'") && /^[\s]*[=+\-@\t\r]/.test(r.id.slice(1))) r.id = r.id.slice(1);
        transactions.push(transactionSchema.parse(r));
      } else {
        const fx = numericText.parse(options.fx ?? ""); if (new D(fx).lte(0)) throw new Error("ต้องกรอกเรต THB ที่ใช้กับชุดนำเข้า");
        const match = /^([A-Z0-9]{1,12})(USDT|USD)$/.exec(r.Pair.replace("/", ""));
        if (!match) throw new Error("รองรับเฉพาะคู่ USD/USDT");
        const [, asset, quoteCurrency] = match;
        function withUnit(text: string, currency: string) {
          const value = text.replace(/\s/g, "").replace(new RegExp(`${currency}$`), "");
          return numericText.parse(value);
        }
        const quantity = withUnit(r.Executed, asset), price = withUnit(r.Price, quoteCurrency);
        let feeQuote: string;
        try { feeQuote = withUnit(r.Fee, quoteCurrency); } catch { throw new Error(`ค่าธรรมเนียมต้องเป็น ${quoteCurrency}; ยังไม่รองรับ fee เป็นเหรียญหรือ BNB`); }
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r["Date(UTC)"])) throw new Error("Date(UTC) ต้องเป็น YYYY-MM-DD HH:mm:ss");
        const occurredAt = r["Date(UTC)"].replace(" ", "T") + ".000Z";
        const canonical = [occurredAt, r.Pair, r.Side, quantity, price, feeQuote].join("|");
        const occurrence = occurrences.get(canonical) ?? 0; occurrences.set(canonical, occurrence + 1);
        const side = r.Side.toLowerCase();
        transactions.push(transactionSchema.parse({ id: `binance:${canonical}:${occurrence}`, occurredAt, asset, quoteCurrency, side, quantity, price, feeQuote, fx, extraCostThb: "0" }));
      }
    } catch (error) { const message = error instanceof Error && !error.message.startsWith("[") ? error.message : "ตรวจตัวเลข เวลา สกุลเงิน และช่องที่จำเป็น"; errors.push(`แถว ${index + 2}: ${message}`); }
  });
  return { transactions, errors };
}
