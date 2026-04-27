"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const bands = [
  { href: "/6-8",   label: "Ages 6–8",   color: "var(--pd-68-accent)" },
  { href: "/9-12",  label: "Ages 9–12",  color: "var(--pd-912-accent)" },
  { href: "/13-16", label: "Ages 13–16", color: "var(--pd-1316-accent)" },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-sm"
      style={{ background: "var(--pd-surface)", borderBottom: "2px solid var(--pd-bg-alt)" }}
    >
      <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-base"
          style={{ background: "var(--pd-teal)" }}
        >
          ?
        </span>
        <span style={{ color: "var(--pd-ink)" }}>Ponder Daily</span>
      </Link>

      <ul className="flex items-center gap-1 sm:gap-2">
        {bands.map(({ href, label, color }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90"
                style={{
                  background: active ? color : "transparent",
                  color: active ? "#fff" : "var(--pd-ink-muted)",
                  border: `2px solid ${active ? color : "var(--pd-bg-alt)"}`,
                }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
