export const metadata = {
  title: "About Ponder Daily",
  description: "What Ponder Daily is, why it exists, and our privacy policy.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-3xl font-bold mb-8" style={{ color: "var(--pd-ink)" }}>
        About Ponder Daily
      </h1>

      <div className="prose prose-stone max-w-none space-y-6" style={{ color: "var(--pd-ink-muted)" }}>
        <p className="text-lg leading-relaxed" style={{ color: "var(--pd-ink)" }}>
          Ponder Daily is a free daily reading and discovery space for curious kids aged 6 to 16 — fresh
          stories, ideas, and questions every day, chosen to spark real conversations between children and
          the people who care about them.
        </p>

        <p>
          Each piece is written to be age-appropriate, genuinely interesting, and open-ended enough that
          there&apos;s no single right answer — just thinking, talking, and wondering together.
        </p>

        <p>
          The format is deliberately simple: read a short piece, consider three questions, then close the
          screen and talk. No typing required. No right answers submitted. No gold stars. The whole point
          is the conversation that happens away from the screen.
        </p>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--pd-ink)" }}>
          The problem we&apos;re solving
        </h2>
        <p>
          Schools are deprioritising foundational skills — times tables, phonics, grammar, science, social
          studies — in favour of test prep and social-emotional learning programmes. Parents who are
          engaged want supplementary resources but most available tools are rote, gamified, or data-hungry.
        </p>
        <p>
          Ponder Daily targets engaged parents and children who want to fill educational gaps. Teachers
          and classrooms are welcome too.
        </p>
        <blockquote
          className="border-l-4 pl-4 italic"
          style={{ borderColor: "var(--pd-teal)", color: "var(--pd-ink)" }}
        >
          School is the floor, not the ceiling.
        </blockquote>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--pd-ink)" }}>
          Privacy — our actual policy
        </h2>

        <div
          className="rounded-2xl p-6 space-y-3"
          style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-teal)" }}
        >
          <p className="font-bold text-base" style={{ color: "var(--pd-teal)" }}>
            The short version: we store nothing about you or your child.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "No user accounts — ever",
              "No stored responses of any kind",
              "No personal data collected",
              "No cookies beyond an optional age-band preference saved to your own browser",
              "No analytics that track individuals",
              "GDPR and COPPA compliant by architecture — there is simply nothing to comply about",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span style={{ color: "var(--pd-teal)" }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p>
          This is a trust signal we lead with, not bury in a footer. Built by one parent who noticed a
          gap and decided to fill it.
        </p>
      </div>
    </div>
  );
}
