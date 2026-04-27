export const metadata = {
  title: "Palette Extractor — Ponder Daily",
};

import PaletteExtractor from "@/components/PaletteExtractor";

export default function PalettePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--pd-ink)" }}>
        Palette Extractor
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--pd-ink-muted)" }}>
        Drop in a still — a Ghibli frame, a painting, anything with good colour — and get a 60/30/10
        palette suggestion pulled from the most dominant colours.
      </p>
      <PaletteExtractor />
    </div>
  );
}
