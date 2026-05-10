"use client";

import { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GCell = {
  id: string;
  num?: number;        // stable display number – set once at creation
  colStart: number;
  colSpan:  number;
  rowStart: number;
  rowSpan:  number;
  color:    string;
  label:    string;
  /** In preview mode, clicking this cell switches to the snapshot at this index */
  triggersSnapshot?: number;
};

export type GSnapshot = {
  id:    string;
  label: string;
  cells: GCell[];
};

export type GLayout = {
  id:        string;
  name:      string;
  cols:      number;
  rows:      number;
  snapshots: GSnapshot[];
  /** ISO date "YYYY-MM-DD" — marks this as a date-specific editable copy, not a template */
  dateKey?:  string;
};

type Store = {
  layouts: GLayout[];
  todayId: string | null;
  palette: string[];   // 7 editable slots
  bgColor?: string;    // canvas / page background
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────

const STORE_KEY = "ponder-grid-designer";

function loadStore(): Store {
  const defaults: Store = { layouts: [], todayId: null, palette: [...DEFAULT_PALETTE], bgColor: "#181824" };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      return { ...defaults, ...parsed, palette: parsed.palette ?? [...DEFAULT_PALETTE] };
    }
  } catch {}
  // First run — seed with sample layouts
  const seeded: Store = { ...defaults, layouts: createSampleLayouts() };
  return seeded;
}

function saveStore(store: Store) {
  const json = JSON.stringify(store);
  localStorage.setItem(STORE_KEY, json);
  // Sync to lib/gd-store.json so Claude can read it directly (dev only)
  fetch("/api/gd-sync", { method: "POST", body: json }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function cellAtPos(col: number, row: number, cells: GCell[]): GCell | undefined {
  return cells.find(c =>
    col >= c.colStart && col < c.colStart + c.colSpan &&
    row >= c.rowStart && row < c.rowStart + c.rowSpan
  );
}

function makeLayout(name: string): GLayout {
  return {
    id:   uid(),
    name,
    cols: 12,
    rows: 9,
    snapshots: [{
      id:    uid(),
      label: "Base",
      cells: [],
    }],
  };
}

function cloneSnapshot(snap: GSnapshot, label: string): GSnapshot {
  return {
    id:    uid(),
    label,
    cells: snap.cells.map(c => ({ ...c })),   // same ids → FLIP matches them
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample layouts — pre-seeded when the store is empty
// ─────────────────────────────────────────────────────────────────────────────

function createSampleLayouts(): GLayout[] {
  const P = DEFAULT_PALETTE;  // [amber, orange, sky, violet, teal, cream, navy]

  // helper: make a cell with a fixed id prefix so the same cell appears in every snapshot
  const c = (
    id: string, num: number,
    cs: number, csp: number, rs: number, rsp: number,
    color: string, label = ""
  ): GCell => ({ id, num, colStart:cs, colSpan:csp, rowStart:rs, rowSpan:rsp, color, label });

  // ── Layout 1: "Mondrian A"  ──────────────────────────────────────────────
  // 8 cells, Base + two Expand states
  const a_ids = Array.from({length:8}, (_,i) => `ma-${i+1}`);

  const ma_base: GCell[] = [
    c(a_ids[0], 1,  1,5, 1,4, P[0], "hero"),    // amber  — big top-left
    c(a_ids[1], 2,  6,4, 1,2, P[1], "char A"),  // orange
    c(a_ids[2], 3, 10,3, 1,2, P[2], "char B"),  // sky
    c(a_ids[3], 4,  6,4, 3,2, P[3], "extra"),   // violet
    c(a_ids[4], 5, 10,3, 3,2, P[4], "extra"),   // teal
    c(a_ids[5], 6,  1,4, 5,5, P[5]),             // cream content
    c(a_ids[6], 7,  5,4, 5,5, P[5]),
    c(a_ids[7], 8,  9,4, 5,5, P[5]),
  ];

  // Cell 6 expands to dominate left 7 cols
  const ma_expand6: GCell[] = [
    c(a_ids[0], 1,  8,5, 1,2, P[0], "hero"),
    c(a_ids[1], 2,  8,3, 3,2, P[1], "char A"),
    c(a_ids[2], 3, 11,2, 3,2, P[2], "char B"),
    c(a_ids[3], 4,  8,5, 5,2, P[3], "extra"),
    c(a_ids[4], 5,  8,5, 7,1, P[4], "extra"),
    c(a_ids[5], 6,  1,7, 1,9, P[5]),            // DOMINANT
    c(a_ids[6], 7,  8,3, 8,2, P[5]),
    c(a_ids[7], 8, 11,2, 8,2, P[5]),
  ];

  // Cell 8 expands to dominate right 7 cols
  const ma_expand8: GCell[] = [
    c(a_ids[0], 1,  1,5, 1,2, P[0], "hero"),
    c(a_ids[1], 2,  1,3, 3,2, P[1], "char A"),
    c(a_ids[2], 3,  4,2, 3,2, P[2], "char B"),
    c(a_ids[3], 4,  1,5, 5,2, P[3], "extra"),
    c(a_ids[4], 5,  1,5, 7,1, P[4], "extra"),
    c(a_ids[5], 6,  1,3, 8,2, P[5]),
    c(a_ids[6], 7,  4,2, 8,2, P[5]),
    c(a_ids[7], 8,  6,7, 1,9, P[5]),            // DOMINANT
  ];

  const layout1: GLayout = {
    id: uid(), name: "Mondrian A", cols: 12, rows: 9,
    snapshots: [
      { id: uid(), label: "Base",    cells: ma_base },
      { id: uid(), label: "Box 6 →", cells: ma_expand6 },
      { id: uid(), label: "Box 8 →", cells: ma_expand8 },
    ],
  };

  // ── Layout 2: "Magazine"  ────────────────────────────────────────────────
  // Editorial feel — centre banner, thin strips, 3 equal content columns
  const b_ids = Array.from({length:8}, (_,i) => `mg-${i+1}`);

  const mg_base: GCell[] = [
    c(b_ids[0], 1,  1,3, 1,2, P[1], "char A"),  // orange left
    c(b_ids[1], 2,  4,6, 1,2, P[0], "banner"),  // amber centre
    c(b_ids[2], 3, 10,3, 1,2, P[2], "char B"),  // sky right
    c(b_ids[3], 4,  1,6, 3,1, P[3], "strip"),   // violet thin strip
    c(b_ids[4], 5,  7,6, 3,1, P[6], "strip"),   // navy thin strip
    c(b_ids[5], 6,  1,4, 4,6, P[5]),
    c(b_ids[6], 7,  5,4, 4,6, P[5]),
    c(b_ids[7], 8,  9,4, 4,6, P[5]),
  ];

  // Cell 6 expands left
  const mg_expand6: GCell[] = [
    c(b_ids[0], 1,  1,3, 1,2, P[1], "char A"),
    c(b_ids[1], 2,  1,3, 3,2, P[0], "banner"),
    c(b_ids[2], 3,  1,3, 5,2, P[2], "char B"),
    c(b_ids[3], 4,  1,3, 7,2, P[3], "strip"),
    c(b_ids[4], 5,  1,3, 9,1, P[6], "strip"),
    c(b_ids[5], 6,  4,9, 1,9, P[5]),            // DOMINANT
    c(b_ids[6], 7, 10,3, 1,5, P[5]),
    c(b_ids[7], 8, 10,3, 6,4, P[5]),
  ];

  // Cell 7 expands centre
  const mg_expand7: GCell[] = [
    c(b_ids[0], 1,  1,3, 1,2, P[1], "char A"),
    c(b_ids[1], 2,  1,3, 3,2, P[0], "banner"),
    c(b_ids[2], 3,  1,3, 5,2, P[2], "char B"),
    c(b_ids[3], 4,  1,3, 7,2, P[3], "strip"),
    c(b_ids[4], 5,  1,3, 9,1, P[6], "strip"),
    c(b_ids[5], 6, 10,3, 1,5, P[5]),
    c(b_ids[6], 7,  4,6, 1,9, P[5]),            // DOMINANT
    c(b_ids[7], 8, 10,3, 6,4, P[5]),
  ];

  const layout2: GLayout = {
    id: uid(), name: "Magazine", cols: 12, rows: 9,
    snapshots: [
      { id: uid(), label: "Base",    cells: mg_base },
      { id: uid(), label: "Box 6 →", cells: mg_expand6 },
      { id: uid(), label: "Box 7 →", cells: mg_expand7 },
    ],
  };

  return [layout1, layout2];
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour palette
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PALETTE = [
  "#e8a030",   // amber  – hero / brand
  "#f87c52",   // orange – 6-8 accent
  "#4e9bbf",   // sky    – 9-12 accent
  "#7c5cbf",   // violet – 13-16 accent
  "#2a7a6e",   // teal   – interactive
  "#f0ebe0",   // cream  – content surface
  "#252535",   // navy   – decorative dark
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Btn({
  onClick, children, active = false, danger = false, small = false, title,
}: {
  onClick: () => void; children: React.ReactNode;
  active?: boolean; danger?: boolean; small?: boolean; title?: string;
}) {
  return (
    <button title={title} onClick={onClick} style={{
      padding: small ? "3px 8px" : "5px 11px",
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      borderRadius: 6,
      border: "1px solid",
      cursor: "pointer",
      transition: "all 0.12s",
      background: danger ? "#5a1e1e" : active ? "#2a7a6e" : "rgba(255,255,255,0.07)",
      color:      danger ? "#ff9090" : active ? "#9fffee" : "#ccc",
      borderColor:danger ? "#7a3030" : active ? "#2a7a6e" : "rgba(255,255,255,0.12)",
    }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour swatch — click to select, long-press to open native colour picker
// ─────────────────────────────────────────────────────────────────────────────

const LONG_PRESS_MS = 600;

function ColorSwatch({
  color, isActive, onSelect, onColorChange,
}: {
  color:         string;
  isActive:      boolean;
  onSelect:      () => void;
  onColorChange: (newColor: string) => void;
}) {
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef     = useRef<number | null>(null);
  const holdStart  = useRef<number>(0);
  const inputRef   = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [pressing, setPressing] = useState(false);

  const stopAll = () => {
    if (timerRef.current)  { clearTimeout(timerRef.current);    timerRef.current  = null; }
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current  = null; }
    if (overlayRef.current)  overlayRef.current.style.background = "none";
    holdStart.current = 0;
    setPressing(false);
  };

  // RAF loop — directly writes the conic-gradient, no @property needed
  const tick = (ts: number) => {
    if (!holdStart.current) holdStart.current = ts;
    const pct = Math.min((ts - holdStart.current) / LONG_PRESS_MS, 1);
    if (overlayRef.current) {
      const deg = pct * 360;
      overlayRef.current.style.background =
        `conic-gradient(from -90deg, rgba(255,255,255,0.88) ${deg}deg, rgba(0,0,0,0.3) ${deg}deg)`;
    }
    if (pct < 1) rafRef.current = requestAnimationFrame(tick);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    holdStart.current = 0;
    setPressing(true);
    rafRef.current = requestAnimationFrame(tick);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      // wipe complete — stop RAF, clear overlay, open picker
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (overlayRef.current) overlayRef.current.style.background = "none";
      setPressing(false);
      inputRef.current?.click();
    }, LONG_PRESS_MS);
  };

  const handleMouseUp = () => {
    if (timerRef.current !== null) {
      // Released early → normal select click
      stopAll();
      onSelect();
    }
    // If timer already fired (long press), mouseUp is a no-op
  };

  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={stopAll}
        title="Click to select · Hold to change colour"
        style={{
          width:20, height:20, borderRadius:4,
          background: color,
          border:"2px solid",
          borderColor: isActive ? "#fff" : pressing ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.12)",
          cursor:"pointer",
          transition:"transform 0.1s, border-color 0.12s",
          transform: isActive ? "scale(1.28)" : pressing ? "scale(1.1)" : "scale(1)",
          outline:"none",
          position:"relative",
          zIndex:1,
        }}
      />
      {/* RAF-driven clock-wipe overlay — always in DOM so ref is stable */}
      <div ref={overlayRef} style={{
        position:"absolute", inset:0, borderRadius:3,
        pointerEvents:"none", background:"none", zIndex:2,
      }}/>
      {/* Native colour picker — triggered programmatically on long-press */}
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={e => onColorChange(e.target.value)}
        style={{ position:"absolute", opacity:0, width:0, height:0,
          padding:0, border:"none", top:0, left:0, pointerEvents:"none" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid Canvas
// ─────────────────────────────────────────────────────────────────────────────

type DrawState  = { startCol: number; startRow: number; currCol: number; currRow: number };
type ResizeEdge = "left" | "right" | "top" | "bottom";
type ResizeOp   = { edge: ResizeEdge; orig: GCell };

interface CanvasProps {
  layout:        GLayout;
  snapshot:      GSnapshot;
  selectedId:    string | null;
  pendingColor:  string;
  previewMode:   boolean;
  bgColor?:      string;
  onSelectCell:  (id: string | null) => void;
  onDrawCell:    (cell: Omit<GCell, "id" | "num">) => void;
  onPatchCell:   (id: string, patch: Partial<GCell>) => void;
  onTrigger:     (cell: GCell) => void;
}

function GridCanvas({
  layout, snapshot, selectedId, pendingColor, previewMode, bgColor = "#181824",
  onSelectCell, onDrawCell, onPatchCell, onTrigger,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draw,   setDraw]   = useState<DrawState | null>(null);
  const [resize, setResize] = useState<ResizeOp | null>(null);

  const { cols, rows } = layout;

  // Pixel coords (relative to container) → 1-indexed grid col/row
  const pxToGrid = useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { col: 1, row: 1 };
    return {
      col: clamp(Math.floor(x / (el.clientWidth  / cols)) + 1, 1, cols),
      row: clamp(Math.floor(y / (el.clientHeight / rows)) + 1, 1, rows),
    };
  }, [cols, rows]);

  const mousePos = useCallback((e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect();
    return pxToGrid(e.clientX - r.left, e.clientY - r.top);
  }, [pxToGrid]);

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { col, row } = mousePos(e);
    const hit = cellAtPos(col, row, snapshot.cells);

    if (previewMode) { if (hit) onTrigger(hit); return; }

    if (hit) { onSelectCell(hit.id); return; }

    // Start drawing on empty space
    onSelectCell(null);
    setDraw({ startCol: col, startRow: row, currCol: col, currRow: row });
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const { col, row } = mousePos(e);

    if (resize) {
      const c = resize.orig;
      let patch: Partial<GCell> = {};
      switch (resize.edge) {
        case "right":
          patch.colSpan = Math.max(1, col - c.colStart + 1);
          break;
        case "bottom":
          patch.rowSpan = Math.max(1, row - c.rowStart + 1);
          break;
        case "left": {
          const ns = clamp(col, 1, c.colStart + c.colSpan - 1);
          patch = { colStart: ns, colSpan: c.colStart + c.colSpan - ns };
          break;
        }
        case "top": {
          const ns = clamp(row, 1, c.rowStart + c.rowSpan - 1);
          patch = { rowStart: ns, rowSpan: c.rowStart + c.rowSpan - ns };
          break;
        }
      }
      onPatchCell(c.id, patch);
      return;
    }

    if (draw) setDraw(d => d ? { ...d, currCol: col, currRow: row } : null);
  };

  const onMouseUp = () => {
    if (resize) { setResize(null); return; }
    if (!draw)  return;

    // Pure click (no grid movement) → just deselect, don't create a cell
    if (draw.currCol === draw.startCol && draw.currRow === draw.startRow) {
      setDraw(null);
      return;
    }

    const colStart = Math.min(draw.startCol, draw.currCol);
    const rowStart = Math.min(draw.startRow, draw.currRow);
    const colSpan  = Math.abs(draw.currCol - draw.startCol) + 1;
    const rowSpan  = Math.abs(draw.currRow - draw.startRow) + 1;
    onDrawCell({ colStart, rowStart, colSpan, rowSpan, color: pendingColor, label: "" });
    setDraw(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const cellStyle = (
    colStart: number, colSpan: number, rowStart: number, rowSpan: number,
    color: string, extra?: CSSProperties
  ): CSSProperties => ({
    position:  "absolute",
    left:      `calc(${((colStart - 1) / cols) * 100}% + 2px)`,
    top:       `calc(${((rowStart - 1) / rows) * 100}% + 2px)`,
    width:     `calc(${(colSpan  / cols) * 100}% - 4px)`,
    height:    `calc(${(rowSpan  / rows) * 100}% - 4px)`,
    background: color,
    borderRadius: 6,
    ...extra,
  });

  const ghost = (draw && (draw.currCol !== draw.startCol || draw.currRow !== draw.startRow)) ? (() => {
    const colStart = Math.min(draw.startCol, draw.currCol);
    const rowStart = Math.min(draw.startRow, draw.currRow);
    const colSpan  = Math.abs(draw.currCol - draw.startCol) + 1;
    const rowSpan  = Math.abs(draw.currRow - draw.startRow) + 1;
    return { colStart, rowStart, colSpan, rowSpan };
  })() : null;

  // Cursor while a resize is active
  const containerCursor = resize
    ? (["left","right"].includes(resize.edge) ? "ew-resize" : "ns-resize")
    : previewMode ? "pointer" : "crosshair";

  // ── Render ─────────────────────────────────────────────────────────────────

  // Adaptive grid-line + border colours based on canvas luminance
  const bgIsLight = (() => {
    if (!bgColor.startsWith("#") || bgColor.length < 7) return false;
    const r = parseInt(bgColor.slice(1, 3), 16) / 255;
    const g = parseInt(bgColor.slice(3, 5), 16) / 255;
    const b = parseInt(bgColor.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.5;
  })();
  const gridLine  = bgIsLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.06)";
  const gridBorder = bgIsLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.1)";

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: "relative", width: "100%", height: "100%",
        cursor: containerCursor,
        backgroundImage: [
          `linear-gradient(${gridLine} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
        backgroundColor: bgColor,
        borderRadius: 8,
        border: `1px solid ${gridBorder}`,
        userSelect: "none",
      }}
    >
      {/* ── Cells ── */}
      {snapshot.cells.map(cell => {
        const isSelected = !previewMode && cell.id === selectedId;
        const isTrigger  =  previewMode && cell.triggersSnapshot !== undefined;

        return (
          <div
            key={cell.id}
            style={cellStyle(cell.colStart, cell.colSpan, cell.rowStart, cell.rowSpan, cell.color, {
              boxShadow: isSelected
                ? "0 0 0 2px #fff, inset 0 0 0 1px rgba(255,255,255,0.3)"
                : "inset 0 0 0 1px rgba(0,0,0,0.15)",
              transition: "box-shadow 0.1s",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", position: "absolute",
            })}
          >
            {/* Number badge – always visible top-left */}
            <span style={{
              position:"absolute", top:4, left:5,
              fontSize:10, fontWeight:800, lineHeight:1,
              color:"rgba(255,255,255,0.9)",
              textShadow:"0 1px 3px rgba(0,0,0,0.7)",
              pointerEvents:"none", userSelect:"none",
            }}>
              {cell.num ?? ""}
            </span>

            {/* Label */}
            {cell.label && (
              <span style={{
                fontSize: Math.min(12, Math.max(8, cell.colSpan * 4)),
                fontWeight: 700, color: "rgba(255,255,255,0.75)",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)", pointerEvents: "none",
                textAlign: "center", padding: "0 4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {cell.label}
              </span>
            )}

            {/* Trigger badge */}
            {isTrigger && (
              <span style={{
                position:"absolute", bottom:4, right:4,
                fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.6)",
                background:"rgba(0,0,0,0.3)", borderRadius:4, padding:"1px 4px",
              }}>→{cell.triggersSnapshot! + 1}</span>
            )}

            {/* ── Edge resize handles (selected only) ── */}
            {isSelected && (
              <>
                {/* Left */}
                <div
                  onMouseDown={e=>{ e.stopPropagation(); e.preventDefault(); setResize({edge:"left", orig:{...cell}}); }}
                  style={{
                    position:"absolute", left:0, top:"15%", width:10, height:"70%",
                    cursor:"ew-resize", zIndex:3,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <div style={{width:3, height:"55%", background:"rgba(255,255,255,0.85)", borderRadius:2, pointerEvents:"none"}}/>
                </div>

                {/* Right */}
                <div
                  onMouseDown={e=>{ e.stopPropagation(); e.preventDefault(); setResize({edge:"right", orig:{...cell}}); }}
                  style={{
                    position:"absolute", right:0, top:"15%", width:10, height:"70%",
                    cursor:"ew-resize", zIndex:3,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <div style={{width:3, height:"55%", background:"rgba(255,255,255,0.85)", borderRadius:2, pointerEvents:"none"}}/>
                </div>

                {/* Top */}
                <div
                  onMouseDown={e=>{ e.stopPropagation(); e.preventDefault(); setResize({edge:"top", orig:{...cell}}); }}
                  style={{
                    position:"absolute", top:0, left:"15%", height:10, width:"70%",
                    cursor:"ns-resize", zIndex:3,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <div style={{height:3, width:"55%", background:"rgba(255,255,255,0.85)", borderRadius:2, pointerEvents:"none"}}/>
                </div>

                {/* Bottom */}
                <div
                  onMouseDown={e=>{ e.stopPropagation(); e.preventDefault(); setResize({edge:"bottom", orig:{...cell}}); }}
                  style={{
                    position:"absolute", bottom:0, left:"15%", height:10, width:"70%",
                    cursor:"ns-resize", zIndex:3,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >
                  <div style={{height:3, width:"55%", background:"rgba(255,255,255,0.85)", borderRadius:2, pointerEvents:"none"}}/>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ── Draw ghost ── */}
      {ghost && (
        <div style={cellStyle(
          ghost.colStart, ghost.colSpan, ghost.rowStart, ghost.rowSpan,
          pendingColor,
          { opacity:0.55, border:"2px dashed rgba(255,255,255,0.7)", boxSizing:"border-box" }
        )}/>
      )}

      {/* ── Grid coordinate labels ── */}
      {Array.from({length: cols}, (_,i) => (
        <div key={`cl-${i}`} style={{
          position:"absolute", top:2, left:`calc(${(i/cols)*100}% + 3px)`,
          fontSize:8, color:"rgba(255,255,255,0.18)", fontFamily:"monospace", pointerEvents:"none",
        }}>{i+1}</div>
      ))}
      {Array.from({length: rows}, (_,i) => (
        <div key={`rl-${i}`} style={{
          position:"absolute", left:3, top:`calc(${(i/rows)*100}% + 3px)`,
          fontSize:8, color:"rgba(255,255,255,0.18)", fontFamily:"monospace", pointerEvents:"none",
        }}>{i+1}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated Preview Player
// ─────────────────────────────────────────────────────────────────────────────

interface PlayerProps {
  layout:      GLayout;
  snapshots:   GSnapshot[];
  onClose:     () => void;
  bgColor?:    string;
}

function PlayerOverlay({ layout, snapshots, onClose, bgColor = "#181824" }: PlayerProps) {
  const [snapIdx, setSnapIdx]   = useState(0);
  const [stagger, setStagger]   = useState(35);
  const [stiffness, setStiffness] = useState(420);
  const [damping, setDamping]   = useState(46);
  const [mass, setMass]         = useState(0.7);

  const snap = snapshots[snapIdx];
  const { cols, rows } = layout;

  const spring = { type:"spring" as const, stiffness, damping, mass };

  const handleTrigger = (cell: GCell) => {
    if (cell.triggersSnapshot !== undefined && snapshots[cell.triggersSnapshot]) {
      setSnapIdx(cell.triggersSnapshot);
    }
  };

  const cellPercent = (
    colStart: number, colSpan: number, rowStart: number, rowSpan: number
  ) => ({
    left:   `${((colStart - 1) / cols) * 100}%`,
    top:    `${((rowStart - 1) / rows) * 100}%`,
    width:  `${(colSpan / cols) * 100}%`,
    height: `${(rowSpan / rows) * 100}%`,
  });

  const bgIsLight = (() => {
    if (!bgColor.startsWith("#") || bgColor.length < 7) return false;
    const r = parseInt(bgColor.slice(1, 3), 16) / 255;
    const g = parseInt(bgColor.slice(3, 5), 16) / 255;
    const b = parseInt(bgColor.slice(5, 7), 16) / 255;
    return 0.299 * r + 0.587 * g + 0.114 * b > 0.5;
  })();
  const gridLine   = bgIsLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.05)";
  const gridBorder = bgIsLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.1)";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:16,
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position:"absolute", top:20, right:24,
        background:"none", border:"none", color:"#888", fontSize:24, cursor:"pointer",
      }}>✕</button>

      {/* Snapshot selector */}
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <span style={{fontSize:11, color:"#666", fontFamily:"monospace", marginRight:4}}>STATE</span>
        {snapshots.map((s,i) => (
          <button key={s.id} onClick={()=>setSnapIdx(i)} style={{
            padding:"4px 12px", borderRadius:6, fontSize:12, fontWeight:600,
            border:"1px solid",
            background: i===snapIdx ? "#2a7a6e" : "rgba(255,255,255,0.06)",
            color:       i===snapIdx ? "#9fffee" : "#888",
            borderColor: i===snapIdx ? "#2a7a6e" : "rgba(255,255,255,0.1)",
            cursor:"pointer",
          }}>{s.label}</button>
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        width: "min(90vw, 1080px)",
        aspectRatio: `${cols} / ${rows}`,
        position: "relative",
        background: bgColor,
        borderRadius: 10,
        border: `1px solid ${gridBorder}`,
        overflow: "visible",
        backgroundImage: [
          `linear-gradient(${gridLine} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${gridLine} 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
      }}>
        {snap.cells.map((cell, i) => (
          <motion.div
            key={cell.id}
            layoutId={cell.id}
            layout
            transition={{ ...spring, delay: (i * stagger) / 1000 }}
            onClick={() => handleTrigger(cell)}
            style={{
              position: "absolute",
              padding: 2,
              ...cellPercent(cell.colStart, cell.colSpan, cell.rowStart, cell.rowSpan),
              cursor: cell.triggersSnapshot !== undefined ? "pointer" : "default",
            }}
          >
            <div style={{
              width:"100%", height:"100%",
              background: cell.color,
              borderRadius: 6,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center",
              position:"relative", overflow:"hidden",
            }}>
              {/* Number badge */}
              <span style={{
                position:"absolute", top:5, left:7,
                fontSize:11, fontWeight:800, lineHeight:1,
                color:"rgba(255,255,255,0.9)",
                textShadow:"0 1px 4px rgba(0,0,0,0.6)",
                pointerEvents:"none", userSelect:"none",
              }}>
                {cell.num ?? ""}
              </span>

              {cell.label && (
                <span style={{
                  fontSize: Math.min(14, Math.max(9, cell.colSpan * 5)),
                  fontWeight:700, color:"rgba(255,255,255,0.8)",
                  textShadow:"0 1px 4px rgba(0,0,0,0.5)",
                  pointerEvents:"none",
                }}>
                  {cell.label}
                </span>
              )}
              {cell.triggersSnapshot !== undefined && (
                <div style={{
                  position:"absolute", inset:0,
                  background:"rgba(255,255,255,0.06)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <span style={{fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700}}>
                    tap
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animation controls */}
      <div style={{
        display:"flex", gap:20, alignItems:"center",
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:8, padding:"8px 16px",
      }}>
        {[
          { label:"Stiffness", val:stiffness, set:setStiffness, min:50, max:1200, step:10 },
          { label:"Damping",   val:damping,   set:setDamping,   min:5,  max:100,  step:1  },
          { label:"Mass",      val:mass,      set:setMass,      min:0.1,max:3,    step:0.1 },
          { label:"Stagger ms",val:stagger,   set:setStagger,   min:0,  max:150,  step:5  },
        ].map(({label,val,set,min,max,step}) => (
          <label key={label} style={{display:"flex",flexDirection:"column",gap:3,width:110}}>
            <span style={{
              display:"flex",justifyContent:"space-between",
              fontSize:10, fontFamily:"monospace", color:"#666",
            }}>
              <span>{label}</span><span style={{color:"#aaa"}}>{val}</span>
            </span>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e=>set(parseFloat(e.target.value))}
              style={{accentColor:"#2a7a6e"}}/>
          </label>
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GridDesigner
// ─────────────────────────────────────────────────────────────────────────────

export default function GridDesigner() {
  const [store, setStore]         = useState<Store>(() => loadStore());
  const [activeId, setActiveId]   = useState<string | null>(() => {
    const s = loadStore();
    return s.layouts[0]?.id ?? null;
  });
  const [snapIdx, setSnapIdx]     = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingColor, setPendingColor] = useState(DEFAULT_PALETTE[0]);
  const [previewOpen, setPreviewOpen]  = useState(false);
  const [renaming, setRenaming]        = useState<string | null>(null);
  const [renameVal, setRenameVal]      = useState("");
  const [dragOverId, setDragOverId]    = useState<string | null>(null);
  const dragSrcId = useRef<string | null>(null);
  const [dateInput, setDateInput]      = useState(() => new Date().toISOString().slice(0, 10));
  const [dateBusy, setDateBusy]        = useState(false);
  const [dateMsg, setDateMsg]          = useState("");

  // Persist on every change
  useEffect(() => { saveStore(store); }, [store]);

  const layout   = store.layouts.find(l => l.id === activeId) ?? null;
  const snapshot = layout?.snapshots[snapIdx] ?? null;
  const selectedCell = snapshot?.cells.find(c => c.id === selectedId) ?? null;

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId || !layout || !snapshot) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT") return;
        handleDeleteCell(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ── Store mutations ────────────────────────────────────────────────────────

  const mutateStore = (fn: (s: Store) => Store) => {
    setStore(s => fn(s));
  };

  const mutateLayout = (id: string, fn: (l: GLayout) => GLayout) => {
    mutateStore(s => ({
      ...s,
      layouts: s.layouts.map(l => l.id === id ? fn(l) : l),
    }));
  };

  const mutateSnapshot = (layoutId: string, sIdx: number, fn: (s: GSnapshot) => GSnapshot) => {
    mutateLayout(layoutId, l => ({
      ...l,
      snapshots: l.snapshots.map((s, i) => i === sIdx ? fn(s) : s),
    }));
  };

  // ── Layout CRUD ────────────────────────────────────────────────────────────

  const handleNewLayout = () => {
    const layout = makeLayout(`Grid ${store.layouts.length + 1}`);
    mutateStore(s => ({ ...s, layouts: [...s.layouts, layout] }));
    setActiveId(layout.id);
    setSnapIdx(0);
    setSelectedId(null);
  };

  const handleDuplicateLayout = () => {
    if (!layout) return;
    const dup: GLayout = {
      ...layout,
      id:   uid(),
      name: layout.name + " copy",
      snapshots: layout.snapshots.map(s => ({
        ...s,
        id:    uid(),
        cells: s.cells.map(c => ({ ...c, id: uid() })),
      })),
    };
    mutateStore(s => ({ ...s, layouts: [...s.layouts, dup] }));
    setActiveId(dup.id);
    setSnapIdx(0);
    setSelectedId(null);
  };

  const handleDeleteLayout = () => {
    if (!layout) return;
    const idx = store.layouts.findIndex(l => l.id === activeId);
    const remaining = store.layouts.filter(l => l.id !== activeId);
    // prefer the item above; fall back to the new top if we deleted index 0
    const nextActive = remaining[Math.max(0, idx - 1)]?.id ?? null;
    mutateStore(s => ({
      ...s,
      layouts: s.layouts.filter(l => l.id !== activeId),
      todayId: s.todayId === activeId ? null : s.todayId,
    }));
    setActiveId(nextActive);
    setSnapIdx(0);
    setSelectedId(null);
  };

  const handleSetToday = () => {
    mutateStore(s => ({ ...s, todayId: activeId }));
  };

  // ── Date layout: load frozen snapshot from a content date ────────────────
  const handleLoadDateLayout = async (date: string) => {
    if (!date) return;
    // If already loaded, just select it
    const existing = store.layouts.find(l => l.dateKey === date);
    if (existing) {
      setActiveId(existing.id); setSnapIdx(0); setSelectedId(null); return;
    }
    setDateBusy(true); setDateMsg("");
    try {
      const res = await fetch(`/api/content?date=${date}`, { cache: "no-store" });
      if (!res.ok) { setDateMsg(res.status === 404 ? `No content for ${date}` : "Fetch failed"); return; }
      const content = await res.json();
      if (!content.layout) { setDateMsg(`No frozen layout on ${date} — assign one in textedit first`); return; }
      const newLayout: GLayout = {
        id:       uid(),
        name:     `📅 ${date}`,
        dateKey:  date,
        cols:     content.layout.cols,
        rows:     content.layout.rows,
        snapshots: [{ id: uid(), label: "State 1", cells: content.layout.cells }],
      };
      mutateStore(s => ({ ...s, layouts: [...s.layouts, newLayout] }));
      setActiveId(newLayout.id); setSnapIdx(0); setSelectedId(null);
    } finally { setDateBusy(false); }
  };

  // ── Date layout: write edited layout back to content JSON ─────────────────
  const handleSaveDateLayout = async () => {
    if (!layout?.dateKey) return;
    setDateBusy(true); setDateMsg("");
    try {
      const date = layout.dateKey;
      const res = await fetch(`/api/content?date=${date}`, { cache: "no-store" });
      if (!res.ok) { setDateMsg("Failed to read content"); return; }
      const content = await res.json();
      const saveRes = await fetch(`/api/content?date=${date}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...content,
          layout: { cols: layout.cols, rows: layout.rows, cells: snapshot?.cells ?? [] },
        }),
      });
      setDateMsg(saveRes.ok ? "Saved ✓" : "Save failed");
      setTimeout(() => setDateMsg(""), 2500);
    } finally { setDateBusy(false); }
  };

  const handleReorderLayout = (srcId: string, targetId: string) => {
    if (srcId === targetId) return;
    mutateStore(s => {
      const arr = [...s.layouts];
      const srcIdx = arr.findIndex(l => l.id === srcId);
      const tgtIdx = arr.findIndex(l => l.id === targetId);
      if (srcIdx < 0 || tgtIdx < 0) return s;
      const [item] = arr.splice(srcIdx, 1);
      arr.splice(tgtIdx, 0, item);
      return { ...s, layouts: arr };
    });
  };

  const startRename = (id: string, name: string) => {
    setRenaming(id);
    setRenameVal(name);
  };

  const commitRename = () => {
    if (!renaming) return;
    mutateLayout(renaming, l => ({ ...l, name: renameVal || l.name }));
    setRenaming(null);
  };

  // ── Snapshot CRUD ──────────────────────────────────────────────────────────

  const handleAddSnapshot = () => {
    if (!layout || !snapshot) return;
    const clone = cloneSnapshot(snapshot, `State ${layout.snapshots.length + 1}`);
    mutateLayout(layout.id, l => ({ ...l, snapshots: [...l.snapshots, clone] }));
    setSnapIdx(layout.snapshots.length);
  };

  const handleDeleteSnapshot = (idx: number) => {
    if (!layout || layout.snapshots.length <= 1) return;
    mutateLayout(layout.id, l => ({
      ...l,
      snapshots: l.snapshots.filter((_, i) => i !== idx),
    }));
    setSnapIdx(Math.max(0, idx - 1));
  };

  const handleRenameSnapshot = (idx: number, label: string) => {
    if (!layout) return;
    mutateLayout(layout.id, l => ({
      ...l,
      snapshots: l.snapshots.map((s, i) => i === idx ? { ...s, label } : s),
    }));
  };

  // ── Cell CRUD ──────────────────────────────────────────────────────────────

  const handleDrawCell = (partial: Omit<GCell, "id" | "num">) => {
    if (!layout || !snapshot) return;
    const allNums = layout.snapshots.flatMap(s => s.cells.map(c => c.num ?? 0));
    const nextNum = allNums.length > 0 ? Math.max(...allNums) + 1 : 1;
    const cell: GCell = { ...partial, id: uid(), num: nextNum, label: "" };
    mutateSnapshot(layout.id, snapIdx, s => ({ ...s, cells: [...s.cells, cell] }));
    setSelectedId(cell.id);
  };

  const handleDeleteCell = (id: string) => {
    if (!layout || !snapshot) return;
    mutateSnapshot(layout.id, snapIdx, s => ({
      ...s, cells: s.cells.filter(c => c.id !== id),
    }));
    setSelectedId(null);
  };

  const handlePatchCell = (id: string, patch: Partial<GCell>) => {
    if (!layout) return;
    mutateSnapshot(layout.id, snapIdx, s => ({
      ...s,
      cells: s.cells.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  };

  const handleTrigger = (cell: GCell) => {
    // In preview mode on the canvas we still just show the preview overlay
    setPreviewOpen(true);
  };

  // ── Grid size tweaks ───────────────────────────────────────────────────────

  const handleGridSize = (key: "cols" | "rows", delta: number) => {
    if (!layout) return;
    mutateLayout(layout.id, l => ({
      ...l,
      [key]: Math.max(1, Math.min(24, l[key] + delta)),
    }));
  };

  // ── Palette colour change — updates slot AND recolours every matching cell ──

  const handleChangePaletteColor = (slotIdx: number, newColor: string) => {
    const oldColor = store.palette[slotIdx];

    mutateStore(s => ({
      ...s,
      // 1. Update the palette slot
      palette: s.palette.map((c, i) => i === slotIdx ? newColor : c),
      // 2. Recolour every cell that used the old colour, across all layouts/snapshots
      layouts: s.layouts.map(l => ({
        ...l,
        snapshots: l.snapshots.map(snap => ({
          ...snap,
          cells: snap.cells.map(c => c.color === oldColor ? { ...c, color: newColor } : c),
        })),
      })),
    }));

    // Keep pendingColor in sync if it was this slot
    if (pendingColor === oldColor) setPendingColor(newColor);
  };

  // ── Background colour change ───────────────────────────────────────────────

  const handleBgColorChange = (newColor: string) => {
    mutateStore(s => ({ ...s, bgColor: newColor }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const tok = "#ccc";
  const dim = "#666";
  const bg0 = "#0f0f1a";
  const bg1 = "#16162a";
  const bg2 = "#1c1c30";
  const border = "rgba(255,255,255,0.09)";

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100dvh",
      background:bg0, color:tok, fontFamily:"'Inter', system-ui, sans-serif",
      fontSize:13, overflow:"hidden",
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, padding:"5px 12px",
        background:bg1, borderBottom:`1px solid ${border}`,
        flexShrink:0,
      }}>
        <span style={{
          fontSize:12, fontWeight:800, letterSpacing:"0.04em",
          color:"#2a7a6e", marginRight:6,
        }}>
          ◈ GRID DESIGNER
        </span>

        {/* Snapshot tabs */}
        {layout?.snapshots.map((snap, i) => (
          <div key={snap.id} style={{display:"flex", alignItems:"center", gap:2}}>
            {renaming === snap.id + "_snap" ? (
              <input
                autoFocus value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onBlur={()=>{
                  handleRenameSnapshot(i, renameVal || snap.label);
                  setRenaming(null);
                }}
                onKeyDown={e=>{
                  if(e.key==="Enter"){handleRenameSnapshot(i,renameVal||snap.label);setRenaming(null);}
                  if(e.key==="Escape") setRenaming(null);
                }}
                style={{
                  width:80, padding:"3px 6px", borderRadius:5, border:"1px solid #2a7a6e",
                  background:bg2, color:tok, fontSize:12,
                }}
              />
            ) : (
              <button
                onClick={()=>{ setSnapIdx(i); setSelectedId(null); }}
                onDoubleClick={()=>{ setRenaming(snap.id+"_snap"); setRenameVal(snap.label); }}
                style={{
                  padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600,
                  border:"1px solid",
                  background: i===snapIdx ? "#2a7a6e" : "rgba(255,255,255,0.05)",
                  color:       i===snapIdx ? "#9fffee" : dim,
                  borderColor: i===snapIdx ? "#2a7a6e" : border,
                  cursor:"pointer",
                }}
              >
                {snap.label}
              </button>
            )}
            {i > 0 && (
              <button onClick={()=>handleDeleteSnapshot(i)} title="Delete state"
                style={{
                  background:"none", border:"none", color:"#444",
                  cursor:"pointer", fontSize:12, padding:"2px 3px",
                  lineHeight:1,
                }}
              >×</button>
            )}
          </div>
        ))}

        <Btn onClick={handleAddSnapshot} small>+ State</Btn>

        {/* ── Colour palette in top bar ── */}
        <div style={{
          display:"flex", gap:6, alignItems:"center",
          marginLeft:8, paddingLeft:12,
          borderLeft:`1px solid ${border}`,
        }}>
          {store.palette.map((c, i) => (
            <ColorSwatch
              key={i}
              color={c}
              isActive={c === pendingColor}
              onSelect={() => {
                setPendingColor(c);
                if (selectedId) handlePatchCell(selectedId, { color: c });
              }}
              onColorChange={newColor => handleChangePaletteColor(i, newColor)}
            />
          ))}
        </div>

        {/* ── Background colour picker ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          marginLeft:4, paddingLeft:10,
          borderLeft:`1px solid ${border}`,
        }}>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.06em", color:dim, textTransform:"uppercase", userSelect:"none" }}>BG</span>
          <label style={{ position:"relative", width:20, height:20, cursor:"pointer", borderRadius:4, overflow:"hidden",
            border:"2px solid rgba(255,255,255,0.22)", flexShrink:0,
            background: store.bgColor ?? "#181824",
          }}>
            <input
              type="color"
              value={store.bgColor ?? "#181824"}
              onChange={e => handleBgColorChange(e.target.value)}
              style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", padding:0, border:"none" }}
            />
          </label>
        </div>

        <div style={{flex:1}}/>

        {/* Grid size */}
        <span style={{fontSize:11, color:dim, fontFamily:"monospace"}}>
          {layout?.cols ?? 12} × {layout?.rows ?? 9}
        </span>
        {layout && (
          <>
            <Btn onClick={()=>handleGridSize("cols",-1)} small title="Fewer columns">C−</Btn>
            <Btn onClick={()=>handleGridSize("cols", 1)} small title="More columns">C+</Btn>
            <Btn onClick={()=>handleGridSize("rows",-1)} small title="Fewer rows">R−</Btn>
            <Btn onClick={()=>handleGridSize("rows", 1)} small title="More rows">R+</Btn>
          </>
        )}

        <Btn onClick={()=>setPreviewOpen(true)} active={previewOpen}>▶ Preview</Btn>
      </div>

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Library sidebar ─────────────────────────────────────────────── */}
        <div style={{
          width:180, flexShrink:0, background:bg1,
          borderRight:`1px solid ${border}`,
          display:"flex", flexDirection:"column", overflow:"hidden",
        }}>
          <div style={{
            padding:"7px 12px 4px",
            fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:dim,
          }}>
            LAYOUTS
          </div>

          <div className="pd-sidebar-scroll" style={{flex:1, overflowY:"auto", minHeight:0, padding:"0 8px"}}>
            {store.layouts.map(l => (
              <div
                key={l.id}
                draggable
                onDragStart={()=>{ dragSrcId.current = l.id; }}
                onDragOver={e=>{ e.preventDefault(); setDragOverId(l.id); }}
                onDragLeave={()=>setDragOverId(null)}
                onDrop={e=>{ e.preventDefault(); if(dragSrcId.current) handleReorderLayout(dragSrcId.current, l.id); dragSrcId.current=null; setDragOverId(null); }}
                onDragEnd={()=>{ dragSrcId.current=null; setDragOverId(null); }}
                onClick={()=>{ setActiveId(l.id); setSnapIdx(0); setSelectedId(null); }}
                style={{
                  padding:"6px 8px", borderRadius:6, marginBottom:2,
                  background: dragOverId===l.id
                    ? "rgba(42,122,110,0.35)"
                    : l.id===activeId
                      ? (l.dateKey ? "rgba(100,140,255,0.2)" : "rgba(42,122,110,0.2)")
                      : (l.dateKey ? "rgba(100,140,255,0.07)" : "transparent"),
                  border:`1px solid ${l.id===activeId
                    ? (l.dateKey ? "rgba(100,140,255,0.4)" : "rgba(42,122,110,0.4)")
                    : "transparent"}`,
                  cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6,
                }}
              >
                {/* Drag handle */}
                <span
                  title="Drag to reorder"
                  style={{
                    fontSize:12, color:"#444", cursor:"grab", flexShrink:0,
                    lineHeight:1, userSelect:"none",
                  }}
                >⠿</span>

                {/* Today indicator */}
                <span style={{
                  width:6, height:6, borderRadius:"50%", flexShrink:0,
                  background: store.todayId===l.id ? "#e8a030" : "transparent",
                  border: `1px solid ${store.todayId===l.id ? "#e8a030" : "rgba(255,255,255,0.15)"}`,
                }}/>

                {renaming === l.id ? (
                  <input
                    autoFocus value={renameVal}
                    onChange={e=>setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e=>{ if(e.key==="Enter") commitRename(); if(e.key==="Escape") setRenaming(null); }}
                    onClick={e=>e.stopPropagation()}
                    style={{
                      flex:1, background:bg2, border:"1px solid #2a7a6e",
                      color:tok, borderRadius:4, padding:"2px 5px", fontSize:12,
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={e=>{ e.stopPropagation(); startRename(l.id, l.name); }}
                    style={{
                      flex:1, fontSize:12, overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap",
                      color: l.id===activeId ? "#ccc" : "#888",
                    }}
                  >
                    {l.name}
                  </span>
                )}

                <span style={{fontSize:10, color:"#444"}}>
                  {l.snapshots.length}s
                </span>
              </div>
            ))}
          </div>

          <div style={{padding:"8px 10px", display:"flex", flexDirection:"column", gap:5, borderTop:`1px solid ${border}`}}>
            <Btn onClick={handleNewLayout}>+ New grid</Btn>
            <Btn onClick={()=>{
              const samples = createSampleLayouts();
              mutateStore(s => ({ ...s, layouts: [...s.layouts, ...samples] }));
              setActiveId(samples[0].id);
              setSnapIdx(0); setSelectedId(null);
            }} small>Load samples</Btn>
            {layout && (
              <>
                <Btn onClick={handleDuplicateLayout} small>Duplicate</Btn>
                {!layout.dateKey && (
                  <Btn onClick={handleSetToday} small active={store.todayId===activeId}>
                    {store.todayId===activeId ? "★ Today" : "Set as today"}
                  </Btn>
                )}
                <Btn onClick={handleDeleteLayout} small danger>Delete</Btn>
              </>
            )}
          </div>

          {/* ── Date layouts ──────────────────────────────────────────── */}
          <div style={{padding:"8px 10px", display:"flex", flexDirection:"column", gap:6, borderTop:`1px solid ${border}`}}>
            <div style={{fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:dim}}>
              DATE LAYOUTS
            </div>
            <div style={{display:"flex", gap:4}}>
              <input
                type="date"
                value={dateInput}
                onChange={e => setDateInput(e.target.value)}
                style={{
                  flex:1, background:bg2, border:`1px solid ${border}`,
                  color:tok, borderRadius:4, padding:"3px 5px",
                  fontSize:11, colorScheme:"dark",
                }}
              />
              <Btn small onClick={() => { if (!dateBusy) handleLoadDateLayout(dateInput); }} active={dateBusy}>
                {dateBusy ? "…" : "↓ Load"}
              </Btn>
            </div>
            {layout?.dateKey && (
              <Btn
                small
                active
                onClick={() => { if (!dateBusy) handleSaveDateLayout(); }}
              >
                {dateBusy ? "Saving…" : `↑ Save to ${layout.dateKey}`}
              </Btn>
            )}
            {dateMsg && (
              <span style={{
                fontSize:10, lineHeight:1.4,
                color: dateMsg.includes("✓") ? "#4CAF50" : "#e07070",
              }}>
                {dateMsg}
              </span>
            )}
          </div>
        </div>

        {/* ── Canvas area ─────────────────────────────────────────────────── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:14, overflow:"hidden",
        }}>
          {layout && snapshot ? (
            <div style={{
              width:"100%", maxWidth:`${(layout.cols / layout.rows) * 520}px`,
              aspectRatio:`${layout.cols} / ${layout.rows}`,
            }}>
              <GridCanvas
                layout={layout}
                snapshot={snapshot}
                selectedId={selectedId}
                pendingColor={pendingColor}
                previewMode={false}
                bgColor={store.bgColor}
                onSelectCell={setSelectedId}
                onDrawCell={handleDrawCell}
                onPatchCell={handlePatchCell}
                onTrigger={handleTrigger}
              />
            </div>
          ) : (
            <div style={{textAlign:"center", color:"#444"}}>
              <div style={{fontSize:48, marginBottom:12}}>◈</div>
              <div style={{fontSize:16, fontWeight:600, marginBottom:8}}>No grid selected</div>
              <div style={{fontSize:13, marginBottom:20}}>Create a new layout to get started</div>
              <Btn onClick={handleNewLayout}>+ New grid</Btn>
            </div>
          )}

        </div>

        {/* ── Properties panel ────────────────────────────────────────────── */}
        <div style={{
          width:200, flexShrink:0, background:bg1,
          borderLeft:`1px solid ${border}`,
          display:"flex", flexDirection:"column",
          padding:12, gap:12, overflow:"hidden",
        }}>
          {selectedCell ? (
            <>
              <div style={{fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:dim}}>
                CELL
              </div>

              {/* Label */}
              <label style={{display:"flex", flexDirection:"column", gap:4}}>
                <span style={{fontSize:10, color:dim}}>Label</span>
                <input
                  value={selectedCell.label}
                  onChange={e=>handlePatchCell(selectedId!, {label:e.target.value})}
                  placeholder="hero / content / …"
                  style={{
                    background:bg2, border:`1px solid ${border}`, color:tok,
                    borderRadius:5, padding:"4px 7px", fontSize:12,
                  }}
                />
              </label>

              {/* Position controls */}
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                {([
                  ["Col start","colStart",1,layout?.cols??12],
                  ["Col span", "colSpan", 1,layout?.cols??12],
                  ["Row start","rowStart",1,layout?.rows??9],
                  ["Row span", "rowSpan", 1,layout?.rows??9],
                ] as [string,keyof GCell,number,number][]).map(([label,key,min,max]) => (
                  <label key={key} style={{display:"flex",flexDirection:"column",gap:3}}>
                    <span style={{fontSize:9, color:dim}}>{label}</span>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <button onClick={()=>handlePatchCell(selectedId!,{[key]:Math.max(min,(selectedCell[key] as number)-1)})}
                        style={{background:bg2,border:`1px solid ${border}`,color:tok,borderRadius:4,width:20,height:22,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,flexShrink:0}}>−</button>
                      <span style={{flex:1,textAlign:"center",fontSize:12,fontFamily:"monospace",color:"#aaa"}}>
                        {selectedCell[key] as number}
                      </span>
                      <button onClick={()=>handlePatchCell(selectedId!,{[key]:Math.min(max,(selectedCell[key] as number)+1)})}
                        style={{background:bg2,border:`1px solid ${border}`,color:tok,borderRadius:4,width:20,height:22,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,flexShrink:0}}>+</button>
                    </div>
                  </label>
                ))}
              </div>

              {/* Trigger */}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:10,color:dim}}>Click → state</span>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <button
                    onClick={()=>handlePatchCell(selectedId!,{triggersSnapshot:undefined})}
                    style={{
                      padding:"3px 7px",fontSize:10,borderRadius:4,cursor:"pointer",border:"1px solid",
                      background:selectedCell.triggersSnapshot===undefined?"#3a1a1a":"rgba(255,255,255,0.05)",
                      color:selectedCell.triggersSnapshot===undefined?"#ff9090":"#666",
                      borderColor:selectedCell.triggersSnapshot===undefined?"#7a3030":border,
                    }}>none</button>
                  {layout?.snapshots.map((s,i) => (
                    <button key={s.id}
                      onClick={()=>handlePatchCell(selectedId!,{triggersSnapshot:i})}
                      style={{
                        padding:"3px 7px",fontSize:10,borderRadius:4,cursor:"pointer",border:"1px solid",
                        background:selectedCell.triggersSnapshot===i?"rgba(42,122,110,0.3)":"rgba(255,255,255,0.05)",
                        color:selectedCell.triggersSnapshot===i?"#9fffee":"#666",
                        borderColor:selectedCell.triggersSnapshot===i?"#2a7a6e":border,
                      }}>{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <Btn onClick={()=>handleDeleteCell(selectedId!)} danger>Delete cell</Btn>

              {/* Colour swatch */}
              <div style={{
                width:"100%", height:40, borderRadius:6,
                background:selectedCell.color,
                border:"1px solid rgba(255,255,255,0.1)",
              }}/>
            </>
          ) : (
            <div style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              textAlign:"center", color:"#444", gap:8,
            }}>
              <div style={{fontSize:24}}>◻</div>
              <div style={{fontSize:12}}>Draw rectangles on the canvas</div>
              <div style={{fontSize:11, color:"#333"}}>
                Drag to draw · Click to select · Delete key to remove
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Preview overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewOpen && layout && (
          <motion.div
            key="preview"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            transition={{duration:0.15}}
          >
            <PlayerOverlay
              layout={layout}
              snapshots={layout.snapshots}
              onClose={()=>setPreviewOpen(false)}
              bgColor={store.bgColor}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
