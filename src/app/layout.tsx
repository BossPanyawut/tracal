import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRACAL — Trading Cost & Profit Calculator",
  description: "Calculate crypto and gold trading costs, profit, ROI and THB estimates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
