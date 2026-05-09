import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

export const metadata: Metadata = { title: "Test Grid — Ponder Daily" };

// ── Layout helpers ──────────────────────────────────────────────────────────────
function gc(colStart: number, colSpan: number, rowStart: number, rowSpan: number): CSSProperties {
  return {
    gridColumn: `${colStart} / span ${colSpan}`,
    gridRow:    `${rowStart} / span ${rowSpan}`,
  };
}

// ── Card shell ──────────────────────────────────────────────────────────────────
function Card({
  gc: gcStyle,
  badge,
  badgeColor = "#e8a030",
  bg,
  children,
}: {
  gc: CSSProperties;
  badge?: string;
  badgeColor?: string;
  bg?: string;
  children: ReactNode;
}) {
  return (
    <div style={{
      ...gcStyle,
      background: bg ?? "var(--pd-surface)",
      border: "2px solid rgba(44,36,22,0.1)",
      borderRadius: 10,
      padding: "14px 16px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      minHeight: 0,
    }}>
      {badge && (
        <span style={{
          alignSelf: "flex-start",
          fontSize: 10, fontWeight: 800, letterSpacing: "0.07em",
          textTransform: "uppercase",
          background: badgeColor, color: "#fff",
          borderRadius: 4, padding: "2px 7px",
          flexShrink: 0,
        }}>{badge}</span>
      )}
      {children}
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      margin: 0, fontFamily: "Georgia, serif",
      fontSize: 15, fontWeight: 800, lineHeight: 1.3,
      color: "var(--pd-ink)",
    }}>{children}</h2>
  );
}

function Body({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <p style={{
      margin: 0, lineHeight: 1.7,
      fontSize: small ? 12 : 13,
      color: "var(--pd-ink)",
    }}>{children}</p>
  );
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "1px solid rgba(44,36,22,0.1)", margin: "2px 0" }} />;
}

// ── Option pill (for quiz / WYR) ────────────────────────────────────────────────
function Option({ children, accent = "#e8a030" }: { children: ReactNode; accent?: string }) {
  return (
    <div style={{
      padding: "8px 12px", borderRadius: 7,
      border: `1.5px solid ${accent}`,
      fontSize: 13, lineHeight: 1.4,
      color: "var(--pd-ink)",
    }}>{children}</div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function TestPage() {
  return (
    <div style={{
      padding: "20px 40px 40px",
      background: "var(--pd-bg)",
      minHeight: "100vh",
    }}>

      {/* Date + topic strip */}
      <div style={{
        display: "flex", alignItems: "baseline", gap: 16,
        marginBottom: 14,
        fontSize: 12, color: "var(--pd-ink-muted)",
        fontFamily: "Georgia, serif",
      }}>
        <span style={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Thursday 8 May 2025
        </span>
        <span>·</span>
        <span>Age 13–16</span>
        <span>·</span>
        <span style={{ fontStyle: "italic" }}>Today's theme: The Deep Ocean</span>
      </div>

      {/* ── 12-column Mondrian grid ─────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridAutoRows: "minmax(90px, auto)",
        gap: 10,
      }}>

        {/* ── 1. HERO STORY  col 1–8, rows 1–3 ─────────────────────────────── */}
        <Card gc={gc(1,8,1,3)} badge="Today's Story" badgeColor="#2a7a6e">
          <Title>Into the Abyss: Earth's Last Great Wilderness</Title>
          <Body>
            More than half of our planet is covered by ocean deeper than 3,000 metres — a world of
            crushing pressure, absolute darkness, and near-freezing temperatures. We call it the
            midnight zone, and for most of human history it was completely beyond our reach.
          </Body>
          <Body>
            Yet life didn't just survive down there. It{" "}
            <em>exploded</em>. Creatures that glow, fish with transparent heads, worms that feed on
            whale bones, and squid larger than a double-decker bus — the deep ocean turns out to be
            one of the most biodiverse environments on Earth, rivalling even the Amazon rainforest.
          </Body>
          <Body>
            The catch? We've explored less than 25% of it. Every time a submersible descends, it
            returns with species science has never seen before. The deep ocean isn't a dead end —
            it's a frontier. And right now, mining companies want to start drilling it for minerals.
            What we discover there in the next decade may shape what we decide to protect forever.
          </Body>
        </Card>

        {/* ── 2. CHARACTER SPOTLIGHT  col 9–12, rows 1–2 ───────────────────── */}
        <Card gc={gc(9,4,1,2)} badge="Who to Know" badgeColor="#7c5cbf">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 34, lineHeight: 1 }}>🧑‍🔬</span>
            <div>
              <Title>Sylvia Earle</Title>
              <Body small>
                Marine biologist. First female chief scientist of NOAA. Has led over 100 ocean
                expeditions and logged more than 7,000 hours underwater. Nicknamed{" "}
                <em>Her Deepness</em> by The New Yorker.
              </Body>
            </div>
          </div>
          <Divider />
          <Body small>
            <strong>"No ocean, no life. No blue, no green."</strong>{" "}
            Earle has spent decades arguing that protecting the ocean is the same as protecting
            ourselves — and that the deep sea needs laws before it needs industry.
          </Body>
        </Card>

        {/* ── 3. ON THIS DAY  col 9–12, row 3 ─────────────────────────────── */}
        <Card gc={gc(9,4,3,1)} badge="On This Day" badgeColor="#4e9bbf">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>📅</span>
            <div>
              <Body small>
                <strong>23 January 1960.</strong> Jacques Piccard and Don Walsh descended
                10,916 m to the bottom of the Mariana Trench in the bathyscaphe{" "}
                <em>Trieste</em> — the deepest human journey ever made. They found a flatfish.
                Life, at the very bottom of the world.
              </Body>
            </div>
          </div>
        </Card>

        {/* ── 4. PLACE SPOTLIGHT  col 1–4, rows 4–5 ────────────────────────── */}
        <Card gc={gc(1,4,4,2)} badge="Place Spotlight" badgeColor="#2a7a6e">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>🗺️</span>
            <Title>The Mariana Trench</Title>
          </div>
          <Body small>
            Located in the western Pacific, the Mariana Trench is the deepest known point on
            Earth. Its lowest section — Challenger Deep — sits 11 km below the surface.
            If you dropped Mount Everest in, it would disappear with 2 km to spare.
          </Body>
          <Body small>
            Despite the pressure (over 1,000 times that at sea level), the trench hosts
            bacteria, amphipods, sea cucumbers, and even plastic waste from the surface world.
          </Body>
        </Card>

        {/* ── 5. WOULD YOU RATHER  col 5–8, row 4 ─────────────────────────── */}
        <Card gc={gc(5,4,4,1)} badge="Would You Rather" badgeColor="#f87c52">
          <Title>One year — you choose:</Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Option accent="#4e9bbf">
              🌊 A deep-sea research station at 500m depth — no sunlight, tight quarters,
              surrounded by bioluminescent strangers
            </Option>
            <Option accent="#f87c52">
              🚀 The International Space Station — weightless, views of Earth, but
              further from home than any human can drive
            </Option>
          </div>
        </Card>

        {/* ── 6. FUN FACT  col 9–12, row 4 ─────────────────────────────────── */}
        <Card gc={gc(9,4,4,1)} badge="Fun Fact" badgeColor="#e8a030">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 30 }}>🌑</span>
            <Body>
              We have mapped <strong>more of the surface of Mars</strong> than we have of the
              Earth's ocean floor. About 80% of our oceans remain completely unmapped at high
              resolution. Space gets the budget; the deep sea gets the dark.
            </Body>
          </div>
        </Card>

        {/* ── 7. WEIRD SCIENCE  col 5–8, row 5 ─────────────────────────────── */}
        <Card gc={gc(5,4,5,1)} badge="Weird Science" badgeColor="#10b981">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 26 }}>✨</span>
            <div>
              <Title>Why the deep sea glows</Title>
              <Body small>
                76% of deep-sea creatures produce their own light — called{" "}
                <em>bioluminescence</em>. No photosynthesis happens below 200m, so evolution
                reinvented light from scratch using chemical reactions. Creatures use it to
                lure prey, find mates, and confuse predators. The ocean has its own stars.
              </Body>
            </div>
          </div>
        </Card>

        {/* ── 8. WORD OF THE DAY  col 9–12, row 5 ──────────────────────────── */}
        <Card gc={gc(9,4,5,1)} badge="Word of the Day" badgeColor="#c47d10">
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 800,
                color: "var(--pd-ink)",
              }}>Abyssal</span>
              <span style={{ fontSize: 12, color: "var(--pd-ink-muted)", fontStyle: "italic" }}>
                /əˈbɪs.əl/
              </span>
            </div>
            <Body small>
              <em>adjective.</em> Relating to the lowest depths of the ocean — from the Greek{" "}
              <em>abyssos</em>, meaning{" "}
              <strong>bottomless</strong>. An abyssal plain sits 3,000–6,000m deep and covers
              more than half of Earth's surface. Used figuratively to mean any depth too vast
              to comprehend.
            </Body>
          </div>
        </Card>

        {/* ── 9. MINI QUIZ  col 1–5, rows 6–7 ──────────────────────────────── */}
        <Card gc={gc(1,5,6,2)} badge="Quick Quiz" badgeColor="#4e9bbf">
          <Title>Deep Ocean — 3 questions</Title>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <Body small><strong>1.</strong> What percentage of the ocean has been explored by humans?</Body>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {["About 5%", "About 25%", "About 50%", "Nearly all of it"].map(a => (
                  <span key={a} style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 20,
                    background: "rgba(78,155,191,0.12)",
                    border: "1px solid rgba(78,155,191,0.3)",
                    color: "var(--pd-ink)", cursor: "pointer",
                  }}>{a}</span>
                ))}
              </div>
            </div>
            <Divider />
            <div>
              <Body small><strong>2.</strong> What is the name of the deepest known point on Earth?</Body>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {["Titan's Pit", "Challenger Deep", "Hadal Trench", "The Abyss"].map(a => (
                  <span key={a} style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 20,
                    background: "rgba(78,155,191,0.12)",
                    border: "1px solid rgba(78,155,191,0.3)",
                    color: "var(--pd-ink)",
                  }}>{a}</span>
                ))}
              </div>
            </div>
            <Divider />
            <div>
              <Body small><strong>3.</strong> What fraction of deep-sea creatures can produce their own light?</Body>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {["Around 10%", "Around 40%", "Around 76%", "Almost none"].map(a => (
                  <span key={a} style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 20,
                    background: "rgba(78,155,191,0.12)",
                    border: "1px solid rgba(78,155,191,0.3)",
                    color: "var(--pd-ink)",
                  }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ── 10. PHILOSOPHY BITE  col 6–9, row 6 ──────────────────────────── */}
        <Card gc={gc(6,4,6,1)} badge="Big Question" badgeColor="#7c5cbf">
          <span style={{ fontSize: 26 }}>⚖️</span>
          <Body>
            If a species of intelligent creatures lived at the ocean floor and had been
            aware of us for centuries — watching our waste drift down — but we had no idea
            they existed, <strong>would we owe them anything?</strong>
          </Body>
        </Card>

        {/* ── 11. DISCUSSION QUESTION  col 6–9, row 7 ──────────────────────── */}
        <Card gc={gc(6,4,7,1)} badge="Talk About It" badgeColor="#2a7a6e">
          <span style={{ fontSize: 26 }}>💬</span>
          <Body>
            The ocean floor contains rare minerals — cobalt, nickel, manganese — that we
            need to make electric car batteries and phones.{" "}
            <strong>Should we mine it, even before we know what lives there?</strong>{" "}
            Who should decide?
          </Body>
        </Card>

        {/* ── 12. MYTH VS FACT  col 10–12, rows 6–7 ────────────────────────── */}
        <Card gc={gc(10,3,6,2)} badge="Myth vs Fact" badgeColor="#f87c52">
          <Title>The ocean floor is barren and empty</Title>
          <div style={{
            padding: "6px 10px", borderRadius: 6,
            background: "rgba(248,124,82,0.12)",
            border: "1.5px solid rgba(248,124,82,0.35)",
          }}>
            <Body small><strong>❌ Myth.</strong></Body>
            <Body small>
              The deep ocean hosts the largest ecosystem on Earth by volume. More species
              may live below 200m than above it. Hydrothermal vents alone support entire
              food chains completely independent of sunlight — life that runs on chemistry,
              not the sun.
            </Body>
          </div>
        </Card>

        {/* ── 13. CREATIVE PROMPT  col 1–4, row 8 ──────────────────────────── */}
        <Card gc={gc(1,4,8,1)} badge="Create Something" badgeColor="#10b981">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 26 }}>✏️</span>
            <div>
              <Title>Design a deep-sea creature</Title>
              <Body small>
                Your creature lives at <strong>10,000m</strong>. No light. Near freezing.
                Pressure that would crush a car. Sketch or describe it — what does it eat,
                how does it move, how does it see (if at all)?
              </Body>
            </div>
          </div>
        </Card>

        {/* ── 14. BOOK & COMIC REVIEW  col 5–8, row 8 ──────────────────────── */}
        <Card gc={gc(5,4,8,1)} badge="Read This" badgeColor="#c47d10">
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 30 }}>📚</span>
            <div>
              <Title>The Deep — Rivers Solomon (2019)</Title>
              <Body small>
                Based on a Hugo-winning novella: the descendants of enslaved Africans
                thrown overboard become water-breathing merpeople in the deep ocean.
                Strange, lyrical, and genuinely haunting. Older 13–16 readers.
              </Body>
            </div>
          </div>
          <Divider />
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 26 }}>📔</span>
            <div>
              <Title>20,000 Leagues Under the Sea — Jules Verne (1870)</Title>
              <Body small>
                The original deep-sea adventure. Captain Nemo's submarine the{" "}
                <em>Nautilus</em> is still one of fiction's greatest vessels. Verne
                imagined creatures and ecosystems that science later confirmed were real.
              </Body>
            </div>
          </div>
        </Card>

        {/* ── 15. CHALLENGE  col 9–12, row 8 ───────────────────────────────── */}
        <Card gc={gc(9,4,8,1)} badge="Today's Challenge" badgeColor="#e8a030">
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 28 }}>🎯</span>
            <div>
              <Title>Go deeper</Title>
              <Body small>
                Look up one deep-sea creature you've never heard of — not an anglerfish,
                everyone knows those. Find something weirder. Bring it to the dinner
                table tonight. Bonus: find out its scientific name and what it eats.
              </Body>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
