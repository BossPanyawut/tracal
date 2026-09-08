import { D } from "./v2";
/** Format decimal strings without passing large/precise amounts through binary floats. */
export function formatDecimal(value: string, places = 2, signed = false) {
  const n = new D(value), tiny = !n.isZero() && n.abs().lt(new D(10).pow(-places));
  const text = n.abs().toFixed(places);
  const [integer, fraction] = text.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = n.isNegative() ? "-" : signed && n.gt(0) ? "+" : "";
  if (tiny) return `${sign}<${new D(10).pow(-places).toFixed(places)}`;
  return `${sign}${grouped}${fraction === undefined ? "" : `.${fraction}`}`;
}
export function money(value: string, currency: string, signed = false) {
  const str = formatDecimal(value, 2, signed);
  const symbol = currency === "USD" ? "$" : currency === "THB" ? "฿" : "₮";
  return /^[+-]/.test(str) ? `${str[0]}${symbol}${str.slice(1)}` : `${symbol}${str}`;
}
