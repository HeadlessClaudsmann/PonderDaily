"use client";

import { useState, useEffect, useCallback } from "react";
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
  publishDate: string | null;
  createdAt: string;
};

type BufferData = { buffer: Record<string, number> };

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

export default function AdminDashboard() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [buffer, setBuffer] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Piece | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genBand, setGenBand] = useState<string>("6-8");
  const [genTopic, setGenTopic] = useState<string>("science");
  const [publishDate, setPublishDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [publishBand, setPublishBand] = useState<string>("6-8");
  const [msg, setMsg] = useState<string | null>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchData = useCallback(async (s: string) => {
    const [pRes, bRes] = await Promise.all([
      fetch("/api/admin/pieces", { headers: headers(s) }),
      fetch("/api/admin/buffer", { headers: headers(s) }),
    ]);
    if (!pRes.ok) return false;
    const { pieces } = await pRes.json();
    const { buffer } = (await bRes.json()) as BufferData;
    setPieces(pieces);
    setBuffer(buffer);
    return true;
  }, []);

  const login = async () => {
    const ok = await fetchData(secret);
    if (ok) {
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: headers(secret),
        body: JSON.stringify({ ageBand: genBand, topicCategory: genTopic }),
      });
      if (!res.ok) throw new Error("Generation failed");
      flash("New piece generated — review it in the draft list.");
      await fetchData(secret);
    } finally {
      setGenerating(false);
    }
  };

  const approve = async (id: string) => {
    await fetch(`/api/admin/pieces/${id}`, {
      method: "PATCH",
      headers: headers(secret),
      body: JSON.stringify({ status: "approved" }),
    });
    flash("Approved.");
    await fetchData(secret);
  };

  const deletePiece = async (id: string) => {
    if (!confirm("Delete this piece?")) return;
    await fetch(`/api/admin/pieces/${id}`, {
      method: "DELETE",
      headers: headers(secret),
    });
    flash("Deleted.");
    await fetchData(secret);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await fetch(`/api/admin/pieces/${editing.id}`, {
      method: "PATCH",
      headers: headers(secret),
      body: JSON.stringify(editing),
    });
    setEditing(null);
    flash("Saved.");
    await fetchData(secret);
  };

  const publishGrid = async () => {
    if (selectedIds.size === 0) return flash("Select at least one piece first.");
    const res = await fetch("/api/admin/publish", {
      method: "POST",
      headers: headers(secret),
      body: JSON.stringify({ date: publishDate, ageBand: publishBand, pieceIds: [...selectedIds] }),
    });
    if (res.ok) {
      flash(`Published ${selectedIds.size} pieces for ${publishBand} on ${publishDate}`);
      setSelectedIds(new Set());
      await fetchData(secret);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white font-black text-3xl mb-6"
          style={{ background: "var(--pd-teal)" }}
        >
          ?
        </div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--pd-ink)" }}>Admin</h1>
        <input
          type="password"
          placeholder="Admin secret"
          className="w-full border-2 rounded-xl px-4 py-3 mb-3 text-sm outline-none"
          style={{ borderColor: authError ? "#ef4444" : "var(--pd-bg-alt)", background: "var(--pd-surface)" }}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        {authError && <p className="text-red-500 text-sm mb-3">Incorrect secret.</p>}
        <button
          onClick={login}
          className="w-full py-3 rounded-xl font-bold text-white"
          style={{ background: "var(--pd-teal)" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  const draftCount = pieces.filter((p) => p.status === "draft").length;
  const approvedCount = pieces.filter((p) => p.status === "approved").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Flash message */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-6 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-lg z-50"
            style={{ background: "var(--pd-teal)" }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "var(--pd-ink)" }}>Admin Dashboard</h1>
        <button
          onClick={() => fetchData(secret)}
          className="text-sm px-3 py-1.5 rounded-full border font-medium"
          style={{ borderColor: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Buffer depth */}
      <div className="grid grid-cols-3 gap-4">
        {AGE_BANDS.map((band) => (
          <div
            key={band}
            className="rounded-2xl p-5 text-center"
            style={{ background: "var(--pd-surface)", border: `2px solid ${BAND_COLORS[band]}33` }}
          >
            <p className="text-3xl font-black" style={{ color: BAND_COLORS[band] }}>
              {buffer[band] ?? 0}
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: "var(--pd-ink-muted)" }}>
              days ahead · {band}
            </p>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>
          {draftCount} drafts
        </span>
        <span className="px-3 py-1 rounded-full font-semibold" style={{ background: "#dbeafe", color: "#1e40af" }}>
          {approvedCount} approved
        </span>
      </div>

      {/* Generate new piece */}
      <div className="rounded-2xl p-6" style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-bg-alt)" }}>
        <h2 className="font-bold mb-4" style={{ color: "var(--pd-ink)" }}>Generate new piece</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Age band</label>
            <select
              value={genBand}
              onChange={(e) => setGenBand(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}
            >
              {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Topic</label>
            <select
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}
            >
              {TOPICS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="px-5 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: "var(--pd-teal)" }}
          >
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Publish grid */}
      <div className="rounded-2xl p-6" style={{ background: "var(--pd-surface)", border: "2px solid var(--pd-bg-alt)" }}>
        <h2 className="font-bold mb-4" style={{ color: "var(--pd-ink)" }}>Publish daily grid</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Date</label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "var(--pd-ink-muted)" }}>Age band</label>
            <select
              value={publishBand}
              onChange={(e) => setPublishBand(e.target.value)}
              className="border-2 rounded-xl px-3 py-2 text-sm"
              style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)" }}
            >
              {AGE_BANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <button
            onClick={publishGrid}
            className="px-5 py-2 rounded-xl font-bold text-sm"
            style={{ background: "var(--pd-amber)", color: "var(--pd-ink)" }}
          >
            Publish selected ({selectedIds.size})
          </button>
        </div>
        {selectedIds.size > 0 && (
          <p className="text-xs mt-2" style={{ color: "var(--pd-ink-muted)" }}>
            {selectedIds.size} piece{selectedIds.size !== 1 ? "s" : ""} selected — tick pieces in the list below.
          </p>
        )}
      </div>

      {/* Piece list */}
      <div className="space-y-3">
        <h2 className="font-bold" style={{ color: "var(--pd-ink)" }}>All pieces</h2>
        {pieces.length === 0 && (
          <p className="text-sm" style={{ color: "var(--pd-ink-muted)" }}>No pieces yet. Generate one above.</p>
        )}
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            layout
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--pd-surface)",
              border: `2px solid ${BAND_COLORS[piece.ageBand] ?? "var(--pd-bg-alt)"}22`,
            }}
          >
            {/* Row header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpanded(expanded === piece.id ? null : piece.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(piece.id)}
                onChange={() => toggleSelect(piece.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 flex-shrink-0"
              />
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${BAND_COLORS[piece.ageBand]}22`, color: BAND_COLORS[piece.ageBand] }}
              >
                {piece.ageBand}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${STATUS_COLORS[piece.status]}22`, color: STATUS_COLORS[piece.status] }}
              >
                {piece.status}
              </span>
              <span className="text-sm font-semibold flex-1 truncate" style={{ color: "var(--pd-ink)" }}>
                {piece.title}
              </span>
              <span className="text-xs" style={{ color: "var(--pd-ink-muted)" }}>
                {piece.topicCategory}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--pd-ink-muted)" }}>
                {new Date(piece.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {expanded === piece.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    <div
                      className="h-px"
                      style={{ background: "var(--pd-bg-alt)" }}
                    />

                    {editing?.id === piece.id ? (
                      // Edit form
                      <div className="space-y-3">
                        {(["title", "body", "question1", "question2", "question3"] as const).map((field) => (
                          <div key={field}>
                            <label className="text-xs font-semibold block mb-1 capitalize" style={{ color: "var(--pd-ink-muted)" }}>
                              {field}
                            </label>
                            <textarea
                              rows={field === "body" ? 4 : 2}
                              value={editing[field]}
                              onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                              className="w-full border-2 rounded-xl px-3 py-2 text-sm resize-y"
                              style={{ borderColor: "var(--pd-bg-alt)", background: "var(--pd-bg)", color: "var(--pd-ink)" }}
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                            style={{ background: "var(--pd-teal)" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink-muted)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Read view
                      <div className="space-y-3 text-sm">
                        <p style={{ color: "var(--pd-ink)" }}>{piece.body}</p>
                        <div className="space-y-2 pl-3 border-l-2" style={{ borderColor: BAND_COLORS[piece.ageBand] }}>
                          <p><span className="font-semibold" style={{ color: BAND_COLORS[piece.ageBand] }}>Q1 Recall:</span> {piece.question1}</p>
                          <p><span className="font-semibold" style={{ color: BAND_COLORS[piece.ageBand] }}>Q2 Inference:</span> {piece.question2}</p>
                          <p><span className="font-semibold" style={{ color: BAND_COLORS[piece.ageBand] }}>Q3 Discussion:</span> {piece.question3}</p>
                        </div>

                        {/* Review checklist */}
                        <div className="rounded-xl p-3 space-y-1" style={{ background: "var(--pd-bg-alt)" }}>
                          <p className="text-xs font-bold mb-2" style={{ color: "var(--pd-ink-muted)" }}>Review checklist</p>
                          {[
                            "Factually solid — core claim is Google-checkable",
                            "Age-appropriate tone",
                            "Q3 has no right answer — a reasonable adult could argue either side",
                            "No cultural specificity that alienates non-US/UK audiences",
                            "Nothing distressing for the age band",
                          ].map((item) => (
                            <label key={item} className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--pd-ink-muted)" }}>
                              <input type="checkbox" className="w-3.5 h-3.5" />
                              {item}
                            </label>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {piece.status === "draft" && (
                            <button
                              onClick={() => approve(piece.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                              style={{ background: "#3b82f6" }}
                            >
                              ✓ Approve
                            </button>
                          )}
                          <button
                            onClick={() => setEditing({ ...piece })}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium"
                            style={{ background: "var(--pd-bg-alt)", color: "var(--pd-ink)" }}
                          >
                            ✎ Edit
                          </button>
                          <button
                            onClick={() => deletePiece(piece.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium text-red-600"
                            style={{ background: "#fee2e2" }}
                          >
                            ✕ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
