import { journalSchema, type Transaction } from "./schema";
import { validateJournal } from "@/lib/calculation/journal";
import { writeVerified } from "@/lib/plans/storage";
export const JOURNAL_KEY = "tracal.journal.v1";
export function loadJournal(storage: Storage) {
  const raw = storage.getItem(JOURNAL_KEY);
  const transactions = raw ? journalSchema.parse(JSON.parse(raw)).transactions : [];
  validateJournal(transactions); return transactions;
}
export function saveJournal(storage: Storage, transactions: Transaction[]) {
  const data = journalSchema.parse({ version: 1, transactions }); validateJournal(data.transactions);
  if (new Blob([JSON.stringify(data)]).size > 1_048_576) throw new Error("สมุดรายการเกิน 1 MiB กรุณาสำรองก่อนลดจำนวนรายการ");
  writeVerified(storage, JOURNAL_KEY, data);
}
export function mergeJournal(existing: Transaction[], imported: Transaction[]) {
  const ids = new Map(existing.map((t) => [t.id, t])); let duplicates = 0;
  for (const t of imported) {
    const old = ids.get(t.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(t)) throw new Error("รหัสรายการเดิมมีข้อมูลต่างกัน กรุณาตรวจไฟล์ก่อนนำเข้า");
      duplicates++;
    } else ids.set(t.id, t);
  }
  const transactions = [...ids.values()]; validateJournal(transactions);
  if (transactions.length > 1000) throw new Error("เก็บได้สูงสุด 1000 รายการ");
  return { transactions, duplicates };
}
