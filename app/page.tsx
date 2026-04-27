import Link from "next/link";

const bands = [
  {
    href: "/6-8",
    label: "Ages 6–8",
    emoji: "🌱",
    desc: "Short, vivid stories about animals, people and wonders. Read together and wonder out loud.",
    color: "var(--pd-68-accent)",
  },
  {
    href: "/9-12",
    label: "Ages 9–12",
    emoji: "🔭",
    desc: "Real events, how things work, fairness and cause and effect. Read, discuss, disagree.",
    color: "var(--pd-912-accent)",
  },
  {
    href: "/13-16",
    label: "Ages 13–16",
    emoji: "⚡",
    desc: "Genuine complexity, contested ideas, ethics and society. No easy answers — just real ones.",
    color: "var(--pd-1316-accent)",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full text-white font-black text-4xl mb-6 shadow-lg"
          style={{ background: "var(--pd-teal)" }}
        >
          ?
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "var(--pd-ink)" }}>
          Ponder something new,<br />
          <span style={{ color: "var(--pd-amber-dark)" }}>every day.</span>
        </h1>
        <p className="text-lg leading-relaxed mb-4" style={{ color: "var(--pd-ink-muted)" }}>
          A free daily reading space for curious kids aged 6–16. Fresh stories, ideas, and questions
          every day — chosen to spark real conversations between children and the people who care about them.
        </p>
        <p className="text-base font-semibold" style={{ color: "var(--pd-teal)" }}>
          No accounts &nbsp;·&nbsp; No tracking &nbsp;·&nbsp; No cost &nbsp;·&nbsp; No strings.
        </p>
      </section>

      {/* Band picker */}
      <section className="max-w-4xl mx-auto px-6 pb-16 grid sm:grid-cols-3 gap-6">
        {bands.map(({ href, label, emoji, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            style={{ background: "var(--pd-surface)", border: `2px solid ${color}44` }}
          >
            <div
              className="text-3xl mb-3 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22` }}
            >
              {emoji}
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color }}>
              {label}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink-muted)" }}>
              {desc}
            </p>
            <span
              className="inline-block mt-4 text-sm font-semibold group-hover:underline"
              style={{ color }}
            >
              Today&apos;s reading →
            </span>
          </Link>
        ))}
      </section>

      {/* How it works */}
      <section className="py-14 px-6" style={{ background: "var(--pd-bg-alt)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "var(--pd-ink)" }}>
            How Ponder Daily works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-left">
            {[
              {
                n: "1",
                title: "Read the piece",
                body: "A short, real story or idea — grounded in the world, chosen to be genuinely interesting.",
              },
              {
                n: "2",
                title: "Think about it",
                body: "Three questions: one to check you read it, one that needs thinking, one that has no right answer.",
              },
              {
                n: "3",
                title: "Talk it over",
                body: "No typing, no submissions. Close the screen and have the conversation. That's the whole point.",
              },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white mb-3"
                  style={{ background: "var(--pd-teal)" }}
                >
                  {n}
                </div>
                <h3 className="font-bold mb-1" style={{ color: "var(--pd-ink)" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--pd-ink-muted)" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding principles strip */}
      <section className="py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "var(--pd-ink-muted)" }}>
            What we believe
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium" style={{ color: "var(--pd-teal)" }}>
            <li>Free forever, no strings</li>
            <li>·</li>
            <li>No child data stored, ever</li>
            <li>·</li>
            <li>Human conversation beats in-app interaction</li>
            <li>·</li>
            <li>School is the floor, not the ceiling</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
