"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PaletteResult = {
  palette: string[];
  suggestion: { dominant: string; mid: string; highlight: string };
};

function hexToCSS(h: string) {
  return h;
}

function contrastColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "#1a1a1a" : "#ffffff";
}

export default function PaletteExtractor() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res = await fetch("/api/palette", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const cssBlock = result
    ? `:root {
  /* 60% dominant */
  --pd-bg: ${result.suggestion.dominant};
  /* 30% mid */
  --pd-amber: ${result.suggestion.mid};
  /* 10% highlight */
  --pd-teal: ${result.suggestion.highlight};
}`
    : "";

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors hover:border-opacity-80"
        style={{ borderColor: "var(--pd-amber)", background: "var(--pd-surface)" }}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="max-h-48 mx-auto rounded-xl object-cover shadow"
          />
        ) : (
          <>
            <p className="text-4xl mb-3">🎨</p>
            <p className="font-semibold" style={{ color: "var(--pd-ink)" }}>
              Drop an image here, or click to browse
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--pd-ink-muted)" }}>
              Works great with Ghibli stills, paintings, photographs
            </p>
          </>
        )}
      </div>

      {loading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm font-medium"
          style={{ color: "var(--pd-ink-muted)" }}
        >
          Extracting colours…
        </motion.p>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Full palette swatches */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--pd-ink-muted)" }}>
                Extracted palette
              </p>
              <div className="flex gap-2 flex-wrap">
                {result.palette.map((hex) => (
                  <motion.button
                    key={hex}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copy(hex)}
                    className="w-12 h-12 rounded-xl shadow-sm flex items-end justify-center pb-1 text-xs font-mono font-bold transition-shadow hover:shadow-md"
                    style={{ background: hex, color: contrastColor(hex) }}
                    title={`Copy ${hex}`}
                  >
                    {copied === hex ? "✓" : ""}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 60/30/10 suggestion */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--pd-ink-muted)" }}>
                60 / 30 / 10 suggestion
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { label: "60% — Dominant", hex: result.suggestion.dominant },
                    { label: "30% — Mid", hex: result.suggestion.mid },
                    { label: "10% — Highlight", hex: result.suggestion.highlight },
                  ] as const
                ).map(({ label, hex }) => (
                  <button
                    key={label}
                    onClick={() => copy(hex)}
                    className="rounded-xl p-3 text-left transition-transform hover:scale-105 active:scale-95"
                    style={{ background: hex }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color: contrastColor(hex) }}>
                      {label}
                    </p>
                    <p className="font-mono text-sm font-bold" style={{ color: contrastColor(hex) }}>
                      {copied === hex ? "Copied!" : hex}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* CSS output */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--pd-ink-muted)" }}>
                  CSS variables
                </p>
                <button
                  onClick={() => copy(cssBlock)}
                  className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                  style={{
                    background: "var(--pd-teal)",
                    color: "#fff",
                  }}
                >
                  {copied === cssBlock ? "Copied!" : "Copy CSS"}
                </button>
              </div>
              <pre
                className="text-xs p-4 rounded-xl overflow-x-auto"
                style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink)", fontFamily: "monospace" }}
              >
                {cssBlock}
              </pre>
            </div>

            <p className="text-xs" style={{ color: "var(--pd-ink-muted)" }}>
              Paste the CSS block into <code>globals.css</code> to apply the palette site-wide.
              Adjust the 30% and 10% colours manually for accessibility as needed.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
