"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import type { GCell, GLayout } from "@/components/GridDesigner";

// ── Types ─────────────────────────────────────────────────────────────────────
type Store = { layouts: GLayout[]; todayId: string | null; palette: string[]; bgColor?: string };
type Band  = "6-8" | "9-12" | "13-16";

// ── Helpers ───────────────────────────────────────────────────────────────────
function ink(hex: string): string {
  if (!hex.startsWith("#") || hex.length < 7) return "#2c2416";
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.52 ? "#2c2416" : "#ffffff";
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Piece        = { type: string; title: string; body: string; isTitle?: boolean };
type BandContent  = Record<string, Piece>;
type FrozenLayout = { cols: number; rows: number; cells: GCell[] };
type DayContent   = { theme: string; brief?: string; layoutName?: string; layout?: FrozenLayout } & Record<Band, BandContent>;

// Resolve the layout to render: frozen snapshot first, then live template fallback.
// This means GridDesigner edits never retroactively change a day that has been frozen.
function resolveLayout(store: Store, content: DayContent | null): FrozenLayout | null {
  // 1. Prefer frozen snapshot baked at assignment time
  if (content?.layout) return content.layout;

  // 2. Fall back to live template by name (unassigned / legacy)
  const tpl = content?.layoutName
    ? (store.layouts.find(l => l.name === content.layoutName) ?? store.layouts.find(l => l.name === "Grid 3") ?? store.layouts[2] ?? store.layouts[0])
    : (store.layouts.find(l => l.name === "Grid 3") ?? store.layouts[2] ?? store.layouts[0]);

  if (!tpl) return null;
  return { cols: tpl.cols, rows: tpl.rows, cells: tpl.snapshots[0]?.cells ?? [] };
}

const TITLE_CELL_ID = "j6wd322";

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Content sync ──────────────────────────────────────────────────────────────
function useContentSync(date: string) {
  const [content, setContent] = useState<DayContent | null>(null);

  const fetchContent = useCallback(async () => {
    setContent(null);
    try {
      const res = await fetch(`/api/content?date=${date}`, { cache: "no-store" });
      if (res.ok) setContent(await res.json());
    } catch {}
  }, [date]);

  useEffect(() => {
    fetchContent();
    window.addEventListener("focus", fetchContent);
    return () => window.removeEventListener("focus", fetchContent);
  }, [fetchContent]);

  return content;
}

// Build the band content map, injecting the synthetic title cell
function buildBandContent(content: DayContent, band: Band, date: string): BandContent {
  return {
    ...content[band],
    [TITLE_CELL_ID]: {
      isTitle: true, type: "",
      title: "Ponder Daily",
      body: `${formatDate(date)} · ${content.theme}`,
    },
  };
}

// ── Band config ───────────────────────────────────────────────────────────────
const BANDS: { id: Band; label: string }[] = [
  { id: "6-8",   label: "6–8"   },
  { id: "9-12",  label: "9–12"  },
  { id: "13-16", label: "13–16" },
];

// ── Live-sync hook ────────────────────────────────────────────────────────────
function useGridSync() {
  const [store, setStore] = useState<Store | null>(null);
  const lastJsonRef       = useRef<string>("");

  const fetchStore = useCallback(async () => {
    try {
      const res  = await fetch("/api/gd-sync", { cache: "no-store" });
      const json = await res.text();
      if (json !== lastJsonRef.current) {
        lastJsonRef.current = json;
        setStore(JSON.parse(json));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStore();
    const id = setInterval(fetchStore, 1500);
    return () => clearInterval(id);
  }, [fetchStore]);

  return store;
}

// ── Nav props passed to title cell ────────────────────────────────────────────
type NavProps = {
  onPrev: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  fg: string;
};

// ── Cell component ────────────────────────────────────────────────────────────
function Cell({ cell, content, navProps }: {
  cell: GCell;
  content: BandContent;
  navProps?: NavProps;
}) {
  const p       = content[cell.id];
  const isTitle = p?.isTitle ?? false;
  const fg      = ink(cell.color);
  const area    = cell.colSpan * cell.rowSpan;
  const tiny    = area <= 2;  // tiny: badge+title only, no body

  const badgeBg = fg === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)";

  // Body overflow detection
  const bodyRef             = useRef<HTMLParagraphElement>(null);
  const [showBody, setShowBody] = useState(true);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setShowBody(el.scrollHeight <= el.clientHeight + 2);
  }, []);

  return (
    <div
      className={["test3-cell", isTitle ? "test3-title-cell" : ""].filter(Boolean).join(" ")}
      style={{
        gridColumn:    `${cell.colStart} / span ${cell.colSpan}`,
        gridRow:       `${cell.rowStart} / span ${cell.rowSpan}`,
        background:    cell.color,
        borderRadius:  8,
        padding:       isTitle ? "7px 12px" : "8px 10px",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        gap:           4,
        minHeight:     0,
        minWidth:      0,
        color:         fg,
        userSelect:    "text",
        position:      "relative",
      }}
    >
      {p ? (
        isTitle ? (
          /* ── Title cell ──────────────────────────────────────────────────── */
          (() => {
            const [dateStr, ...rest] = p.body.split(" · ");
            const theme = rest.join(" · ");
            const nav = navProps;
            const btnStyle: React.CSSProperties = {
              background: "none", border: "none", cursor: "pointer",
              fontSize: 17, lineHeight: 1, padding: "0 3px",
              color: fg, opacity: 0.5,
              fontFamily: "system-ui, sans-serif",
            };
            return (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>

                {/* Left — wordmark row 1, date + nav row 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{
                    fontSize: 20, fontWeight: 900, letterSpacing: "0.04em",
                    fontFamily: "Georgia, serif", lineHeight: 1.2,
                  }}>
                    {p.title}
                  </span>
                  {/* Date with prev/next arrows */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0,
                    fontSize: 12, lineHeight: 1.3, opacity: 0.55 }}>
                    {nav?.canGoBack && (
                      <button onClick={nav.onPrev} style={{ ...btnStyle, marginLeft: -4 }}>‹</button>
                    )}
                    <span>{dateStr}</span>
                    {nav?.canGoForward && (
                      <button onClick={nav.onNext} style={btnStyle}>›</button>
                    )}
                  </div>
                </div>

                {/* Right — "Today's theme:" label + theme value */}
                {theme && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0, transform: "translateY(5px)" }}>
                    <span style={{ fontSize: 12, lineHeight: 1.3, opacity: 0.55, whiteSpace: "nowrap" }}>
                      Today&apos;s theme:
                    </span>
                    <span style={{
                      fontSize: 14.5, fontFamily: "Georgia, serif",
                      fontWeight: 700, lineHeight: 1.25, whiteSpace: "nowrap",
                    }}>
                      {theme}
                    </span>
                  </div>
                )}
              </div>
            );
          })()

        ) : (
          /* ── Content cell ────────────────────────────────────────────────── */
          <>
            {!tiny && (
              <span style={{
                alignSelf: "flex-start", flexShrink: 0,
                fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: badgeBg, borderRadius: 3,
                padding: "1px 4px", lineHeight: 1.4,
              }}>{p.type}</span>
            )}

            <strong style={{
              flexShrink: 0, fontSize: 14.5, fontFamily: "Georgia, serif", lineHeight: 1.25,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}>
              {p.title}
            </strong>

            {!tiny && (
              <p
                ref={bodyRef}
                style={{
                  margin: 0, flexShrink: 1, flex: 1, fontSize: 15, lineHeight: 1.55,
                  overflow: "hidden", opacity: showBody ? 0.88 : 0, whiteSpace: "pre-line",
                }}
              >{p.body}</p>
            )}
          </>
        )
      ) : (
        <span style={{ fontSize: 12, opacity: 0.30, fontFamily: "monospace" }}>{cell.id}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Test3Page() {
  const store                       = useGridSync();
  const [band, setBand]             = useState<Band>("13-16");
  const [date, setDate]             = useState(() => new Date().toISOString().slice(0, 10));
  const [isAdmin, setIsAdmin]       = useState(false);
  const [contentList, setContentList] = useState<string[]>([]);
  const content                     = useContentSync(date);

  // Detect admin mode from URL (?admin)
  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).has("admin"));
    fetch("/api/content/list", { cache: "no-store" })
      .then(r => r.json())
      .then((list: string[]) => setContentList([...list].sort()))
      .catch(() => {});
  }, []);

  // Navigate only to dates that have content
  const idx         = contentList.indexOf(date);
  const prevDate    = idx > 0 ? contentList[idx - 1] : null;
  const nextDate    = idx < contentList.length - 1 ? contentList[idx + 1] : null;
  const canGoBack   = prevDate !== null;
  const canGoForward = isAdmin && nextDate !== null;

  const navProps: NavProps = {
    onPrev:      () => prevDate && setDate(prevDate),
    onNext:      () => nextDate && setDate(nextDate),
    canGoBack,
    canGoForward,
    fg:          "#fff", // placeholder; actual fg computed in Cell
  };

  const layout = store ? resolveLayout(store, content) : null;
  const cells  = layout?.cells ?? [];

  if (!store || !content) {
    return (
      <div style={{ padding: 40, fontFamily: "Georgia, serif", color: "var(--pd-ink)" }}>
        <p>Loading… (open <a href="/design">/design</a> to sync grid)</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <div style={{ padding: 40, fontFamily: "Georgia, serif", color: "var(--pd-ink)" }}>
        <h2>No layout found.</h2>
        <p>Create a layout named &quot;Grid 3&quot; in <a href="/design">/design</a>, or assign a layout in <a href="/textedit">/textedit</a>.</p>
      </div>
    );
  }

  return (
    <div
      className="test3-wrapper"
      style={{
        padding:       "10px 28px",
        background:    store.bgColor ?? "var(--pd-bg)",
        height:        "100dvh",
        display:       "flex",
        flexDirection: "column",
        boxSizing:     "border-box",
        maxWidth:      1600,
        margin:        "0 auto",
        width:         "100%",
      }}
    >
      {/* ── Thin top bar — band selector only ────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "flex-end", alignItems: "center",
        flexShrink: 0, paddingBottom: 6,
      }}>
        <div style={{ display: "flex", gap: 5, transform: "translateY(-2px)" }}>
          {BANDS.map(b => (
            <button
              key={b.id}
              onClick={() => setBand(b.id)}
              style={{
                padding: "2px 11px", borderRadius: 20,
                fontSize: 12, fontWeight: 700, lineHeight: 1.5,
                border: `1.5px solid ${band === b.id ? "var(--pd-ink)" : "rgba(0,0,0,0.18)"}`,
                background: band === b.id ? "var(--pd-ink)" : "transparent",
                color:      band === b.id ? "#fff" : "var(--pd-ink-muted)",
                cursor: "pointer",
              }}
            >{b.label}</button>
          ))}
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div
        className="test3-grid"
        style={{
          flex:                1,
          minHeight:           0,
          display:             "grid",
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows:    `repeat(${layout.rows}, 1fr)`,
          gap:                 8,
        }}
      >
        {cells.map(cell => (
          <Cell
            key={`${cell.id}-${cell.colSpan}-${cell.rowSpan}`}
            cell={cell}
            content={buildBandContent(content, band, date)}
            navProps={cell.id === TITLE_CELL_ID ? navProps : undefined}
          />
        ))}
      </div>
    </div>
  );
}
