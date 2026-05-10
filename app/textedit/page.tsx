"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Piece       = { type: string; title: string; body: string };
type BandContent = Record<string, Piece>;
type Band        = "6-8" | "9-12" | "13-16";
type DayContent  = { theme: string; brief?: string } & Record<Band, BandContent>;

type PromptEntry = {
  cellId: string; type: string; purpose: string; factual: boolean;
  bands: Record<Band, string>;
};

// ── Dark theme tokens ─────────────────────────────────────────────────────────
const DK = {
  bg:      "#0f0f1a",
  surface: "#16162a",
  ink:     "#e0dcd4",
  muted:   "#8888a0",
  b0:      "rgba(255,255,255,0.07)",   // very subtle dividers
  b1:      "rgba(255,255,255,0.12)",   // standard borders
  b2:      "rgba(255,255,255,0.22)",   // strong borders / inputs
};

const BANDS: { id: Band; label: string; colour: string }[] = [
  { id: "6-8",   label: "Ages 6–8",   colour: "#f194ff" },
  { id: "9-12",  label: "Ages 9–12",  colour: "#4CAF50" },
  { id: "13-16", label: "Ages 13–16", colour: "#8b5dee" },
];

const SECTION_ORDER = [
  "aduz9fn","ojb605w","f3wmmk0","rrdnkqh","48bcse3",
  "88o5166","t6ezhxo","k1p4g3j","h16qorg","yecwf32",
  "z9wswia","7u91gy3","48t59tz","inm067g","b9akthy",
];

function today() { return new Date().toISOString().slice(0, 10); }

function formatDisplayDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function blankContent(theme = ""): DayContent {
  const blankBand = (): BandContent =>
    Object.fromEntries(SECTION_ORDER.map(id => [id, { type: "", title: "", body: "" }]));
  return { theme, "6-8": blankBand(), "9-12": blankBand(), "13-16": blankBand() };
}

// ── Auto-resizing textarea ────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea ref={ref} value={value} placeholder={placeholder} rows={1}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", resize: "none", overflow: "hidden", border: "none",
        outline: "none", background: "transparent", fontFamily: "inherit",
        fontSize: "inherit", color: "inherit", lineHeight: 1.6, padding: 0, ...style }}
    />
  );
}

// ── Save button ───────────────────────────────────────────────────────────────
type SaveState = "idle" | "saving" | "saved" | "error";
function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  const cfg = {
    idle:   { label: "Save",          border: DK.b2,      bg: "transparent", color: DK.ink },
    saving: { label: "Saving…",       border: DK.b1,      bg: "transparent", color: DK.muted },
    saved:  { label: "Saved ✓",       border: "#2a7a6e",  bg: "#2a7a6e",     color: "#fff" },
    error:  { label: "Error — retry", border: "#c0392b",  bg: "transparent", color: "#c0392b" },
  }[state];
  return (
    <button onClick={onClick} disabled={state === "saving"} style={{
      padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      border: `1.5px solid ${cfg.border}`, background: cfg.bg, color: cfg.color,
      cursor: state === "saving" ? "default" : "pointer", transition: "all 0.2s",
      fontFamily: "system-ui, sans-serif",
    }}>{cfg.label}</button>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────
function PieceCard({ id, piece, accent, prompt, onUpdate }: {
  id: string; piece: Piece; accent: string;
  prompt?: PromptEntry;
  onUpdate: (field: keyof Piece, value: string) => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <div style={{ background: DK.surface, borderRadius: 8,
      border: `1px solid ${DK.b0}`, borderLeft: `3px solid ${accent}`,
      padding: "11px 13px", display: "flex", flexDirection: "column", gap: 8 }}>

      {/* Top row: type badge + cell id + prompt toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input value={piece.type} onChange={e => onUpdate("type", e.target.value)}
          placeholder="TYPE BADGE"
          style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase", background: DK.b0,
            borderRadius: 3, padding: "2px 6px", border: "none", outline: "none",
            color: DK.ink, fontFamily: "inherit", width: 150 }}
        />
        <div style={{ flex: 1 }} />
        {prompt && (
          <button onClick={() => setShowPrompt(p => !p)} title="Show prompt guidance"
            style={{ fontSize: 10, background: "none", border: "none", cursor: "pointer",
              color: showPrompt ? accent : DK.muted, padding: "0 2px",
              fontWeight: 700, letterSpacing: "0.04em" }}>
            {showPrompt ? "▾ prompt" : "▸ prompt"}
          </button>
        )}
        <code style={{ fontSize: 10, color: DK.muted, opacity: 0.4 }}>{id}</code>
      </div>

      {/* Inline prompt guidance */}
      {showPrompt && prompt && (
        <div style={{ background: DK.b0, borderRadius: 5,
          padding: "8px 10px", fontSize: 11, lineHeight: 1.55,
          color: DK.muted, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: DK.ink }}>{prompt.purpose}</div>
          <div style={{ opacity: 0.8, fontStyle: "italic" }}>
            {BANDS.find(b => b.colour === accent)
              ? prompt.bands[BANDS.find(b => b.colour === accent)!.id]
              : ""}
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ borderBottom: `1px solid ${DK.b0}`, paddingBottom: 8 }}>
        <AutoTextarea value={piece.title} onChange={v => onUpdate("title", v)}
          placeholder="Title…"
          style={{ fontSize: 14.5, fontFamily: "Georgia, serif", fontWeight: 700, color: DK.ink }} />
      </div>

      {/* Body */}
      <div>
        <AutoTextarea value={piece.body} onChange={v => onUpdate("body", v)}
          placeholder="Body text…"
          style={{ fontSize: 13, whiteSpace: "pre-line", color: DK.ink }} />
      </div>
    </div>
  );
}

// ── Band section ──────────────────────────────────────────────────────────────
function BandSection({ band, content, prompts, onUpdate }: {
  band: typeof BANDS[number]; content: BandContent;
  prompts: PromptEntry[];
  onUpdate: (id: string, field: keyof Piece, value: string) => void;
}) {
  const promptMap = Object.fromEntries(prompts.map(p => [p.cellId, p]));
  const entries = SECTION_ORDER
    .filter(id => content[id])
    .map(id => [id, content[id]] as [string, Piece]);

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 12px" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%",
          background: band.colour, flexShrink: 0, display: "inline-block" }} />
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase", color: band.colour }}>{band.label}</span>
        <div style={{ flex: 1, height: 1, background: DK.b0 }} />
        <span style={{ fontSize: 11, color: DK.muted, opacity: 0.6 }}>
          {entries.length} pieces
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {entries.map(([id, piece]) => (
          <PieceCard key={id} id={id} piece={piece} accent={band.colour}
            prompt={promptMap[id]}
            onUpdate={(f, v) => onUpdate(id, f, v)} />
        ))}
      </div>
    </section>
  );
}

// ── New day setup form ────────────────────────────────────────────────────────
// First section ID used as preview headline in variant picker
const PREVIEW_CELL = "aduz9fn";

function NewDayForm({ date, onCreated }: {
  date: string;
  onCreated: (content: DayContent, save?: boolean) => void;
}) {
  const [theme, setTheme]             = useState("");
  const [brief, setBrief]             = useState("");
  const [variants, setVariants]       = useState(1);
  const [busy, setBusy]               = useState(false);
  const [genError, setGenError]       = useState("");
  const [generated, setGenerated]     = useState<DayContent[]>([]);
  const [variantIdx, setVariantIdx]   = useState(0);

  async function create() {
    setBusy(true);
    const base = blankContent(theme);
    await fetch(`/api/content?date=${date}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(base),
    });
    onCreated(base, false);
    setBusy(false);
  }

  async function generate() {
    if (!theme.trim()) return;
    setBusy(true);
    setGenError("");
    setGenerated([]);
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, brief: brief || undefined, variants }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        setGenError(err.error ?? "Generation failed");
        return;
      }
      const results: DayContent[] = await res.json();
      if (results.length === 1) {
        onCreated(results[0], false);
      } else {
        setGenerated(results);
        setVariantIdx(0);
      }
    } catch (e) {
      setGenError(String(e));
    } finally {
      setBusy(false);
    }
  }

  // ── Variant picker (shown after multi-variant generation) ─────────────────
  if (generated.length > 0) {
    const v = generated[variantIdx];
    const preview = v["13-16"]?.[PREVIEW_CELL];
    return (
      <div style={{ maxWidth: 520, margin: "48px auto 0", padding: "32px",
        background: DK.surface, borderRadius: 12, border: `1px solid ${DK.b1}` }}>

        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
          marginBottom: 4, color: DK.muted, fontFamily: "system-ui, sans-serif" }}>
          Pick a variant · {theme}
        </div>
        <div style={{ fontSize: 11, color: DK.muted, marginBottom: 20,
          fontFamily: "system-ui, sans-serif" }}>
          Preview shows the opening story from the 13–16 band
        </div>

        {/* Variant tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {generated.map((_, i) => (
            <button key={i} onClick={() => setVariantIdx(i)} style={{
              padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${i === variantIdx ? DK.ink : DK.b1}`,
              background: i === variantIdx ? DK.ink : "transparent",
              color: i === variantIdx ? DK.bg : DK.muted,
              cursor: "pointer", fontFamily: "system-ui, sans-serif",
            }}>
              {i + 1}
            </button>
          ))}
          <span style={{ alignSelf: "center", fontSize: 11, color: DK.muted,
            fontFamily: "system-ui, sans-serif", marginLeft: 4 }}>
            of {generated.length}
          </span>
        </div>

        {/* Preview card */}
        {preview && (
          <div style={{ background: DK.b0, borderRadius: 8, padding: "14px 16px",
            marginBottom: 20, borderLeft: `3px solid #8b5dee` }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em",
              textTransform: "uppercase", color: DK.muted,
              fontFamily: "system-ui, sans-serif", marginBottom: 6 }}>
              {preview.type}
            </div>
            <div style={{ fontSize: 15, fontFamily: "Georgia, serif",
              fontWeight: 700, color: DK.ink, marginBottom: 6, lineHeight: 1.3 }}>
              {preview.title}
            </div>
            <div style={{ fontSize: 12, color: DK.muted, lineHeight: 1.55,
              fontFamily: "system-ui, sans-serif",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
              overflow: "hidden" }}>
              {preview.body}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setGenerated([])}
            style={{ padding: "9px 16px", borderRadius: 8, fontSize: 12,
              fontWeight: 700, border: `1px solid ${DK.b1}`, background: "transparent",
              color: DK.muted, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
            ← Back
          </button>
          <button onClick={() => onCreated(generated[variantIdx], false)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13,
              fontWeight: 700, border: "none", background: DK.ink,
              color: DK.bg, cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
            Use variant {variantIdx + 1} →
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 520, margin: "48px auto 0", padding: "32px",
      background: DK.surface, borderRadius: 12, border: `1px solid ${DK.b1}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
        marginBottom: 20, color: DK.muted, fontFamily: "system-ui, sans-serif" }}>
        New content · {formatDisplayDate(date)}
      </div>

      {/* Theme */}
      <label style={{ display: "block", fontSize: 9, fontWeight: 800,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: DK.muted, marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>Theme</label>
      <input value={theme} onChange={e => setTheme(e.target.value)}
        placeholder="e.g. The Rainforest"
        autoFocus
        onKeyDown={e => { if (e.key === "Enter" && theme) create(); }}
        style={{ width: "100%", fontSize: 18, fontFamily: "Georgia, serif",
          fontWeight: 700, border: "none", outline: "none", background: "transparent",
          color: DK.ink, padding: "4px 0", marginBottom: 18,
          borderBottom: `2px solid ${DK.b1}` }}
      />

      {/* Brief */}
      <label style={{ display: "block", fontSize: 9, fontWeight: 800,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: DK.muted, marginBottom: 6, fontFamily: "system-ui, sans-serif" }}>
        Additional context <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
      </label>
      <textarea value={brief} onChange={e => setBrief(e.target.value)}
        placeholder="e.g. Include Marie Curie. Focus on current news angle."
        rows={2}
        style={{ width: "100%", fontSize: 12, fontFamily: "system-ui, sans-serif",
          border: `1px solid ${DK.b1}`, borderRadius: 6,
          background: "transparent", color: DK.ink, padding: "6px 8px",
          marginBottom: 24, resize: "vertical", boxSizing: "border-box",
          lineHeight: 1.55 }}
      />

      {/* Variants */}
      <label style={{ display: "block", fontSize: 9, fontWeight: 800,
        letterSpacing: "0.08em", textTransform: "uppercase",
        color: DK.muted, marginBottom: 8, fontFamily: "system-ui, sans-serif" }}>Variants to generate</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setVariants(n)} style={{
            width: 34, height: 34, borderRadius: 6, fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${n === variants ? DK.ink : DK.b1}`,
            background: n === variants ? DK.ink : "transparent",
            color: n === variants ? DK.bg : DK.muted, cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
          }}>{n}</button>
        ))}
        <span style={{ alignSelf: "center", fontSize: 11, color: DK.muted,
          marginLeft: 6, fontFamily: "system-ui, sans-serif" }}>
          {variants === 1 ? "single draft" : `${variants} to choose from`}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={create} disabled={!theme || busy}
          style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13,
            fontWeight: 700, border: "none", cursor: (theme && !busy) ? "pointer" : "default",
            background: theme ? DK.ink : DK.b0,
            color: theme ? DK.bg : DK.muted, transition: "all 0.15s",
            fontFamily: "system-ui, sans-serif" }}>
          {busy ? "Working…" : "Create blank"}
        </button>
        <button onClick={generate} disabled={!theme || busy}
          style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13,
            fontWeight: 700,
            border: `1.5px solid ${theme && !busy ? DK.b2 : DK.b0}`,
            background: "transparent",
            color: theme && !busy ? DK.ink : DK.muted,
            cursor: (theme && !busy) ? "pointer" : "default",
            transition: "all 0.15s", fontFamily: "system-ui, sans-serif" }}>
          {busy ? "Generating…" : "✦ Generate"}
        </button>
      </div>
      {genError && (
        <p style={{ marginTop: 10, fontSize: 11, color: "#e05050", fontFamily: "system-ui" }}>
          {genError}
        </p>
      )}
    </div>
  );
}

// ── Full-page prompts editor ──────────────────────────────────────────────────
function PromptsEditor({ prompts, onSave, onDiscard }: {
  prompts: PromptEntry[];
  onSave:    (p: PromptEntry[]) => void;
  onDiscard: () => void;
}) {
  const [draft,  setDraft]  = useState<PromptEntry[]>(() => JSON.parse(JSON.stringify(prompts)));
  const [saving, setSaving] = useState(false);

  const patchEntry = (idx: number, patch: Partial<PromptEntry>) =>
    setDraft(d => d.map((e, i) => i === idx ? { ...e, ...patch } : e));

  const patchBand = (idx: number, band: Band, val: string) =>
    setDraft(d => d.map((e, i) => i === idx
      ? { ...e, bands: { ...e.bands, [band]: val } }
      : e));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) onSave(draft);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: DK.bg, minHeight: "100dvh",
      fontFamily: "Georgia, 'Times New Roman', serif", color: DK.ink }}>

      {/* ── Top bar ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: DK.bg,
        borderBottom: `1px solid ${DK.b1}`,
        padding: "9px 24px", display: "flex", alignItems: "center", gap: 12 }}>

        <button onClick={onDiscard}
          style={{ background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: DK.muted, padding: "2px 0",
            display: "flex", alignItems: "center", gap: 5 }}>
          ← <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11 }}>Content Editor</span>
        </button>

        <div style={{ width: 1, height: 16, background: DK.b1 }} />

        <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>
          Section Prompts
        </span>

        <div style={{ flex: 1 }} />

        <button onClick={onDiscard}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            background: "none", border: `1px solid ${DK.b1}`, borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", color: DK.muted,
            fontFamily: "system-ui, sans-serif" }}>
          Discard
        </button>

        <button onClick={handleSave} disabled={saving}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            background: DK.ink, color: DK.bg,
            border: "none", borderRadius: 6,
            padding: "5px 14px", cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1,
            fontFamily: "system-ui, sans-serif" }}>
          {saving ? "Saving…" : "Save prompts"}
        </button>
      </div>

      {/* ── Prompt cards ── */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 24px 80px",
        display: "flex", flexDirection: "column", gap: 20 }}>
        {draft.map((p, idx) => (
          <div key={p.cellId} style={{ background: DK.surface, borderRadius: 10,
            border: `1px solid ${DK.b1}`, padding: "18px 20px" }}>

            {/* Header: type badge + factual checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.07em",
                textTransform: "uppercase", background: DK.b0,
                borderRadius: 3, padding: "2px 6px",
                fontFamily: "system-ui, sans-serif", color: DK.ink }}>{p.type}</span>
              <label style={{ display: "flex", alignItems: "center", gap: 5,
                cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>
                <input type="checkbox" checked={p.factual}
                  onChange={e => patchEntry(idx, { factual: e.target.checked })} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                  textTransform: "uppercase", color: "#4CAF50" }}>fact-check</span>
              </label>
            </div>

            {/* Purpose */}
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", color: DK.muted,
              fontFamily: "system-ui, sans-serif", marginBottom: 5 }}>
              Purpose &amp; generation guidance
            </div>
            <AutoTextarea
              value={p.purpose}
              onChange={v => patchEntry(idx, { purpose: v })}
              placeholder="What should this section do? How should it be written?"
              style={{ width: "100%", marginBottom: 16, padding: "8px 10px",
                fontSize: 13, lineHeight: 1.6, fontFamily: "system-ui, sans-serif",
                border: `1px solid ${DK.b1}`, borderRadius: 6,
                background: DK.b0, color: DK.ink,
                resize: "none", boxSizing: "border-box" }}
            />

            {/* Per-band tone */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {BANDS.map(b => (
                <div key={b.id}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em",
                    textTransform: "uppercase", color: b.colour,
                    fontFamily: "system-ui, sans-serif", marginBottom: 5 }}>
                    {b.label}
                  </div>
                  <AutoTextarea
                    value={p.bands[b.id]}
                    onChange={v => patchBand(idx, b.id, v)}
                    placeholder={`Tone for ${b.label}…`}
                    style={{ width: "100%", padding: "6px 8px",
                      fontSize: 11, lineHeight: 1.55, fontFamily: "system-ui, sans-serif",
                      border: `1px solid ${DK.b0}`, borderRadius: 5,
                      background: DK.b0, color: DK.muted,
                      resize: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Duplicate-from dropdown ───────────────────────────────────────────────────
function DuplicateDropdown({ currentDate, dates, onDuplicate, onClose }: {
  currentDate: string; dates: string[];
  onDuplicate: (from: string) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const others = dates.filter(d => d !== currentDate);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
      <div style={{ position: "absolute", top: "100%", right: 0, zIndex: 40, marginTop: 6,
        background: DK.surface, borderRadius: 8,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        border: `1px solid ${DK.b1}`, minWidth: 220, overflow: "hidden" }}>

        {others.length === 0 ? (
          <div style={{ padding: "10px 14px", fontSize: 12, color: DK.muted,
            fontFamily: "system-ui, sans-serif" }}>
            No other dates yet
          </div>
        ) : others.map(d => (
          <div key={d} style={{ borderBottom: `1px solid ${DK.b0}` }}>
            {pending === d ? (
              <div style={{ padding: "8px 12px", background: "rgba(232,160,48,0.12)",
                display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, flex: 1, color: DK.ink, fontFamily: "system-ui" }}>
                  Overwrite with {d}?
                </span>
                <button onClick={() => { onDuplicate(d); onClose(); }}
                  style={{ fontSize: 11, fontWeight: 700, background: DK.ink,
                    color: DK.bg, border: "none", borderRadius: 4, padding: "3px 8px",
                    cursor: "pointer", fontFamily: "system-ui" }}>
                  Yes
                </button>
                <button onClick={() => setPending(null)}
                  style={{ fontSize: 11, background: "none", border: "none",
                    color: DK.muted, cursor: "pointer", padding: "3px 4px" }}>
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => setPending(d)}
                style={{ display: "block", width: "100%", textAlign: "left",
                  padding: "8px 14px", fontSize: 12, background: "none", border: "none",
                  cursor: "pointer", color: DK.ink, fontFamily: "inherit" }}>
                {d}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function TextEditPage() {
  const [date, setDate]               = useState(today);
  const [content, setContent]         = useState<DayContent | null>(null);
  const [missing, setMissing]         = useState(false);
  const [existingDates, setDates]     = useState<string[]>([]);
  const [prompts, setPrompts]         = useState<PromptEntry[]>([]);
  const [saveState, setSaveState]     = useState<SaveState>("idle");
  const [view, setView]               = useState<"content" | "prompts">("content");
  const [showDupMenu, setShowDupMenu] = useState(false);
  const [rerollState, setRerollState] = useState<"idle" | "armed" | "running" | "error">("idle");
  const rerollTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load date list, prompts, and gd-sync bg colour once ───────────────────
  useEffect(() => {
    fetch("/api/content/list").then(r => r.json()).then(setDates).catch(() => {});
    fetch("/api/prompts").then(r => r.json()).then(setPrompts).catch(() => {});
  }, []);

  // ── Load content when date changes ────────────────────────────────────────
  useEffect(() => {
    setContent(null); setMissing(false);
    fetch(`/api/content?date=${date}`, { cache: "no-store" })
      .then(r => { if (r.status === 404) { setMissing(true); return null; } return r.json(); })
      .then(d => { if (d) setContent(d); })
      .catch(() => setMissing(true));
  }, [date]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!content || saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/content?date=${date}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) {
        setTimeout(() => setSaveState("idle"), 2200);
        if (!existingDates.includes(date))
          setDates(prev => [...prev, date].sort().reverse());
      }
    } catch { setSaveState("error"); }
  }, [content, date, saveState, existingDates]);

  // ── Cmd+S ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  // ── Field update ──────────────────────────────────────────────────────────
  const update = useCallback((band: Band, id: string, field: keyof Piece, value: string) => {
    setContent(prev => {
      if (!prev) return prev;
      return { ...prev, [band]: { ...prev[band], [id]: { ...prev[band][id], [field]: value } } };
    });
    setSaveState("idle");
  }, []);

  // ── Duplicate from another date — always overwrites, auto-saves ──────────
  const duplicateFrom = useCallback(async (fromDate: string) => {
    const res = await fetch(`/api/content?date=${fromDate}`, { cache: "no-store" });
    if (!res.ok) return;
    const source: DayContent = await res.json();
    setContent(source);
    setMissing(false);
    setSaveState("saving");
    try {
      const saveRes = await fetch(`/api/content?date=${date}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
      });
      setSaveState(saveRes.ok ? "saved" : "error");
      if (saveRes.ok) {
        if (!existingDates.includes(date))
          setDates(prev => [...prev, date].sort().reverse());
        setTimeout(() => setSaveState("idle"), 2200);
      }
    } catch { setSaveState("error"); }
  }, [date, existingDates]);

  // ── Re-roll all content from current theme + brief ────────────────────────
  const armReroll = useCallback(() => {
    if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
    setRerollState("armed");
    rerollTimerRef.current = setTimeout(() => setRerollState("idle"), 4000);
  }, []);

  const rerollAll = useCallback(async () => {
    if (!content) return;
    if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
    setRerollState("running");
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: content.theme, brief: content.brief, variants: 1 }),
      });
      if (!res.ok) { setRerollState("error"); return; }
      const [generated]: DayContent[] = await res.json();
      setContent(generated);
      setSaveState("idle");
      setRerollState("idle");
    } catch { setRerollState("error"); }
  }, [content]);

  // ── Prompts view ─────────────────────────────────────────────────────────
  if (view === "prompts") {
    return (
      <PromptsEditor
        prompts={prompts}
        onSave={p => { setPrompts(p); setView("content"); }}
        onDiscard={() => setView("content")}
      />
    );
  }

  return (
    <div style={{ background: DK.bg, minHeight: "100dvh",
      fontFamily: "Georgia, 'Times New Roman', serif", color: DK.ink }}>

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: DK.bg,
        borderBottom: `1px solid ${DK.b1}`,
        padding: "9px 24px", display: "flex", alignItems: "center", gap: 12 }}>

        <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em", flexShrink: 0 }}>
          Content Editor
        </span>

        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ fontSize: 12, color: DK.muted, background: "transparent",
            border: "none", outline: "none", fontFamily: "inherit", cursor: "pointer",
            colorScheme: "dark" }} />

        <div style={{ flex: 1 }} />

        {/* Prompts button */}
        <button onClick={() => setView("prompts")}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            background: "none", border: `1px solid ${DK.b1}`, borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", color: DK.muted,
            fontFamily: "system-ui, sans-serif" }}>
          Prompts ›
        </button>

        {/* Duplicate from */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowDupMenu(p => !p)}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              background: "none", border: `1px solid ${DK.b1}`, borderRadius: 6,
              padding: "4px 10px", cursor: "pointer", color: DK.muted,
              fontFamily: "system-ui, sans-serif" }}>
            Copy from ›
          </button>
          {showDupMenu && (
            <DuplicateDropdown currentDate={date} dates={existingDates}
              onDuplicate={duplicateFrom} onClose={() => setShowDupMenu(false)} />
          )}
        </div>

        <a href="/test3" target="_blank" style={{ fontSize: 11, color: DK.muted,
          textDecoration: "none", opacity: 0.7, fontFamily: "system-ui, sans-serif" }}>
          ↗ preview
        </a>

        {/* Re-roll — only shown when there's loaded content */}
        {content && (
          <button
            onClick={rerollState === "idle" ? armReroll : rerollState === "armed" ? rerollAll : undefined}
            disabled={rerollState === "running"}
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
              borderRadius: 6, padding: "4px 10px",
              cursor: rerollState === "running" ? "default" : "pointer",
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.15s",
              ...(rerollState === "armed"
                ? { background: "rgba(232,160,48,0.15)", border: "1px solid rgba(232,160,48,0.5)", color: "#e8a030" }
                : rerollState === "running"
                ? { background: "none", border: `1px solid ${DK.b0}`, color: DK.muted, opacity: 0.6 }
                : rerollState === "error"
                ? { background: "none", border: "1px solid rgba(180,40,40,0.5)", color: "#e05050" }
                : { background: "none", border: `1px solid ${DK.b1}`, color: DK.muted }
              ),
            }}>
            {rerollState === "running" ? "Re-rolling…"
              : rerollState === "armed"   ? "Confirm re-roll?"
              : rerollState === "error"   ? "✦ Re-roll (retry)"
              : "✦ Re-roll"}
          </button>
        )}

        <SaveButton state={saveState} onClick={save} />
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 60px" }}>

        {/* New day form */}
        {missing && (
          <NewDayForm date={date}
            onCreated={c => { setContent(c); setMissing(false); }} />
        )}

        {/* Loading */}
        {!content && !missing && (
          <div style={{ padding: "40px 0", color: DK.muted, fontSize: 14,
            fontFamily: "system-ui, sans-serif" }}>
            Loading…
          </div>
        )}

        {content && (
          <>
            {/* ── Global theme + brief ──────────────────────────────── */}
            <div style={{ marginTop: 28,
              background: DK.surface, borderRadius: 10,
              border: `1px solid ${DK.b1}`, padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 12 }}>

              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", color: DK.muted,
                fontFamily: "system-ui, sans-serif" }}>
                Theme — global across all age bands
              </label>
              <input value={content.theme}
                onChange={e => { setContent(p => p ? { ...p, theme: e.target.value } : p); setSaveState("idle"); }}
                placeholder="e.g. The Deep Ocean"
                style={{ fontSize: 22, fontFamily: "Georgia, serif", fontWeight: 900,
                  border: "none", outline: "none", background: "transparent",
                  color: DK.ink, width: "100%", padding: "4px 0",
                  borderBottom: `2px solid ${DK.b1}` }}
              />

              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", color: DK.muted, marginTop: 4,
                fontFamily: "system-ui, sans-serif" }}>
                Generation brief — extra context for re-roll (optional)
              </label>
              <textarea
                value={content.brief ?? ""}
                onChange={e => { setContent(p => p ? { ...p, brief: e.target.value } : p); setSaveState("idle"); }}
                placeholder="e.g. Make sure to include Sylvia Earle. Mention the Trieste by name in On This Day. Avoid references to plastic pollution (covered last week)."
                rows={2}
                style={{ fontSize: 12, fontFamily: "system-ui, sans-serif",
                  border: "none", outline: "none", background: "transparent",
                  color: DK.ink, width: "100%", resize: "vertical",
                  lineHeight: 1.6 }}
              />
            </div>

            {/* ── Three band sections ───────────────────────────────── */}
            {BANDS.map(band => (
              <BandSection key={band.id} band={band}
                content={content[band.id]} prompts={prompts}
                onUpdate={(id, field, value) => update(band.id, id, field, value)} />
            ))}
          </>
        )}
      </div>

    </div>
  );
}
