import type { SensitivityRow } from "@/lib/calculation/sensitivity";

type Props = { rows: SensitivityRow[] };

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function SensitivityTable({ rows }: Props) {
  if (rows.length === 0) return null;
  return (
    <div className="sensitivity" data-testid="sensitivity">
      <h3>ถ้าราคาขายเปลี่ยน</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">เปลี่ยนแปลง</th>
            <th scope="col">ราคาขาย</th>
            <th scope="col">กำไร</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stepPercent} className={row.current ? "current" : undefined}>
              <th scope="row">{row.stepPercent > 0 ? "+" : ""}{row.stepPercent}%</th>
              <td>{usd.format(row.sellPriceUsd)}</td>
              <td className={row.profitThb > 0 ? "up" : row.profitThb < 0 ? "down" : undefined}>
                {row.profitThb > 0 ? "+" : ""}{thb.format(row.profitThb)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
