import SiteNav from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="flex-1">{children}</main>
      <footer style={{ height: 50, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 24px", color: "var(--pd-ink-muted)", fontSize: 12 }}>
        <p>
          Ponder Daily is free forever · no accounts · no tracking · no data stored ·{" "}
          <a href="/about" className="underline hover:opacity-70">
            about &amp; privacy
          </a>
        </p>
      </footer>
    </>
  );
}
