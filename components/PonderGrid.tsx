"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useLayoutEffect, useRef } from "react";

export type ContentPiece = {
  id: string;
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
  topicCategory: string;
  contentType?: string;
  emoji?: string;
};

type Props = {
  pieces: ContentPiece[];
  accentColor: string;
  ageBand: "6-8" | "9-12" | "13-16";
  tagline: string;
};

// ── Metadata maps ──────────────────────────────────────────────────────────

const TOPIC_EMOJI: Record<string, string> = {
  nature: "🌿", science: "🔬", history: "📜", technology: "💡",
  culture: "🎭", "human interest": "🤝", geography: "🌍", language: "📖",
  mathematics: "🔢", biography: "🧠", philosophy: "⚖️",
};

const TYPE_META: Record<string, { badge: string; color: string }> = {
  article:      { badge: "Read",    color: "" },
  puzzle:       { badge: "Puzzle",  color: "#f59e0b" },
  bio:          { badge: "Thinker", color: "#8b5cf6" },
  fact:         { badge: "Fact",    color: "#0ea5e9" },
  illustration: { badge: "Explore", color: "#10b981" },
};

// ── Age-band characters ────────────────────────────────────────────────────

const CHARACTERS: Record<"6-8" | "9-12" | "13-16", Array<{ emoji: string; name: string; quote: string }>> = {
  "6-8": [
    { emoji: "🦊", name: "Finn",  quote: "Every question is a superpower." },
    { emoji: "🐙", name: "Otto",  quote: "Eight arms, endless curiosity!" },
    { emoji: "🦋", name: "Maya",  quote: "Small changes make big wonders." },
  ],
  "9-12": [
    { emoji: "🔭", name: "Nova",  quote: "The universe rewards the curious." },
    { emoji: "⚗️", name: "Pip",   quote: "Wrong experiments teach the most." },
    { emoji: "🗺️", name: "Zara",  quote: "Every map has blank spaces waiting." },
  ],
  "13-16": [
    { emoji: "💡", name: "Theo",  quote: "A good question beats a quick answer." },
    { emoji: "🌿", name: "Sage",  quote: "Evidence is the beginning, not the end." },
    { emoji: "⚖️", name: "Lyra",  quote: "What do you actually know for certain?" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]*[.!?]/);
  return m ? m[0] : text.slice(0, 100);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const LAYOUT_SPRING = { type: "spring" as const, stiffness: 500, damping: 40, mass: 0.6 };
const CONTENT_HIDE_MS = 180;
const JELLO_DURATION = 0.55;

// ── Mondrian layout types and templates ───────────────────────────────────

type Slot = {
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
};

type Layout = {
  hero: Slot;
  chars: [Slot, Slot];
  contents: [Slot, Slot, Slot];
  empties: Slot[];
};

const LAYOUT_A: Layout = {
  hero:     { colStart:1,  colSpan:3, rowStart:1, rowSpan:2 },
  chars:   [{ colStart:9,  colSpan:4, rowStart:1, rowSpan:3 },
             { colStart:1,  colSpan:3, rowStart:3, rowSpan:4 }],
  contents:[{ colStart:4,  colSpan:5, rowStart:1, rowSpan:4 },
             { colStart:4,  colSpan:5, rowStart:5, rowSpan:5 },
             { colStart:9,  colSpan:4, rowStart:4, rowSpan:4 }],
  empties: [{ colStart:1,  colSpan:3, rowStart:7, rowSpan:3 },
             { colStart:9,  colSpan:4, rowStart:8, rowSpan:2 }],
};

const LAYOUT_B: Layout = {
  hero:     { colStart:10, colSpan:3, rowStart:1, rowSpan:2 },
  chars:   [{ colStart:1,  colSpan:3, rowStart:1, rowSpan:3 },
             { colStart:10, colSpan:3, rowStart:3, rowSpan:4 }],
  contents:[{ colStart:4,  colSpan:6, rowStart:1, rowSpan:3 },
             { colStart:1,  colSpan:5, rowStart:4, rowSpan:6 },
             { colStart:6,  colSpan:4, rowStart:4, rowSpan:4 }],
  empties: [{ colStart:6,  colSpan:4, rowStart:8, rowSpan:2 },
             { colStart:10, colSpan:3, rowStart:7, rowSpan:3 }],
};

const LAYOUT_C: Layout = {
  hero:     { colStart:5,  colSpan:4, rowStart:1, rowSpan:2 },
  chars:   [{ colStart:1,  colSpan:4, rowStart:1, rowSpan:4 },
             { colStart:1,  colSpan:4, rowStart:5, rowSpan:5 }],
  contents:[{ colStart:9,  colSpan:4, rowStart:1, rowSpan:5 },
             { colStart:5,  colSpan:4, rowStart:3, rowSpan:4 },
             { colStart:5,  colSpan:4, rowStart:7, rowSpan:3 }],
  empties: [{ colStart:9,  colSpan:4, rowStart:6, rowSpan:4 }],
};

const LAYOUTS = [LAYOUT_A, LAYOUT_B, LAYOUT_C];

function getDailyLayout(): Layout {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return LAYOUTS[dayOfYear % LAYOUTS.length];
}

function slotStyle(slot: Slot): React.CSSProperties {
  return {
    "--col-start": slot.colStart,
    "--col-span":  slot.colSpan,
    "--row-start": slot.rowStart,
    "--row-span":  slot.rowSpan,
  } as React.CSSProperties;
}

// ── PonderGrid ─────────────────────────────────────────────────────────────

export default function PonderGrid({ pieces, accentColor, ageBand, tagline }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const layout = getDailyLayout();
  const chars = CHARACTERS[ageBand];

  const toggle = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const p = [pieces[0] ?? null, pieces[1] ?? null, pieces[2] ?? null];

  return (
    <div className="mondri-grid">
      {/* Hero */}
      <motion.div layout transition={LAYOUT_SPRING} className="mondri-cell" style={slotStyle(layout.hero)}>
        <HeroCell tagline={tagline} accentColor={accentColor} />
      </motion.div>

      {/* Characters */}
      {layout.chars.map((slot, i) => (
        <motion.div key={`char-${i}`} layout transition={LAYOUT_SPRING} className="mondri-cell" style={slotStyle(slot)}>
          <CharacterCell {...chars[i]} accentColor={accentColor} />
        </motion.div>
      ))}

      {/* Content pieces */}
      {layout.contents.map((slot, i) => {
        const piece = p[i];
        const isExp = piece ? expanded === piece.id : false;
        return (
          <motion.div
            key={piece?.id ?? `empty-content-${i}`}
            layout
            transition={LAYOUT_SPRING}
            className="mondri-cell"
            style={slotStyle(slot)}
          >
            {piece ? (
              <PonderCard
                piece={piece}
                index={i}
                isExpanded={isExp}
                accentColor={accentColor}
                type={piece.contentType ?? "article"}
                onToggle={() => toggle(piece.id)}
              />
            ) : (
              <EmptyCell accentColor={accentColor} />
            )}
          </motion.div>
        );
      })}

      {/* Negative space */}
      {layout.empties.map((slot, i) => (
        <motion.div key={`empty-${i}`} layout transition={LAYOUT_SPRING} className="mondri-cell" style={slotStyle(slot)}>
          <EmptyCell accentColor={accentColor} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Hero cell ──────────────────────────────────────────────────────────────

function HeroCell({ tagline, accentColor }: { tagline: string; accentColor: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between h-full"
      style={{
        background: accentColor,
        minHeight: 140,
        boxShadow: `0 4px 20px ${accentColor}40`,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
        Ponder Daily
      </p>
      <div>
        <p className="text-white font-semibold text-sm sm:text-base leading-snug">{tagline}</p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{fmtDate(new Date())}</p>
      </div>
    </div>
  );
}

// ── Character cell ─────────────────────────────────────────────────────────

function CharacterCell({
  emoji, name, quote, accentColor,
}: { emoji: string; name: string; quote: string; accentColor: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 h-full"
      style={{
        background: `${accentColor}12`,
        border: `2px solid ${accentColor}28`,
        minHeight: 130,
      }}
    >
      <span style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</span>
      <div>
        <p className="font-bold text-sm" style={{ color: accentColor }}>{name}</p>
        <p className="text-xs italic leading-snug mt-0.5" style={{ color: "var(--pd-ink-muted)" }}>
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}

// ── Empty / negative space cell ────────────────────────────────────────────

function EmptyCell({ accentColor }: { accentColor: string }) {
  return (
    <div
      className="rounded-2xl h-full"
      style={{
        background: `${accentColor}07`,
        border: `2px solid ${accentColor}12`,
        minHeight: 80,
      }}
    />
  );
}

// ── Individual card ────────────────────────────────────────────────────────

function PonderCard({
  piece, index, isExpanded, accentColor, type, onToggle,
}: {
  piece: ContentPiece;
  index: number;
  isExpanded: boolean;
  accentColor: string;
  type: string;
  onToggle: () => void;
}) {
  const emoji = piece.emoji || TOPIC_EMOJI[piece.topicCategory] || "💭";
  const typeMeta = TYPE_META[type] ?? TYPE_META.article;
  const teaser = firstSentence(piece.body);

  const [contentVisible, setContentVisible] = useState(true);
  const mounted = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jellyRef = useRef<HTMLDivElement>(null);
  const jellyControls = useAnimation();

  // Hide content during layout animation, fade back in after settle + jello
  useLayoutEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setContentVisible(false);
    hideTimer.current = setTimeout(() => {
      setContentVisible(true);
      const h = jellyRef.current?.offsetHeight ?? 200;
      const d1 = 4 / h;
      const d2 = d1 / 2;
      jellyControls.start({
        scaleY: [1 - d1, 1 + d1, 1 - d2, 1 + d2, 1],
        scaleX: [1 + d1, 1 - d1, 1 + d2, 1 - d2, 1],
        transition: {
          scaleY: { duration: 0.38, times: [0, 0.2, 0.45, 0.72, 1], ease: "easeOut" },
          scaleX: { duration: 0.38, times: [0, 0.2, 0.45, 0.72, 1], ease: "easeOut" },
        },
      });
    }, CONTENT_HIDE_MS);
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28, scaleY: 0.88, scaleX: 1.08 }}
      animate={{
        opacity: 1, y: 0,
        scaleY: [0.88, 1.15, 0.92, 1.07, 0.97, 1.02, 1],
        scaleX: [1.08, 0.90, 1.06, 0.97, 1.02, 0.99, 1],
      }}
      exit={{ opacity: 0, y: -16, scaleY: 0.92 }}
      transition={{
        layout: LAYOUT_SPRING,
        opacity: { duration: 0.16 },
        y: { duration: 0.3, ease: [0.2, 0, 0.2, 1] as [number, number, number, number] },
        scaleY: { duration: JELLO_DURATION, times: [0, 0.14, 0.32, 0.52, 0.70, 0.86, 1], ease: "easeOut" },
        scaleX: { duration: JELLO_DURATION, times: [0, 0.14, 0.32, 0.52, 0.70, 0.86, 1], ease: "easeOut" },
        delay: index * 0.07,
      }}
      // Collapsed cards fill their grid cell; expanded cards grow to content height
      className={`rounded-2xl cursor-pointer${isExpanded ? "" : " h-full overflow-hidden"}`}
      style={{
        background: "var(--pd-surface)",
        border: `2px solid ${accentColor}33`,
        boxShadow: isExpanded ? `0 10px 36px ${accentColor}28` : "0 2px 8px rgba(0,0,0,0.05)",
        transformOrigin: "bottom center",
      }}
      onClick={() => { if (window.getSelection()?.toString()) return; onToggle(); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onToggle()}
      aria-expanded={isExpanded}
    >
      <motion.div ref={jellyRef} animate={jellyControls} style={{ transformOrigin: "bottom center" }}>
        <div style={{ opacity: contentVisible ? 1 : 0, transition: contentVisible ? "opacity 0.15s ease" : "none" }}>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {type !== "article" && typeMeta.color && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${typeMeta.color}22`, color: typeMeta.color }}
                  >
                    {typeMeta.badge}
                  </span>
                )}
              </div>
              <span
                className="text-xl font-black leading-none flex-shrink-0"
                style={{
                  color: accentColor,
                  transform: `rotate(${isExpanded ? 45 : 0}deg)`,
                  transition: "transform 0.22s ease",
                }}
              >
                +
              </span>
            </div>

            <h2 className="font-bold text-sm sm:text-base leading-snug mb-1" style={{ color: "var(--pd-ink)" }}>
              {piece.title}{" "}
              <span className="font-normal" style={{ fontSize: "1.1em" }}>{emoji}</span>
            </h2>

            {isExpanded ? (
              <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>{piece.body}</p>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color: "var(--pd-ink-muted)" }}>{teaser}</p>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <div className="px-4 pb-5">
                  <div className="h-px mb-4" style={{ background: `${accentColor}33` }} />
                  {type === "puzzle" ? (
                    <PuzzleContent piece={piece} accentColor={accentColor} />
                  ) : type === "bio" ? (
                    <BioContent piece={piece} accentColor={accentColor} />
                  ) : (
                    <ArticleContent piece={piece} accentColor={accentColor} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.article>
  );
}

// ── Content type renderers ─────────────────────────────────────────────────

function ArticleContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  return <Questions piece={piece} accentColor={accentColor} />;
}

function PuzzleContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-3 text-sm" style={{ background: `${accentColor}12` }}>
        <p className="font-semibold text-xs uppercase tracking-wide mb-1" style={{ color: accentColor }}>Hint</p>
        <p style={{ color: "var(--pd-ink-muted)" }}>{piece.question1}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setRevealed((r) => !r); }}
        className="w-full py-2 rounded-xl text-sm font-bold transition-colors"
        style={{
          background: revealed ? `${accentColor}22` : accentColor,
          color: revealed ? accentColor : "#fff",
          border: `2px solid ${accentColor}`,
        }}
      >
        {revealed ? "Hide answer" : "Reveal answer"}
      </button>
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
          >
            <div className="rounded-xl p-3 text-sm" style={{ background: "#d1fae5" }}>
              <p className="font-semibold text-xs uppercase tracking-wide mb-1" style={{ color: "#065f46" }}>Answer</p>
              <p style={{ color: "#065f46" }}>{piece.question2}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>Discuss</p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>{piece.question3}</p>
      </div>
    </div>
  );
}

function BioContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {[
        { label: "Key fact",       content: piece.question1 },
        { label: "Why it matters", content: piece.question2 },
        { label: "Think about it", content: piece.question3 },
      ].map(({ label, content }, i) => (
        <div key={label} className="rounded-xl p-3" style={{ background: `${accentColor}${i === 2 ? "18" : "0e"}` }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: accentColor }}>{label}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>{content}</p>
        </div>
      ))}
    </div>
  );
}

function Questions({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  const labels = ["Recall", "Inference", "Discuss"];
  const questions = [piece.question1, piece.question2, piece.question3];
  return (
    <div className="space-y-3">
      {labels.map((label, i) => (
        <div key={label} className="flex gap-3">
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
            style={{ background: accentColor }}
          >
            {i + 1}
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: accentColor }}>{label}</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>{questions[i]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
