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
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function BandPage({ label, tagline, accentColor, pieces }: Props) {
  const today = formatDate(new Date());

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Band header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: accentColor }}
          />
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
            {label}
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--pd-ink)" }}>
          Today&apos;s Ponders
        </h1>
        <p className="text-base" style={{ color: "var(--pd-ink-muted)" }}>
          {tagline}
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
          {today}
        </p>
      </div>

      {pieces.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--pd-surface)", border: "2px dashed var(--pd-bg-alt)" }}
        >
          <p className="text-2xl mb-2">⏳</p>
          <p className="font-semibold" style={{ color: "var(--pd-ink)" }}>
            Today&apos;s content is being prepared.
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
            Check back shortly — or try a different age band while you wait.
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
