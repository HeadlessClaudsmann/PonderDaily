import Link from "next/link";
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

type Props = {
  ageBand: string;
  label: string;
  tagline: string;
  accentColor: string;
  pieces: ContentPiece[];
  date?: Date;
};

function fmt(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function BandPage({ ageBand, label, tagline, accentColor, pieces, date }: Props) {
  const displayDate = date ?? new Date();
  const isToday = isoDate(displayDate) === isoDate(new Date());

  const prevDate = isoDate(addDays(displayDate, -1));
  const nextDate = isoDate(addDays(displayDate, 1));
  const todayDate = isoDate(new Date());
  const isFuture = displayDate > new Date();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Band header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ background: accentColor }} />
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            {label}
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--pd-ink)" }}>
          {isToday ? "Today's Ponders" : "Archive"}
        </h1>
        <p className="text-base" style={{ color: "var(--pd-ink-muted)" }}>
          {tagline}
        </p>

        {/* Date navigator */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <Link
            href={`/${ageBand}/${prevDate}`}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80"
            style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}
          >
            ← {fmt(addDays(displayDate, -1)).split(",")[0]}
          </Link>

          <span className="text-sm font-semibold" style={{ color: "var(--pd-ink)" }}>
            {fmt(displayDate)}
          </span>

          {!isToday && (
            <Link
              href={isFuture ? `/${ageBand}/${nextDate}` : `/${ageBand}/${nextDate}`}
              className="px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80"
              style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}
            >
              {fmt(addDays(displayDate, 1)).split(",")[0]} →
            </Link>
          )}

          {!isToday && (
            <Link
              href={`/${ageBand}`}
              className="px-3 py-1 rounded-full text-sm font-semibold transition-colors hover:opacity-80"
              style={{ background: `${accentColor}22`, color: accentColor }}
            >
              Back to today
            </Link>
          )}

          {isToday && (
            <Link
              href={`/${ageBand}/${todayDate}`}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ color: "var(--pd-ink-muted)" }}
            >
              Browse archive →
            </Link>
          )}
        </div>
      </div>

      {pieces.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--pd-surface)", border: "2px dashed var(--pd-bg-alt)" }}
        >
          <p className="text-2xl mb-2">⏳</p>
          <p className="font-semibold" style={{ color: "var(--pd-ink)" }}>
            {isToday ? "Today's content is being prepared." : "No content found for this date."}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
            {isToday
              ? "Check back shortly — or try a different age band while you wait."
              : "Try a neighbouring date, or go back to today."}
          </p>
        </div>
      ) : (
        <PonderGrid pieces={pieces} accentColor={accentColor} />
      )}

      <p className="mt-10 text-xs text-center" style={{ color: "var(--pd-ink-muted)" }}>
        Tap any card to read the full piece and see the questions. Talk about it — no typing required.
      </p>
    </div>
  );
}
