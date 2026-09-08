import Link from "next/link";

type Section = "home" | "calculator" | "journal" | "widget";

const links: Array<{ href: string; label: string; section: Section }> = [
  { href: "/calculator", label: "คำนวณและแผน", section: "calculator" },
  { href: "/journal", label: "สมุดรายการ", section: "journal" },
  { href: "/widget", label: "Widget", section: "widget" },
];

export function SiteHeader({ active }: { active: Section }) {
  const cta = active === "calculator"
    ? { href: "/journal", label: "เปิดสมุดรายการ" }
    : { href: "/calculator", label: "เริ่มคำนวณ" };

  return <header className="topbar">
    <Link className="brand" href="/" aria-label="TRACAL หน้าแรก">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>TRACAL</span>
    </Link>
    <nav className="topbar-nav" aria-label="เมนูหลัก">
      {links.map((link) => <Link key={link.section} href={link.href} className={active === link.section ? "active" : undefined} aria-current={active === link.section ? "page" : undefined}>{link.label}</Link>)}
    </nav>
    <Link className="nav-cta" href={cta.href}>{cta.label}</Link>
  </header>;
}
