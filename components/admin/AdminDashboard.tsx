"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Piece = {
  id: string;
  ageBand: string;
  title: string;
  body: string;
  question1: string;
  question2: string;
  question3: string;
  topicCategory: string;
  status: string;
  evergreen: boolean;
  publishDate: string | null;
  createdAt: string;
};

const AGE_BANDS = ["6-8", "9-12", "13-16"] as const;
const TOPICS = ["science", "nature", "history", "technology", "culture", "human interest", "geography", "language"] as const;
const BAND_COLORS: Record<string, string> = {
  "6-8": "var(--pd-68-accent)",
  "9-12": "var(--pd-912-accent)",
  "13-16": "var(--pd-1316-accent)",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  approved: "#3b82f6",
  published: "#10b981",
};

function headers(secret: string) {
  return { "Content-Type": "application/json", "x-admin-secret": secret };
}

// ─── Login screen ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (s: string) => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState(false);

  const attempt = async () => {
    const res = await fetch("/api/admin/buffer", {
      headers: { "x-admin-secret": secret },
    });
    if (res.ok) { onLogin(secret); } else { setError(true); }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-24 text-center">
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-black text-3xl mb-6"
        style={{ background: "var(--pd-teal)" }}
      >?</div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--pd-ink)" }}>Admin</h1>
      <input
        type="password"
        placeholder="Admin secret"
        className="w-full border-2 rounded-xl px-4 py-3 mb-3 text-sm outline-none"
        style={{ borderColor: error ? "#ef4444" : "var(--pd-bg-alt)", background: "var(--pd-surface)" }}
        value={secret}
        onChange={(e) => { setSecret(e.target.value); setError(false); }}
        onKeyDown={(e) => e.key === "Enter" && attempt()}
      />
      {error && <p className="text-red-500 text-sm mb-3">Incorrect secret.</p>}
      <button onClick={attempt} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: "var(--pd-teal)" }}>
        Sign in
      </button>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [buffer, setBuffer] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Piece | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genBand, setGenBand] = useState("6-8");
  const [genTopic, setGenTopic] = useState("science");
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [publishBand, setPublishBand] = useState("6-8");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"pieces" | "library">("pieces");
  const [libraryBand, setLibraryBand] = useState("6-8");
  const [libraryPieces, setLibraryPieces] = useState<Piece[]>([]);
  const [libScheduleDate, setLibScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [libScheduleBand, setLibScheduleBand] = useState("6-8");
  const [libSelected, setLibSelected] = useState<Set<string>>(new Set());

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const fetchData = useCallback(async (s: string) => {
    const [pRes, bRes] = await Promise.all([
      fetch("/api/admin/pieces", { headers: { "x-admin-secret": s } }),
      fetch("/api/admin/buffer", { headers: { "x-admin-secret": s } }),
    ]);
    if (!pRes.ok) return false;
    const { pieces } = await pRes.json();
    const { buffer } = await bRes.json();
    setPieces(pieces);
    setBuffer(buffer);
    return true;
  }, []);

  const fetchLibrary = useCallback(async (s: string, band: string) => {
    const res = await fetch(`/api/admin/library?ageBand=${band}`, { headers: { "x-admin-secret": s } });
    if (!res.ok) return;
    const { pieces } = await res.json();
    setLibraryPieces(pieces);
  }, []);

  const handleLogin = async (s: string) => {
    setSecret(s);
    await fetchData(s);
    setAuthed(true);
  };

  const patchPiece = async (id: string, data: Partial<Piece>) => {
    await fetch(`/api/admin/pieces/${id}`, {
      method: "PATCH",
      headers: headers(secret),
      body: JSON.stringify(data),
    });
    await fetchData(secret);
  };

  const toggleEvergreen = async (piece: Piece) => {
    await patchPiece(piece.id, { evergreen: !piece.evergreen });
    flash(piece.evergreen ? "Removed from evergreen library." : "Added to evergreen library ♻️");
    if (activeTab === "library") fetchLibrary(secret, libraryBand);
  };

  const approve = async (id: string) => {
    await patchPiece(id, { status: "approved" });
    flash("Approved.");
  };

  const saveEdit = async () => {
    if (!editing) return;
    await patchPiece(editing.id, editing);
    setEditing(null);
    flash("Saved.");
  };

  const deletePiece = async (id: string) => {
    if (!confirm("Delete this piece?")) return;
    await fetch(`/api/admin/pieces/${id}`, { method: "DELETE", headers: headers(secret) });
    flash("Deleted.");
    await fetchData(secret);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: headers(secret),
        body: JSON.stringify({ ageBand: genBand, topicCategory: genTopic }),
      });
      if (!res.ok) {
        const err = await res.json();
        flash(err.error ?? "Generation failed", false);
      } else {
        flash("New piece generated — review it below.");
        await fetchData(secret);
      }
    } finally {
      setGenerating(false);
    }
  };

  const publishGrid = async (ids: string[], date: string, band: string, force = false) => {
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: headers(secret),
      body: JSON.stringify({ date, ageBand: band, pieceIds: ids, force }),
    });
    if (res.status === 409) {
      if (confirm(`A grid for ${band} on ${date} already exists. Replace it?`)) {
        return publishGrid(ids, date, band, true);
      }
      return;
    }
    if (res.ok) {
      flash(`Published ${ids.length} piece${ids.length !== 1 ? "s" : ""} for ${band} on ${date}`);
      setSelectedIds(new Set());
      setLibSelected(new Set());
      await fetchData(secret);
      if (activeTab === "library") fetchLibrary(secret, libraryBand);
    } else {
      const err = await res.json();
      flash(err.error ?? "Publish failed", false);
    }
  };

  const toggleSelect = (id: string, set: Set<string>, setter: (s: Set<string>) => void) => {
    const s = new Set(set);
    s.has(id) ? s.delete(id) : s.add(id);
    setter(s);
  };

  if (!authed) return <LoginScreen onLogin={handleLogin} />;

  const draftCount = pieces.filter((p) => p.status === "draft").length;
  const approvedCount = pieces.filter((p) => p.status === "approved").length;
  const evergreenCount = pieces.filter((p) => p.evergreen).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Flash */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 right-6 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg z-50"
            style={{ background: msg.ok ? "var(--pd-teal)" : "#dc2626" }}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--pd-ink)" }}>Admin Dashboard</h1>
        <button
          onClick={() => fetchData(secret)}
          className="text-sm px-3 py-1.5 rounded-full border font-medium"
          style={{ borderColor: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}
        >↻ Refresh</button>
      </div>

      {/* Buffer depth */}
      <div className="grid grid-cols-3 gap-4">
        {AGE_BANDS.map((band) => (
          <div key={band} className="rounded-2xl p-5 text-center"
            style={{ background: "var(--pd-surface)", border: `2px solid ${BAND_COLORS[band]}33` }}>
            <p className="text-3xl font-black" style={{ color: BAND_COLORS[band] }}>{buffer[band] ?? 0}</p>
            <p className="text-sm font-medium mt-1" style={{ color: "var(--pd-ink-muted)" }}>days ahead · {band}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="px-3 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>{draftCount} drafts</span>
        <span className="px-3 py-1 rounded-full font-semibold" style={{ background: "#dbeafe", color: "#1e40af" }}>{approvedCount} approved</span>
        <span className="px-3 py-1 rounded-full font-semibold" style={{ background: "#d1fae5", color: "#065f46" }}>♻️ {evergreenCount} evergreen</span>
      </div>

      {/* Generate */}
      <div className="rounded-2xl p-6" style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-bg-alt)" }}>
        <h2 className="font-bold mb-4" style={{ color: "var(--pd-ink)" }}>Generate new piece</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Age band</label>
            <select value={genBand} onChange={(e) => setGenBand(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}>
              {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Topic</label>
            <select value={genTopic} onChange={(e) => setGenTopic(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}>
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={generating}
            className="px-5 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: "var(--pd-teal)" }}>
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Publish panel */}
      <div className="rounded-2xl p-6" style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-bg-alt)" }}>
        <h2 className="font-bold mb-4" style={{ color: "var(--pd-ink)" }}>Publish daily grid</h2>
        <p className="text-xs mb-3" style={{ color: "var(--pd-ink-muted)" }}>
          Tick pieces in the list below, then set a date and band and publish. Evergreen pieces stay
          in the library after publishing so you can schedule them again.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Date</label>
            <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Age band</label>
            <select value={publishBand} onChange={(e) => setPublishBand(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}>
              {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <button
            onClick={() => publishGrid([...selectedIds], publishDate, publishBand)}
            className="px-5 py-2 rounded-xl font-bold text-sm"
            style={{ background: "var(--pd-amber)", color: "var(--pd-ink)" }}>
            Publish selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2" style={{ borderColor: "var(--pd-bg-alt)" }}>
        {(["pieces", "library"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "library") fetchLibrary(secret, libraryBand);
            }}
            className="px-4 py-2 text-sm font-semibold capitalize transition-colors"
            style={{
              color: activeTab === tab ? "var(--pd-teal)" : "var(--pd-ink-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--pd-teal)" : "2px solid transparent",
              marginBottom: "-2px",
            }}
          >
            {tab === "library" ? `♻️ Evergreen library` : `All pieces`}
          </button>
        ))}
      </div>

      {/* All pieces tab */}
      {activeTab === "pieces" && (
        <div className="space-y-3">
          {pieces.length === 0 && (
            <p className="text-sm" style={{ color: "var(--pd-ink-muted)" }}>No pieces yet. Generate one above.</p>
          )}
          {pieces.map((piece) => (
            <PieceRow
              key={piece.id}
              piece={piece}
              expanded={expanded === piece.id}
              editing={editing?.id === piece.id ? editing : null}
              selected={selectedIds.has(piece.id)}
              onToggleExpand={() => setExpanded(expanded === piece.id ? null : piece.id)}
              onToggleSelect={() => toggleSelect(piece.id, selectedIds, setSelectedIds)}
              onApprove={() => approve(piece.id)}
              onToggleEvergreen={() => toggleEvergreen(piece)}
              onEdit={() => setEditing({ ...piece })}
              onEditChange={(p) => setEditing(p)}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditing(null)}
              onDelete={() => deletePiece(piece.id)}
            />
          ))}
        </div>
      )}

      {/* Evergreen library tab */}
      {activeTab === "library" && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Filter by band</label>
              <select
                value={libraryBand}
                onChange={(e) => { setLibraryBand(e.target.value); fetchLibrary(secret, e.target.value); }}
                className="border-2 rounded-xl px-3 py-2 text-sm"
                style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}
              >
                {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Schedule from library */}
          <div className="rounded-2xl p-5" style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-bg-alt)" }}>
            <h3 className="font-bold mb-3 text-sm" style={{ color: "var(--pd-ink)" }}>Schedule selected evergreen pieces</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Date</label>
                <input type="date" value={libScheduleDate} onChange={(e) => setLibScheduleDate(e.target.value)}
                  className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Band</label>
                <select value={libScheduleBand} onChange={(e) => setLibScheduleBand(e.target.value)}
                  className="border-2 rounded-xl px-3 py-2 text-sm" style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}>
                  {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <button
                onClick={() => publishGrid([...libSelected], libScheduleDate, libScheduleBand)}
                className="px-5 py-2 rounded-xl font-bold text-sm"
                style={{ background: "var(--pd-amber)", color: "var(--pd-ink)" }}
              >
                Schedule ({libSelected.size})
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--pd-ink-muted)" }}>
              Evergreen pieces keep their library status after scheduling — they can be reused.
            </p>
          </div>

          {libraryPieces.length === 0 && (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--pd-surface)", border: "2px dashed var(--pd-bg-alt)" }}>
              <p className="text-2xl mb-2">♻️</p>
              <p className="font-semibold text-sm" style={{ color: "var(--pd-ink)" }}>No evergreen pieces for {libraryBand} yet.</p>
              <p className="text-xs mt-1" style={{ color: "var(--pd-ink-muted)" }}>
                Open any piece in the All Pieces tab and toggle the ♻️ Evergreen button to add it here.
              </p>
            </div>
          )}

          {libraryPieces.map((piece) => (
            <PieceRow
              key={piece.id}
              piece={piece}
              expanded={expanded === piece.id}
              editing={editing?.id === piece.id ? editing : null}
              selected={libSelected.has(piece.id)}
              onToggleExpand={() => setExpanded(expanded === piece.id ? null : piece.id)}
              onToggleSelect={() => toggleSelect(piece.id, libSelected, setLibSelected)}
              onApprove={() => approve(piece.id)}
              onToggleEvergreen={() => toggleEvergreen(piece)}
              onEdit={() => setEditing({ ...piece })}
              onEditChange={(p) => setEditing(p)}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditing(null)}
              onDelete={() => deletePiece(piece.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Piece row (shared between tabs) ─────────────────────────────────────────
function PieceRow({
  piece, expanded, editing, selected,
  onToggleExpand, onToggleSelect, onApprove, onToggleEvergreen,
  onEdit, onEditChange, onSaveEdit, onCancelEdit, onDelete,
}: {
  piece: Piece;
  expanded: boolean;
  editing: Piece | null;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onApprove: () => void;
  onToggleEvergreen: () => void;
  onEdit: () => void;
  onEditChange: (p: Piece) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const bandColor = BAND_COLORS[piece.ageBand] ?? "var(--pd-ink-muted)";

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: "var(--pd-surface)", border: `2px solid ${bandColor}22` }}>
      {/* Row header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggleExpand}>
        <input type="checkbox" checked={selected} onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()} className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${bandColor}22`, color: bandColor }}>{piece.ageBand}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: `${STATUS_COLORS[piece.status] ?? "#888"}22`, color: STATUS_COLORS[piece.status] ?? "#888" }}>
          {piece.status}
        </span>
        {piece.evergreen && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "#d1fae5", color: "#065f46" }}>♻️</span>
        )}
        <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--pd-ink)" }}>{piece.title}</span>
        <span className="text-xs hidden sm:block" style={{ color: "var(--pd-ink-muted)" }}>{piece.topicCategory}</span>
        <span className="text-xs" style={{ color: "var(--pd-ink-muted)" }}>
          {piece.publishDate ? new Date(piece.publishDate).toLocaleDateString() : new Date(piece.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4">
              <div className="h-px" style={{ background: "var(--pd-bg-alt)" }} />

              {editing ? (
                <div className="space-y-3">
                  {(["title", "body", "question1", "question2", "question3"] as const).map((field) => (
                    <div key={field}>
                      <label className="text-xs font-semibold block mb-1 capitalize"
                        style={{ color: "var(--pd-ink-muted)" }}>{field}</label>
                      <textarea rows={field === "body" ? 4 : 2} value={editing[field]}
                        onChange={(e) => onEditChange({ ...editing, [field]: e.target.value })}
                        className="w-full border-2 rounded-xl px-3 py-2 text-sm resize-y"
                        style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)", color: "var(--pd-ink)" }} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={onSaveEdit} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: "var(--pd-teal)" }}>Save</button>
                    <button onClick={onCancelEdit} className="px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <p style={{ color: "var(--pd-ink)" }}>{piece.body}</p>
                  <div className="space-y-2 pl-3 border-l-2" style={{ borderColor: bandColor }}>
                    <p><span className="font-semibold" style={{ color: bandColor }}>Q1 Recall:</span> {piece.question1}</p>
                    <p><span className="font-semibold" style={{ color: bandColor }}>Q2 Inference:</span> {piece.question2}</p>
                    <p><span className="font-semibold" style={{ color: bandColor }}>Q3 Discussion:</span> {piece.question3}</p>
                  </div>

                  {/* Review checklist */}
                  <div className="rounded-xl p-3 space-y-1" style={{ background: "var(--pd-bg-alt)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--pd-ink-muted)" }}>Review checklist</p>
                    {["Factually solid — core claim is Google-checkable",
                      "Age-appropriate tone",
                      "Q3 has no right answer — a reasonable adult could argue either side",
                      "No cultural specificity that alienates non-US/UK audiences",
                      "Nothing distressing for the age band",
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-xs cursor-pointer"
                        style={{ color: "var(--pd-ink-muted)" }}>
                        <input type="checkbox" className="w-3.5 h-3.5" />{item}
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {piece.status === "draft" && (
                      <button onClick={onApprove}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                        style={{ background: "#3b82f6" }}>✓ Approve</button>
                    )}
                    <button onClick={onToggleEvergreen}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                      style={{
                        background: piece.evergreen ? "#d1fae5" : "var(--pd-bg-alt)",
                        color: piece.evergreen ? "#065f46" : "var(--pd-ink-muted)",
                      }}>
                      ♻️ {piece.evergreen ? "Evergreen (on)" : "Mark evergreen"}
                    </button>
                    <button onClick={onEdit} className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink)" }}>✎ Edit</button>
                    <button onClick={onDelete}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-red-600"
                      style={{ background: "#fee2e2" }}>✕ Delete</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
