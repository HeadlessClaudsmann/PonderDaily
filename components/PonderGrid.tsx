"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export type ContentPiece = {
  id: string;
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
  topicCategory: string;
  contentType?: string;
};

type Props = {
  pieces: ContentPiece[];
  accentColor: string;
};

// ── Metadata maps ──────────────────────────────────────────────────────────

const TOPIC_EMOJI: Record<string, string> = {
  nature: "🌿",
  science: "🔬",
  history: "📜",
  technology: "💡",
  culture: "🎭",
  "human interest": "🤝",
  geography: "🌍",
  language: "📖",
  mathematics: "🔢",
  biography: "🧠",
  philosophy: "⚖️",
};

const TYPE_META: Record<string, { badge: string; color: string }> = {
  article:       { badge: "Read",    color: "" },
  puzzle:        { badge: "Puzzle",  color: "#f59e0b" },
  bio:           { badge: "Thinker", color: "#8b5cf6" },
  fact:          { badge: "Fact",    color: "#0ea5e9" },
  illustration:  { badge: "Explore", color: "#10b981" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]*[.!?]/);
  return m ? m[0] : text.slice(0, 100);
}

// Varied grid sizes — first card wide, rest normal
const CARD_SPAN = ["sm:col-span-2", "sm:col-span-1", "sm:col-span-1"];

// Spring config: low damping = visible bounce; mass=0.6 makes it snappier
const CARD_SPRING = { type: "spring" as const, stiffness: 380, damping: 18, mass: 0.6 };

// ── Main grid ──────────────────────────────────────────────────────────────

export default function PonderGrid({ pieces, accentColor }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  return (
    <motion.div className="grid sm:grid-cols-3 gap-4" layout>
      <AnimatePresence mode="popLayout">
        {pieces.map((piece, i) => {
          const isExpanded = expanded === piece.id;
          const type = piece.contentType ?? "article";

          return (
            <PonderCard
              key={piece.id}
              piece={piece}
              index={i}
              isExpanded={isExpanded}
              accentColor={accentColor}
              type={type}
              spanClass={isExpanded ? "sm:col-span-3" : CARD_SPAN[i % CARD_SPAN.length]}
              onToggle={() => toggle(piece.id)}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Individual card ────────────────────────────────────────────────────────

function PonderCard({
  piece, index, isExpanded, accentColor, type, spanClass, onToggle,
}: {
  piece: ContentPiece;
  index: number;
  isExpanded: boolean;
  accentColor: string;
  type: string;
  spanClass: string;
  onToggle: () => void;
}) {
  const emoji = TOPIC_EMOJI[piece.topicCategory] ?? "💭";
  const typeMeta = TYPE_META[type] ?? TYPE_META.article;
  const teaser = firstSentence(piece.body);

  return (
    <motion.article
      layout
      layoutId={piece.id}
      initial={{ opacity: 0, scale: 0.88, y: 28 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        // Squash on land → stretch up → settle: gives a "plop into place" feel
        scaleY: [0.88, 1.06, 0.97, 1.02, 1],
        scaleX: [1.04, 0.97, 1.01, 0.99, 1],
      }}
      exit={{ opacity: 0, scale: 0.88, y: -20 }}
      transition={{
        layout: CARD_SPRING,
        opacity: { duration: 0.2 },
        scale: { ...CARD_SPRING },
        scaleY: { duration: 0.55, times: [0, 0.2, 0.45, 0.7, 1], ease: "easeOut" },
        scaleX: { duration: 0.55, times: [0, 0.2, 0.45, 0.7, 1], ease: "easeOut" },
        delay: index * 0.06,
      }}
      className={`rounded-2xl overflow-hidden cursor-pointer ${spanClass}`}
      style={{
        background: "var(--pd-surface)",
        border: `2px solid ${accentColor}33`,
        boxShadow: isExpanded
          ? `0 10px 36px ${accentColor}28`
          : "0 2px 8px rgba(0,0,0,0.05)",
        transformOrigin: "bottom center",
      }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onToggle()}
      aria-expanded={isExpanded}
    >
      {/* ── Collapsed header — always visible ── */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Left: emoji badge + type tag */}
          <div className="flex items-center gap-2">
            <span
              className="text-lg w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${accentColor}18` }}
            >
              {emoji}
            </span>
            {type !== "article" && typeMeta.color && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${typeMeta.color}22`, color: typeMeta.color }}
              >
                {typeMeta.badge}
              </span>
            )}
          </div>

          {/* Right: animated + → × */}
          <motion.span
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
            className="text-xl font-black leading-none flex-shrink-0"
            style={{ color: accentColor }}
          >
            +
          </motion.span>
        </div>

        <h2
          className="font-bold text-sm sm:text-base leading-snug mb-1"
          style={{ color: "var(--pd-ink)" }}
        >
          {piece.title}
        </h2>

        <p className="text-xs leading-relaxed" style={{ color: "var(--pd-ink-muted)" }}>
          {teaser}
        </p>
      </div>

      {/* ── Expanded body — only when open ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: "auto",
              transition: {
                height: { ...CARD_SPRING, stiffness: 300, damping: 24 },
                opacity: { duration: 0.2, delay: 0.08 },
              },
            }}
            exit={{
              opacity: 0,
              height: 0,
              transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">
              <div className="h-px mb-4" style={{ background: `${accentColor}33` }} />

              {/* Type-specific content */}
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
    </motion.article>
  );
}

// ── Content type renderers ──────────────────────────────────────────────────

function ArticleContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
        {piece.body}
      </p>
      <Questions piece={piece} accentColor={accentColor} />
      <p className="text-xs italic" style={{ color: "var(--pd-ink-muted)" }}>
        Talk about it — no typing needed. That&apos;s the whole point.
      </p>
    </div>
  );
}

function PuzzleContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
        {piece.body}
      </p>

      {/* Q1 = hint, Q2 = solution, Q3 = discussion */}
      <div
        className="rounded-xl p-3 text-sm"
        style={{ background: `${accentColor}12` }}
      >
        <p className="font-semibold text-xs uppercase tracking-wide mb-1" style={{ color: accentColor }}>
          Hint
        </p>
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl p-3 text-sm" style={{ background: "#d1fae5" }}>
              <p className="font-semibold text-xs uppercase tracking-wide mb-1" style={{ color: "#065f46" }}>
                Answer
              </p>
              <p style={{ color: "#065f46" }}>{piece.question2}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-1">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: accentColor }}>
          Discuss
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
          {piece.question3}
        </p>
      </div>
    </div>
  );
}

function BioContent({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
        {piece.body}
      </p>

      <div className="grid grid-cols-1 gap-3">
        {[
          { label: "Key fact", content: piece.question1 },
          { label: "Why it matters", content: piece.question2 },
          { label: "Think about it", content: piece.question3 },
        ].map(({ label, content }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="rounded-xl p-3"
            style={{ background: `${accentColor}${i === 2 ? "18" : "0e"}` }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: accentColor }}>
              {label}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
              {content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Questions({ piece, accentColor }: { piece: ContentPiece; accentColor: string }) {
  const labels = ["Recall", "Inference", "Discuss"];
  const questions = [piece.question1, piece.question2, piece.question3];

  return (
    <div className="space-y-3">
      {labels.map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.07 }}
          className="flex gap-3"
        >
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
            style={{ background: accentColor }}
          >
            {i + 1}
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold mb-0.5" style={{ color: accentColor }}>
              {label}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
              {questions[i]}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
