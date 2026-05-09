import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-nunito), Georgia, serif" }}
      >
        {children}
      </body>
    </html>
  );
}
