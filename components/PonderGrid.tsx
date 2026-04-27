"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type ContentPiece = {
  id: string;
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
  topicCategory: string;
};

type Props = {
  pieces: ContentPiece[];
  accentColor: string;
};

const TOPIC_EMOJI: Record<string, string> = {
  nature: "🌿",
  science: "🔬",
  history: "📜",
  technology: "💡",
  culture: "🎭",
  "human interest": "🤝",
  geography: "🌍",
  language: "📖",
};

// Card sizes for a varied grid layout
const CARD_SIZES = [
  "sm:col-span-2",    // wide
  "sm:col-span-1",    // normal
  "sm:col-span-1",    // normal
];

export default function PonderGrid({ pieces, accentColor }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      className="grid sm:grid-cols-3 gap-5"
      layout
    >
      <AnimatePresence mode="popLayout">
        {pieces.map((piece, i) => {
          const isExpanded = expanded === piece.id;
          const emoji = TOPIC_EMOJI[piece.topicCategory] ?? "💭";

          return (
            <motion.article
              key={piece.id}
              layout
              layoutId={piece.id}
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: -16 }}
              transition={{
                layout: { type: "spring", stiffness: 260, damping: 28 },
                opacity: { duration: 0.25 },
                delay: i * 0.07,
              }}
              className={`rounded-2xl overflow-hidden cursor-pointer group ${
                isExpanded ? "sm:col-span-3" : CARD_SIZES[i % CARD_SIZES.length]
              }`}
              style={{
                background: "var(--pd-surface)",
                border: `2px solid ${accentColor}33`,
                boxShadow: isExpanded ? `0 8px 32px ${accentColor}22` : "0 2px 8px rgba(0,0,0,0.06)",
              }}
              onClick={() => setExpanded(isExpanded ? null : piece.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setExpanded(isExpanded ? null : piece.id)}
              aria-expanded={isExpanded}
            >
              {/* Card header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accentColor}18` }}
                  >
                    {emoji}
                  </span>
                  <motion.span
                    animate={{ rotate: isExpanded ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="text-2xl font-black leading-none flex-shrink-0 mt-0.5"
                    style={{ color: accentColor }}
                  >
                    +
                  </motion.span>
                </div>

                <h2
                  className="font-bold text-base sm:text-lg leading-snug mb-2"
                  style={{ color: "var(--pd-ink)" }}
                >
                  {piece.title}
                </h2>

                <p
                  className="text-sm leading-relaxed line-clamp-3"
                  style={{ color: "var(--pd-ink-muted)" }}
                >
                  {piece.body}
                </p>
              </div>

              {/* Expanded content: full body + questions */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-6">
                      {/* Divider */}
                      <div
                        className="h-px mb-5"
                        style={{ background: `${accentColor}33` }}
                      />

                      {/* Full body */}
                      <p
                        className="text-sm sm:text-base leading-relaxed mb-6"
                        style={{ color: "var(--pd-ink)" }}
                      >
                        {piece.body}
                      </p>

                      {/* Questions */}
                      <div className="space-y-4">
                        {[
                          { label: "Recall", q: piece.question1 },
                          { label: "Inference", q: piece.question2 },
                          { label: "Discussion", q: piece.question3 },
                        ].map(({ label, q }, qi) => (
                          <motion.div
                            key={label}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + qi * 0.07 }}
                            className="flex gap-3"
                          >
                            <span
                              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                              style={{ background: accentColor }}
                            >
                              {qi + 1}
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: accentColor }}>
                                {label}
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink)" }}>
                                {q}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <p
                        className="mt-6 text-xs italic"
                        style={{ color: "var(--pd-ink-muted)" }}
                      >
                        Talk about it — no need to type anything. That&apos;s the whole point.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
