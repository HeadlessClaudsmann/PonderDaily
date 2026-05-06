"use client";

import { useState, useRef, useEffect, useCallback, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GCell = {
  id: string;
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
};

type Store = {
  layouts: GLayout[];
  todayId: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────────────

const STORE_KEY = "ponder-grid-designer";

function loadStore(): Store {
  if (typeof window === "undefined") return { layouts: [], todayId: null };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return { layouts: [], todayId: null };
}

function saveStore(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
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
// Colour palette
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = [
  "#e8a030", "#2a7a6e", "#f87c52", "#4e9bbf", "#7c5cbf", "#e05b5b",
  "#45b580", "#f0c040", "#b07040", "#7a8fa0", "#c090d0", "#d0c8b8",
  "#3a3a5a", "#f5f0e8", "#ffffff",
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
// Grid Canvas
// ─────────────────────────────────────────────────────────────────────────────

type DrawState = { startCol: number; startRow: number; currCol: number; currRow: number };

interface CanvasProps {
  layout:        GLayout;
  snapshot:      GSnapshot;
  selectedId:    string | null;
  pendingColor:  string;
  previewMode:   boolean;
  onSelectCell:  (id: string | null) => void;
  onDrawCell:    (cell: Omit<GCell, "id">) => void;
  onTrigger:     (cell: GCell) => void;
}

function GridCanvas({
  layout, snapshot, selectedId, pendingColor, previewMode,
  onSelectCell, onDrawCell, onTrigger,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draw, setDraw] = useState<DrawState | null>(null);

  const { cols, rows } = layout;

  // Convert pixel coords (relative to container) → 1-indexed grid col/row
  const pxToGrid = useCallback((x: number, y: number) => {
    const el = containerRef.current;
    if (!el) return { col: 1, row: 1 };
    const w = el.clientWidth;
    const h = el.clientHeight;
    return {
      col: clamp(Math.floor(x / (w / cols)) + 1, 1, cols),
      row: clamp(Math.floor(y / (h / rows)) + 1, 1, rows),
    };
  }, [cols, rows]);

  const mousePos = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current!;
    const r  = el.getBoundingClientRect();
    return pxToGrid(e.clientX - r.left, e.clientY - r.top);
  }, [pxToGrid]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { col, row } = mousePos(e);
    const hit = cellAtPos(col, row, snapshot.cells);

    if (previewMode) {
      if (hit) onTrigger(hit);
      return;
    }

    if (hit) {
      onSelectCell(hit.id);
      return;
    }
    // Start drawing
    onSelectCell(null);
    setDraw({ startCol: col, startRow: row, currCol: col, currRow: row });
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draw) return;
    const { col, row } = mousePos(e);
    setDraw(d => d ? { ...d, currCol: col, currRow: row } : null);
  };

  const onMouseUp = () => {
    if (!draw) return;
    const colStart = Math.min(draw.startCol, draw.currCol);
    const rowStart = Math.min(draw.startRow, draw.currRow);
    const colSpan  = Math.abs(draw.currCol - draw.startCol) + 1;
    const rowSpan  = Math.abs(draw.currRow - draw.startRow) + 1;
    onDrawCell({ colStart, rowStart, colSpan, rowSpan, color: pendingColor, label: "" });
    setDraw(null);
  };

  // Cell → CSS absolute style
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

  // Ghost rectangle while drawing
  const ghost = draw && (() => {
    const colStart = Math.min(draw.startCol, draw.currCol);
    const rowStart = Math.min(draw.startRow, draw.currRow);
    const colSpan  = Math.abs(draw.currCol - draw.startCol) + 1;
    const rowSpan  = Math.abs(draw.currRow - draw.startRow) + 1;
    return { colStart, rowStart, colSpan, rowSpan };
  })();

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position:   "relative",
        width:      "100%",
        height:     "100%",
        cursor:     previewMode ? "pointer" : "crosshair",
        // Subtle grid lines via background pattern
        backgroundImage: [
          `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        ].join(","),
        backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
        backgroundColor: "#181824",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.1)",
        userSelect: "none",
      }}
    >
      {/* Existing cells */}
      {snapshot.cells.map(cell => {
        const isSelected = !previewMode && cell.id === selectedId;
        const isTrigger  = previewMode && cell.triggersSnapshot !== undefined;
        return (
          <div
            key={cell.id}
            style={cellStyle(cell.colStart, cell.colSpan, cell.rowStart, cell.rowSpan, cell.color, {
              boxShadow: isSelected
                ? "0 0 0 2px #fff, inset 0 0 0 1px rgba(255,255,255,0.4)"
                : "inset 0 0 0 1px rgba(0,0,0,0.15)",
              opacity:    isTrigger ? 0.9 : 1,
              transition: "box-shadow 0.1s",
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow:   "hidden",
            })}
          >
            {/* Label */}
            {cell.label && (
              <span style={{
                fontSize: Math.min(12, Math.max(8, cell.colSpan * 4)),
                fontWeight: 700,
                color: "rgba(255,255,255,0.75)",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                pointerEvents: "none",
                textAlign: "center",
                padding: "0 4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {cell.label}
              </span>
            )}
            {/* Trigger indicator */}
            {isTrigger && (
              <span style={{
                position: "absolute", bottom: 4, right: 4,
                fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                background: "rgba(0,0,0,0.3)", borderRadius: 4, padding: "1px 4px",
              }}>
                →{cell.triggersSnapshot! + 1}
              </span>
            )}
            {/* Resize-mode corner indicators */}
            {isSelected && (
              <>
                {[["0%","0%"],["100%","0%"],["0%","100%"],["100%","100%"]].map(([l,t],i) => (
                  <div key={i} style={{
                    position:"absolute", left:l, top:t,
                    width:8, height:8, borderRadius:"50%",
                    background:"#fff", transform:"translate(-50%,-50%)",
                    boxShadow:"0 0 4px rgba(0,0,0,0.5)",
                  }}/>
                ))}
              </>
            )}
          </div>
        );
      })}

      {/* Draw ghost */}
      {ghost && (
        <div style={cellStyle(
          ghost.colStart, ghost.colSpan, ghost.rowStart, ghost.rowSpan,
          pendingColor,
          { opacity: 0.55, border: "2px dashed rgba(255,255,255,0.7)", boxSizing: "border-box" }
        )}/>
      )}

      {/* Col/row labels */}
      {Array.from({length: cols}, (_,i) => (
        <div key={`cl-${i}`} style={{
          position:"absolute", top:2, left:`calc(${(i/cols)*100}% + 3px)`,
          fontSize:8, color:"rgba(255,255,255,0.2)", fontFamily:"monospace", pointerEvents:"none",
        }}>{i+1}</div>
      ))}
      {Array.from({length: rows}, (_,i) => (
        <div key={`rl-${i}`} style={{
          position:"absolute", left:3, top:`calc(${(i/rows)*100}% + 3px)`,
          fontSize:8, color:"rgba(255,255,255,0.2)", fontFamily:"monospace", pointerEvents:"none",
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
}

function PlayerOverlay({ layout, snapshots, onClose }: PlayerProps) {
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
        background: "#181824",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "visible",
        backgroundImage: [
          `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
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

      <p style={{fontSize:11, color:"#444", fontFamily:"monospace"}}>
        Click cells marked with a trigger to animate · Use state buttons to jump directly
      </p>
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
  const [pendingColor, setPendingColor] = useState(PALETTE[0]);
  const [previewOpen, setPreviewOpen]  = useState(false);
  const [renaming, setRenaming]        = useState<string | null>(null);
  const [renameVal, setRenameVal]      = useState("");

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
    mutateStore(s => ({
      layouts: s.layouts.filter(l => l.id !== activeId),
      todayId: s.todayId === activeId ? null : s.todayId,
    }));
    const remaining = store.layouts.filter(l => l.id !== activeId);
    setActiveId(remaining[0]?.id ?? null);
    setSnapIdx(0);
    setSelectedId(null);
  };

  const handleSetToday = () => {
    mutateStore(s => ({ ...s, todayId: activeId }));
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

  const handleDrawCell = (partial: Omit<GCell, "id">) => {
    if (!layout || !snapshot) return;
    const cell: GCell = { ...partial, id: uid(), label: "" };
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const tok = "#ccc";
  const dim = "#666";
  const bg0 = "#0f0f1a";
  const bg1 = "#16162a";
  const bg2 = "#1c1c30";
  const border = "rgba(255,255,255,0.09)";

  return (
    <div style={{
      display:"flex", flexDirection:"column", height:"100vh",
      background:bg0, color:tok, fontFamily:"'Inter', system-ui, sans-serif",
      fontSize:13, overflow:"hidden",
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"8px 16px",
        background:bg1, borderBottom:`1px solid ${border}`,
        flexShrink:0,
      }}>
        <span style={{
          fontSize:13, fontWeight:800, letterSpacing:"0.04em",
          color:"#2a7a6e", marginRight:8,
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
                  padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:600,
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
            padding:"10px 12px 6px",
            fontSize:10, fontWeight:700, letterSpacing:"0.08em", color:dim,
          }}>
            LAYOUTS
          </div>

          <div style={{flex:1, overflowY:"auto", padding:"0 8px"}}>
            {store.layouts.map(l => (
              <div
                key={l.id}
                onClick={()=>{ setActiveId(l.id); setSnapIdx(0); setSelectedId(null); }}
                style={{
                  padding:"7px 8px", borderRadius:6, marginBottom:2,
                  background: l.id===activeId ? "rgba(42,122,110,0.2)" : "transparent",
                  border:`1px solid ${l.id===activeId ? "rgba(42,122,110,0.4)" : "transparent"}`,
                  cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6,
                }}
              >
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
            {layout && (
              <>
                <Btn onClick={handleDuplicateLayout} small>Duplicate</Btn>
                <Btn onClick={handleSetToday} small active={store.todayId===activeId}>
                  {store.todayId===activeId ? "★ Today" : "Set as today"}
                </Btn>
                <Btn onClick={handleDeleteLayout} small danger>Delete</Btn>
              </>
            )}
          </div>
        </div>

        {/* ── Canvas area ─────────────────────────────────────────────────── */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:24, overflow:"hidden", gap:16,
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
                onSelectCell={setSelectedId}
                onDrawCell={handleDrawCell}
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

          {/* Colour palette */}
          {layout && (
            <div style={{
              display:"flex", gap:6, alignItems:"center",
              background:bg1, border:`1px solid ${border}`,
              borderRadius:8, padding:"7px 12px",
            }}>
              <span style={{fontSize:10, color:dim, marginRight:4, fontFamily:"monospace"}}>COLOR</span>
              {PALETTE.map(c => (
                <button
                  key={c} onClick={()=>{ setPendingColor(c); if(selectedId) handlePatchCell(selectedId, {color:c}); }}
                  title={c}
                  style={{
                    width:20, height:20, borderRadius:4, background:c, border:"2px solid",
                    borderColor: c===pendingColor ? "#fff" : "rgba(255,255,255,0.1)",
                    cursor:"pointer", transition:"transform 0.1s",
                    transform: c===pendingColor ? "scale(1.25)" : "scale(1)",
                  }}
                />
              ))}
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
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
