import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ponder Daily — something new to think about, every day",
  description:
    "A free daily reading space for curious kids aged 6–16. Fresh stories and questions every day, designed to spark real conversations.",
  openGraph: {
    siteName: "Ponder Daily",
    url: "https://ponderdaily.space",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-nunito), Georgia, serif" }}
      >
        <SiteNav />
        <main className="flex-1">{children}</main>
        <footer className="py-8 px-6 text-center text-sm" style={{ color: "var(--pd-ink-muted)" }}>
          <p>
            Ponder Daily is free forever · no accounts · no tracking · no data stored ·{" "}
            <a href="/about" className="underline hover:opacity-70">
              about &amp; privacy
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
