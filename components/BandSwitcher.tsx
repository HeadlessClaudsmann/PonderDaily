"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PonderGrid from "./PonderGrid";

type ContentPiece = {
  id: string;
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
  topicCategory: string;
};

type Band = "6-8" | "9-12" | "13-16";

const BAND_META: Record<Band, { label: string; tagline: string; accent: string; emoji: string }> = {
  "6-8": {
    label: "Ages 6–8",
    tagline: "Short, vivid stories to read together and wonder about.",
    accent: "var(--pd-68-accent)",
    emoji: "🌱",
  },
  "9-12": {
    label: "Ages 9–12",
    tagline: "Real events, how things work, and questions worth arguing about.",
    accent: "var(--pd-912-accent)",
    emoji: "🔭",
  },
  "13-16": {
    label: "Ages 13–16",
    tagline: "Genuine complexity, contested ideas, and no easy answers.",
    accent: "var(--pd-1316-accent)",
    emoji: "⚡",
  },
};

function parseBand(pathname: string): Band | null {
  if (pathname.startsWith("/6-8")) return "6-8";
  if (pathname.startsWith("/9-12")) return "9-12";
  if (pathname.startsWith("/13-16")) return "13-16";
  return null;
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

type Props = {
  initialBand: Band;
  initialPieces: ContentPiece[];
};

export default function BandSwitcher({ initialBand, initialPieces }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeBand, setActiveBand] = useState<Band>(initialBand);
  const [pieces, setPieces] = useState<ContentPiece[]>(initialPieces);
  const [loading, setLoading] = useState(false);
  // direction: 1 = moving right (older→younger), -1 = moving left (younger→older)
  const [direction, setDirection] = useState(0);
  const cache = useRef<Partial<Record<Band, ContentPiece[]>>>({
    [initialBand]: initialPieces,
  });

  // Stay in sync if user navigates via back/forward
  useEffect(() => {
    const band = parseBand(pathname);
    if (band && band !== activeBand) {
      switchBand(band, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const switchBand = useCallback(async (band: Band, pushRoute = true) => {
    if (band === activeBand) return;

    const order: Band[] = ["6-8", "9-12", "13-16"];
    const dir = order.indexOf(band) > order.indexOf(activeBand) ? 1 : -1;
    setDirection(dir);

    if (pushRoute) router.push(`/${band}`);

    // Use cache if available
    if (cache.current[band]) {
      setActiveBand(band);
      setPieces(cache.current[band]!);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/grid/${band}`);
      const data = await res.json();
      cache.current[band] = data.pieces;
      setActiveBand(band);
      setPieces(data.pieces);
    } finally {
      setLoading(false);
    }
  }, [activeBand, router]);

  const meta = BAND_META[activeBand];

  const variants = {
    enter: (dir: number) => ({
      x: dir * 60,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 280, damping: 28 },
    },
    exit: (dir: number) => ({
      x: dir * -60,
      opacity: 0,
      scale: 0.97,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
    }),
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Inline band picker tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(["6-8", "9-12", "13-16"] as Band[]).map((band) => {
          const m = BAND_META[band];
          const active = band === activeBand;
          return (
            <motion.button
              key={band}
              onClick={() => switchBand(band)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
              style={{
                background: active ? m.accent : "var(--pd-surface)",
                color: active ? "#fff" : "var(--pd-ink-muted)",
                border: `2px solid ${active ? m.accent : "var(--pd-bg-alt)"}`,
              }}
              aria-current={active ? "page" : undefined}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Animated header */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`header-${activeBand}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25, delay: 0.05 } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: meta.accent }}
              layoutId="band-dot"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: meta.accent }}>
              {meta.label}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "var(--pd-ink)" }}>
            Today&apos;s Ponders
          </h1>
          <p className="text-base" style={{ color: "var(--pd-ink-muted)" }}>
            {meta.tagline}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
            {fmt(new Date())}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Animated grid */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={activeBand}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {loading ? (
            <GridSkeleton accent={meta.accent} />
          ) : pieces.length === 0 ? (
            <EmptyState isToday />
          ) : (
            <PonderGrid pieces={pieces} accentColor={meta.accent} />
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-10 text-xs text-center" style={{ color: "var(--pd-ink-muted)" }}>
        Tap any card to read the full piece and see the questions. Talk about it — no typing required.
      </p>
    </div>
  );
}

// Skeleton cards shown while fetching
function GridSkeleton({ accent }: { accent: string }) {
  return (
    <div className="grid sm:grid-cols-3 gap-5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
          className="rounded-2xl h-52"
          style={{ background: `${accent}18`, border: `2px solid ${accent}22` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ isToday }: { isToday: boolean }) {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ background: "var(--pd-surface)", border: "2px dashed var(--pd-bg-alt)" }}
    >
      <p className="text-2xl mb-2">⏳</p>
      <p className="font-semibold" style={{ color: "var(--pd-ink)" }}>
        {isToday ? "Today's content is being prepared." : "No content for this date."}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
        Check back shortly — or try a different age band.
      </p>
    </div>
  );
}
