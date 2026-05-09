"use client";

import { useEffect, useState } from "react";
import type { GCell, GLayout } from "@/components/GridDesigner";

// ── Content types mapped by cell num (1-based) ──────────────────────────────
const CONTENT: Record<number, {
  badge: string;
  badgeColor: string;
  emoji?: string;
  title: string;
  body: string;
  hero?: boolean;
}> = {
  1: {
    badge: "Today's Story", badgeColor: "#2a7a6e", emoji: "🌊", hero: true,
    title: "Into the Abyss: Earth's Last Great Wilderness",
    body: "More than half our planet sits under 3,000 m of crushing, lightless ocean. We've explored less than 25% of it — yet every descent finds species science has never seen. Mining companies now want to drill it. What we discover may decide what we protect forever.",
  },
  2: {
    badge: "Who to Know", badgeColor: "#7c5cbf", emoji: "🧑‍🔬",
    title: "Sylvia Earle — 'Her Deepness'",
    body: "7,000+ hours underwater. 100+ expeditions. First female chief scientist of NOAA. \"No ocean, no life. No blue, no green.\"",
  },
  3: {
    badge: "On This Day", badgeColor: "#4e9bbf", emoji: "📅",
    title: "23 Jan 1960",
    body: "Piccard & Walsh reached the bottom of the Mariana Trench in the bathyscaphe Trieste. They found a flatfish — life, at the very bottom of the world.",
  },
  4: {
    badge: "Word of the Day", badgeColor: "#c47d10",
    title: "Abyssal  /əˈbɪs.əl/",
    body: "From Greek abyssos — bottomless. Relating to the ocean floor below 3,000 m. Used figuratively for any depth too vast to comprehend.",
  },
  5: {
    badge: "Fun Fact", badgeColor: "#e8a030", emoji: "🌑",
    title: "Mars is better mapped than our ocean",
    body: "We've charted more of Mars's surface than Earth's ocean floor. 80% of our oceans remain uncharted at high resolution. Space gets the budget; the deep sea gets the dark.",
  },
  6: {
    badge: "Quick Quiz", badgeColor: "#4e9bbf",
    title: "Deep Ocean — 3 questions",
    body: "1. What % of the ocean has been explored? (~5% / ~25% / ~50% / Nearly all)\n2. Name of Earth's deepest point? (Titan's Pit / Challenger Deep / Hadal Trench / The Abyss)\n3. What fraction of deep-sea creatures glow? (~10% / ~40% / ~76% / Almost none)",
  },
  7: {
    badge: "Place Spotlight", badgeColor: "#2a7a6e", emoji: "🗺️",
    title: "The Mariana Trench",
    body: "Western Pacific. 11 km deep — enough to swallow Everest with 2 km to spare. Pressure 1,000× the surface. Home to bacteria, amphipods, sea cucumbers… and plastic.",
  },
  8: {
    badge: "Would You Rather", badgeColor: "#f87c52",
    title: "One year — you choose:",
    body: "🌊 Deep-sea station at 500m — no sunlight, total darkness, bioluminescent neighbours\n— or —\n🚀 ISS — weightless, Earth views, but further from home than you can drive",
  },
  9: {
    badge: "Weird Science", badgeColor: "#10b981", emoji: "✨",
    title: "Why the deep sea glows",
    body: "76% of deep-sea creatures produce their own light. No sun reaches below 200m, so evolution reinvented light from chemistry. The ocean has its own stars.",
  },
  10: {
    badge: "Big Question", badgeColor: "#7c5cbf", emoji: "⚖️",
    title: "A philosophical puzzle",
    body: "If intelligent creatures lived at the ocean floor and had been watching our waste drift down for centuries — would we owe them anything?",
  },
  11: {
    badge: "Talk About It", badgeColor: "#2a7a6e", emoji: "💬",
    title: "Should we mine the ocean floor?",
    body: "The ocean floor holds the minerals inside your phone and EV battery. Should we drill it before we know what lives there? Who decides?",
  },
  12: {
    badge: "Myth vs Fact", badgeColor: "#f87c52", emoji: "❌",
    title: "\"The ocean floor is barren\"",
    body: "Myth. Hydrothermal vents support entire food chains with zero sunlight. More species may live below 200m than above it.",
  },
  13: {
    badge: "Create Something", badgeColor: "#10b981", emoji: "✏️",
    title: "Design a creature at 10,000m",
    body: "No light. Near freezing. Crushing pressure. What does it eat? How does it see? Sketch it or describe it.",
  },
  14: {
    badge: "Read This", badgeColor: "#c47d10", emoji: "📚",
    title: "The Deep + 20,000 Leagues",
    body: "The Deep (Rivers Solomon) — descendants of enslaved Africans become deep-sea merpeople. Haunting. 20,000 Leagues (Verne, 1870) — the original submarine adventure, still the best.",
  },
  15: {
    badge: "Today's Challenge", badgeColor: "#e8a030", emoji: "🎯",
    title: "Go deeper",
    body: "Find a deep-sea creature nobody at your dinner table has heard of. Bring it tonight. Bonus: its scientific name and what it eats.",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const STORE_KEY = "ponder-grid-designer";

function loadLayout(index: number): GLayout | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as { layouts: GLayout[] };
    return store.layouts[index] ?? null;
  } catch { return null; }
}

// ── Tile ─────────────────────────────────────────────────────────────────────
function Tile({ cell, cols, rows }: { cell: GCell; cols: number; rows: number }) {
  const c = CONTENT[cell.num ?? 0];

  return (
    <div style={{
      gridColumn: `${cell.colStart} / span ${cell.colSpan}`,
      gridRow:    `${cell.rowStart} / span ${cell.rowSpan}`,
      background: "var(--pd-surface)",
      border: "2px solid rgba(44,36,22,0.1)",
      borderRadius: 9,
      padding: c?.hero ? "14px 18px" : "10px 12px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: c?.hero ? 8 : 5,
      minHeight: 0,
      minWidth: 0,
    }}>
      {c ? (
        <>
          <span style={{
            alignSelf: "flex-start", flexShrink: 0,
            fontSize: 9, fontWeight: 800, letterSpacing: "0.07em",
            textTransform: "uppercase",
            background: c.badgeColor, color: "#fff",
            borderRadius: 3, padding: "2px 6px",
          }}>{c.badge}</span>

          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", minHeight: 0 }}>
            {c.emoji && (
              <span style={{ fontSize: c.hero ? 24 : 17, lineHeight: 1.1, flexShrink: 0 }}>
                {c.emoji}
              </span>
            )}
            <strong style={{
              fontSize: c.hero ? 15 : 12,
              fontFamily: "Georgia, serif",
              fontWeight: 800,
              lineHeight: 1.25,
              color: "var(--pd-ink)",
            }}>{c.title}</strong>
          </div>

          <p style={{
            margin: 0,
            fontSize: c.hero ? 13 : 11,
            lineHeight: 1.6,
            color: "var(--pd-ink)",
            flex: 1,
            overflow: "hidden",
            whiteSpace: "pre-line",
          }}>{c.body}</p>
        </>
      ) : (
        /* Unassigned cell — show its number */
        <span style={{
          fontSize: 11, color: "var(--pd-ink-muted)",
          fontFamily: "monospace",
        }}>Cell {cell.num}</span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function Test2Page() {
  const [layout, setLayout] = useState<GLayout | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const l = loadLayout(2);   // 0-based → index 2 = 3rd layout
    if (l) setLayout(l);
    else   setMissing(true);
  }, []);

  const snapshot = layout?.snapshots[0];
  const cells = snapshot?.cells ?? [];

  if (missing) {
    return (
      <div style={{ padding: 40, fontFamily: "Georgia, serif", color: "var(--pd-ink)" }}>
        <h2>No third layout found in the Grid Designer.</h2>
        <p>Open <a href="/design">/design</a>, create at least 3 layouts, then reload this page.</p>
      </div>
    );
  }

  if (!layout) {
    return (
      <div style={{ padding: 40, color: "var(--pd-ink-muted)", fontFamily: "monospace" }}>
        Loading grid 3…
      </div>
    );
  }

  return (
    <div style={{
      padding: "12px 32px",
      background: "var(--pd-bg)",
      height: "calc(100dvh - 56px)",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    }}>
      {/* Date strip */}
      <div style={{
        display: "flex", gap: 12, alignItems: "baseline",
        fontSize: 11, color: "var(--pd-ink-muted)",
        fontFamily: "Georgia, serif",
        marginBottom: 8, flexShrink: 0,
      }}>
        <strong style={{ letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Thursday 8 May 2025
        </strong>
        <span>·</span><span>Age 13–16</span>
        <span>·</span>
        <span style={{ fontStyle: "italic" }}>The Deep Ocean</span>
        <span>·</span>
        <span style={{ color: "#aaa" }}>{layout.name} ({layout.cols}×{layout.rows})</span>
      </div>

      {/* Grid — dimensions driven by the saved layout */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        gap: 8,
      }}>
        {cells
          .slice()
          .sort((a, b) => (a.num ?? 0) - (b.num ?? 0))
          .map(cell => (
            <Tile key={cell.id} cell={cell} cols={layout.cols} rows={layout.rows} />
          ))}
      </div>
    </div>
  );
}
