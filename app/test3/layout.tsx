export default function Test3Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer style={{
        height: 50, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "var(--pd-ink-muted)",
      }}>
        Ponder Daily · free forever · no accounts · no tracking
      </footer>
    </>
  );
}
