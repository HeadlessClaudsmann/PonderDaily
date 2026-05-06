"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useLayoutEffect, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ContentPiece = {
  id: string; title: string; body: string;
  question1: string; question2: string; question3: string;
  topicCategory: string; contentType?: string; emoji?: string;
};

type Props = {
  pieces: ContentPiece[];
  accentColor: string;
  ageBand: "6-8" | "9-12" | "13-16";
  tagline: string;
};

export type GridParams = {
  springStiffness: number;
  springDamping:   number;
  springMass:      number;
  contentHideMs:   number;
  jelDuration:     number;
  staggerMs:       number;
};

const DEFAULT_PARAMS: GridParams = {
  springStiffness: 420,
  springDamping:   46,
  springMass:      0.7,
  contentHideMs:   140,
  jelDuration:     0.44,
  staggerMs:       35,
};

// ─────────────────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_EMOJI: Record<string, string> = {
  nature:"🌿", science:"🔬", history:"📜", technology:"💡",
  culture:"🎭", "human interest":"🤝", geography:"🌍", language:"📖",
  mathematics:"🔢", biography:"🧠", philosophy:"⚖️",
};

const TYPE_META: Record<string, { badge: string; color: string }> = {
  article:     { badge:"Read",    color:"" },
  puzzle:      { badge:"Puzzle",  color:"#f59e0b" },
  bio:         { badge:"Thinker", color:"#8b5cf6" },
  fact:        { badge:"Fact",    color:"#0ea5e9" },
  illustration:{ badge:"Explore", color:"#10b981" },
};

const CHARS: Record<"6-8"|"9-12"|"13-16", {emoji:string;name:string;quote:string}[]> = {
  "6-8":   [{emoji:"🦊",name:"Finn",  quote:"Every question is a superpower."},
             {emoji:"🐙",name:"Otto",  quote:"Eight arms, endless curiosity!"}],
  "9-12":  [{emoji:"🔭",name:"Nova",  quote:"The universe rewards the curious."},
             {emoji:"⚗️",name:"Pip",  quote:"Wrong experiments teach the most."}],
  "13-16": [{emoji:"💡",name:"Theo",  quote:"A good question beats a quick answer."},
             {emoji:"🌿",name:"Sage",  quote:"Evidence is the beginning, not the end."}],
};

const DUMMY = {
  quote:    { text:"The important thing is not to stop questioning.", author:"Einstein" },
  funfact:  { text:"A group of flamingos is called a flamboyance.", emoji:"🦩" },
  challenge:{ text:"Write three things you noticed today that you've never paid attention to before.", emoji:"✏️" },
  word:     { word:"Sonder", pron:"/ˈsɒn.dər/", def:"The realisation that each passerby is living a life as vivid as your own." },
  stat:     { number:"8.1B", label:"people on Earth", context:"Each with a unique story.", emoji:"🌍" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout system — every cell moves in every state
//
// 8 cells × 4 states = 32 distinct slot positions.
// Each state is a complete non-overlapping Mondrian snapshot.
// Framer Motion FLIP animates between snapshots.
//
// Cell order:  hero | char0 | char1 | extra0 | extra1 | content0 | content1 | content2
// States:      collapsed | expanded0 | expanded1 | expanded2
// ─────────────────────────────────────────────────────────────────────────────

type Slot = { colStart:number; colSpan:number; rowStart:number; rowSpan:number };
type ExtraKind = "quote"|"funfact"|"challenge"|"word"|"stat";

// All 8 cells × current state
type LayoutSnapshot = {
  hero:     Slot;
  chars:    [Slot, Slot];
  extras:   [Slot, Slot];          // always exactly 2 extras
  contents: [Slot, Slot, Slot];
};

type FullLayout = {
  extraKinds: [ExtraKind, ExtraKind];
  collapsed:  LayoutSnapshot;
  expanded0:  LayoutSnapshot;   // content[0] dominant
  expanded1:  LayoutSnapshot;   // content[1] dominant
  expanded2:  LayoutSnapshot;   // content[2] dominant
};

const s = (cs:number,csp:number,rs:number,rsp:number): Slot =>
  ({ colStart:cs, colSpan:csp, rowStart:rs, rowSpan:rsp });

// ─────────────────────────────────────────────────────────────────────────────
// 6-8  ─────────────────────────────────────────────────────────────────────
//
// COLLAPSED:
//   hero      col1-5  row1-4   (5w × 4h)  ← big top-left anchor
//   char0     col6-9  row1-2   (4w × 2h)
//   char1     col10-12 row1-2  (3w × 2h)
//   extra0    col6-9  row3-4   (4w × 2h)  funfact
//   extra1    col10-12 row3-4  (3w × 2h)  quote
//   content0  col1-4  row5-9   (4w × 5h)
//   content1  col5-8  row5-9   (4w × 5h)
//   content2  col9-12 row5-9   (4w × 5h)
//
// EXPANDED_0 (content0 dominant — takes left 7 cols full height):
//   content0  col1-7  row1-9   (7w × 9h)  DOMINANT
//   hero      col8-12 row1-2   (5w × 2h)
//   char0     col8-10 row3-4   (3w × 2h)
//   char1     col11-12 row3-4  (2w × 2h)
//   extra0    col8-12 row5-6   (5w × 2h)
//   extra1    col8-12 row7     (5w × 1h)  thin strip
//   content1  col8-10 row8-9   (3w × 2h)
//   content2  col11-12 row8-9  (2w × 2h)
//
// EXPANDED_1 (content1 dominant — takes centre cols 4-9):
//   content1  col4-9  row1-9   (6w × 9h)  DOMINANT
//   hero      col1-3  row1-2   (3w × 2h)
//   char0     col1-3  row3-4   (3w × 2h)
//   char1     col1-3  row5-6   (3w × 2h)
//   extra0    col1-3  row7-8   (3w × 2h)
//   extra1    col1-3  row9     (3w × 1h)  thin strip
//   content0  col10-12 row1-5  (3w × 5h)
//   content2  col10-12 row6-9  (3w × 4h)
//
// EXPANDED_2 (content2 dominant — takes right 7 cols full height):
//   content2  col6-12 row1-9   (7w × 9h)  DOMINANT
//   hero      col1-5  row1-2   (5w × 2h)
//   char0     col1-3  row3-4   (3w × 2h)
//   char1     col4-5  row3-4   (2w × 2h)
//   extra0    col1-5  row5-6   (5w × 2h)
//   extra1    col1-5  row7     (5w × 1h)  thin strip
//   content0  col1-3  row8-9   (3w × 2h)
//   content1  col4-5  row8-9   (2w × 2h)
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_68: FullLayout = {
  extraKinds: ["funfact", "quote"],
  collapsed: {
    hero:     s(1,5,1,4),
    chars:   [s(6,4,1,2),    s(10,3,1,2)],
    extras:  [s(6,4,3,2),    s(10,3,3,2)],
    contents:[s(1,4,5,5),    s(5,4,5,5),   s(9,4,5,5)],
  },
  expanded0: {
    hero:     s(8,5,1,2),
    chars:   [s(8,3,3,2),    s(11,2,3,2)],
    extras:  [s(8,5,5,2),    s(8,5,7,1)],
    contents:[s(1,7,1,9),    s(8,3,8,2),   s(11,2,8,2)],
  },
  expanded1: {
    hero:     s(1,3,1,2),
    chars:   [s(1,3,3,2),    s(1,3,5,2)],
    extras:  [s(1,3,7,2),    s(1,3,9,1)],
    contents:[s(10,3,1,5),   s(4,6,1,9),   s(10,3,6,4)],
  },
  expanded2: {
    hero:     s(1,5,1,2),
    chars:   [s(1,3,3,2),    s(4,2,3,2)],
    extras:  [s(1,5,5,2),    s(1,5,7,1)],
    contents:[s(1,3,8,2),    s(4,2,8,2),   s(6,7,1,9)],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 9-12  ─────────────────────────────────────────────────────────────────────
//
// COLLAPSED: hero top-right, content fills most of the grid
//   hero      col8-12 row1-3   (5w × 3h)  ← anchors top-right
//   char0     col1-4  row1-2   (4w × 2h)
//   char1     col5-7  row1-2   (3w × 2h)
//   extra0    col1-7  row3     (7w × 1h)  wide thin strip
//   extra1    col8-12 row4     (5w × 1h)  thin strip
//   content0  col1-4  row4-9   (4w × 6h)
//   content1  col5-8  row4-9   (4w × 6h)
//   content2  col9-12 row4-9   (4w × 6h)
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_912: FullLayout = {
  extraKinds: ["funfact", "stat"],
  collapsed: {
    hero:     s(8,5,1,3),
    chars:   [s(1,4,1,2),    s(5,3,1,2)],
    extras:  [s(1,7,3,1),    s(8,5,4,1)],
    contents:[s(1,4,5,5),    s(5,4,5,5),   s(9,4,5,5)],
  },
  expanded0: {
    hero:     s(8,5,1,2),
    chars:   [s(8,3,3,2),    s(11,2,3,2)],
    extras:  [s(8,5,5,2),    s(8,5,7,1)],
    contents:[s(1,7,1,9),    s(8,3,8,2),   s(11,2,8,2)],
  },
  expanded1: {
    hero:     s(1,3,1,2),
    chars:   [s(1,3,3,2),    s(1,3,5,2)],
    extras:  [s(1,3,7,2),    s(1,3,9,1)],
    contents:[s(10,3,1,5),   s(4,6,1,9),   s(10,3,6,4)],
  },
  expanded2: {
    hero:     s(1,5,1,2),
    chars:   [s(1,3,3,2),    s(4,2,3,2)],
    extras:  [s(1,5,5,2),    s(1,5,7,1)],
    contents:[s(1,3,8,2),    s(4,2,8,2),   s(6,7,1,9)],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 13-16  ───────────────────────────────────────────────────────────────────
//
// COLLAPSED: editorial feel — hero top centre, thin extra strips
//   hero      col4-9  row1-2   (6w × 2h)  ← centre banner
//   char0     col1-3  row1-2   (3w × 2h)
//   char1     col10-12 row1-2  (3w × 2h)
//   extra0    col1-6  row3     (6w × 1h)  thin strip
//   extra1    col7-12 row3     (6w × 1h)  thin strip
//   content0  col1-4  row4-9   (4w × 6h)
//   content1  col5-8  row4-9   (4w × 6h)
//   content2  col9-12 row4-9   (4w × 6h)
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_1316: FullLayout = {
  extraKinds: ["word", "challenge"],
  collapsed: {
    hero:     s(4,6,1,2),
    chars:   [s(1,3,1,2),    s(10,3,1,2)],
    extras:  [s(1,6,3,1),    s(7,6,3,1)],
    contents:[s(1,4,4,6),    s(5,4,4,6),   s(9,4,4,6)],
  },
  expanded0: {
    hero:     s(8,5,1,2),
    chars:   [s(8,3,3,2),    s(11,2,3,2)],
    extras:  [s(8,5,5,2),    s(8,5,7,1)],
    contents:[s(1,7,1,9),    s(8,3,8,2),   s(11,2,8,2)],
  },
  expanded1: {
    hero:     s(1,3,1,2),
    chars:   [s(1,3,3,2),    s(1,3,5,2)],
    extras:  [s(1,3,7,2),    s(1,3,9,1)],
    contents:[s(10,3,1,5),   s(4,6,1,9),   s(10,3,6,4)],
  },
  expanded2: {
    hero:     s(1,5,1,2),
    chars:   [s(1,3,3,2),    s(4,2,3,2)],
    extras:  [s(1,5,5,2),    s(1,5,7,1)],
    contents:[s(1,3,8,2),    s(4,2,8,2),   s(6,7,1,9)],
  },
};

const BAND_LAYOUT: Record<"6-8"|"9-12"|"13-16", FullLayout> = {
  "6-8":   LAYOUT_68,
  "9-12":  LAYOUT_912,
  "13-16": LAYOUT_1316,
};

function resolveSnapshot(layout: FullLayout, expandedIdx: 0|1|2|null): LayoutSnapshot {
  if (expandedIdx === null) return layout.collapsed;
  return [layout.expanded0, layout.expanded1, layout.expanded2][expandedIdx];
}

function slotStyle(slot: Slot): React.CSSProperties {
  return {
    "--col-start": slot.colStart,
    "--col-span":  slot.colSpan,
    "--row-start": slot.rowStart,
    "--row-span":  slot.rowSpan,
  } as React.CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function firstTwoSentences(text: string): string {
  const matches = text.match(/[^.!?]+[.!?]+/g);
  if (!matches) return text.slice(0, 140);
  return matches.slice(0, 2).join(" ");
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev overlay
// ─────────────────────────────────────────────────────────────────────────────

function Slider({label,min,max,step,value,onChange}:{
  label:string;min:number;max:number;step:number;value:number;onChange:(v:number)=>void;
}) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:2}}>
      <span style={{display:"flex",justifyContent:"space-between",fontSize:10,fontFamily:"monospace",color:"#aaa"}}>
        <span>{label}</span><span style={{color:"#fff"}}>{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        style={{width:"100%",accentColor:"#3da394"}}/>
    </label>
  );
}

function DevOverlay({params,onChange}:{params:GridParams;onChange:(p:GridParams)=>void}) {
  const [pos,setPos] = useState({x:16,y:72});
  const [drag,setDrag] = useState(false);
  const off = useRef({x:0,y:0});
  const [open,setOpen] = useState(true);

  const onDown = useCallback((e:React.MouseEvent)=>{
    setDrag(true); off.current={x:e.clientX-pos.x,y:e.clientY-pos.y}; e.preventDefault();
  },[pos]);

  useEffect(()=>{
    if(!drag) return;
    const mv=(e:MouseEvent)=>setPos({x:e.clientX-off.current.x,y:e.clientY-off.current.y});
    const up=()=>setDrag(false);
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
  },[drag]);

  const set=(k:keyof GridParams)=>(v:number)=>onChange({...params,[k]:v});

  return (
    <div style={{position:"fixed",left:pos.x,top:pos.y,zIndex:9999,width:220,
      background:"rgba(16,16,22,0.97)",border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:10,fontFamily:"monospace",boxShadow:"0 8px 32px rgba(0,0,0,0.6)",
      userSelect:"none"}}>
      <div onMouseDown={onDown} style={{cursor:drag?"grabbing":"grab",padding:"8px 12px",
        borderBottom:open?"1px solid rgba(255,255,255,0.07)":"none",
        display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#3da394",letterSpacing:"0.05em"}}>⚙ GRID PARAMS</span>
        <button onMouseDown={e=>e.stopPropagation()} onClick={()=>setOpen(o=>!o)}
          style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:12}}>
          {open?"▲":"▼"}
        </button>
      </div>
      {open&&(
        <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:4}}>
            <span style={{fontSize:10,color:"#555",letterSpacing:"0.06em"}}>SPRING</span>
          </div>
          <Slider label="Stiffness" min={50}  max={1200} step={10}  value={params.springStiffness} onChange={set("springStiffness")}/>
          <Slider label="Damping"   min={5}   max={100}  step={1}   value={params.springDamping}   onChange={set("springDamping")}/>
          <Slider label="Mass"      min={0.1} max={3}    step={0.1} value={params.springMass}      onChange={set("springMass")}/>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:4}}>
            <span style={{fontSize:10,color:"#555",letterSpacing:"0.06em"}}>TIMING</span>
          </div>
          <Slider label="Stagger ms" min={0}   max={120}  step={5}   value={params.staggerMs}     onChange={set("staggerMs")}/>
          <Slider label="Hide ms"    min={0}   max={500}  step={10}  value={params.contentHideMs} onChange={set("contentHideMs")}/>
          <Slider label="Jello dur"  min={0.1} max={1.2}  step={0.05}value={params.jelDuration}   onChange={set("jelDuration")}/>
          <button onClick={()=>onChange({...DEFAULT_PARAMS})}
            style={{marginTop:2,padding:"4px 0",fontSize:10,fontWeight:700,borderRadius:4,
              border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",
              color:"#555",cursor:"pointer"}}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Extra tile components
// ─────────────────────────────────────────────────────────────────────────────

function QuoteTile({ac}:{ac:string}) {
  return (
    <div className="rounded-2xl h-full flex flex-col justify-center p-3 gap-1.5"
      style={{background:`${ac}10`,border:`2px solid ${ac}22`,minHeight:40}}>
      <p className="text-sm font-serif italic leading-snug" style={{color:"var(--pd-ink)"}}>
        &ldquo;{DUMMY.quote.text}&rdquo;
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{color:ac}}>
        — {DUMMY.quote.author}
      </p>
    </div>
  );
}

function FunFactTile({ac}:{ac:string}) {
  return (
    <div className="rounded-2xl h-full flex flex-col items-center justify-center p-2.5 text-center gap-1"
      style={{background:`${ac}0c`,border:`2px solid ${ac}1a`,minHeight:40}}>
      <span style={{fontSize:20,lineHeight:1}}>{DUMMY.funfact.emoji}</span>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{color:ac}}>Did you know?</p>
      <p className="text-[10px] leading-snug" style={{color:"var(--pd-ink-muted)"}}>{DUMMY.funfact.text}</p>
    </div>
  );
}

function ChallengeTile({ac}:{ac:string}) {
  return (
    <div className="rounded-2xl h-full flex flex-col justify-center p-2.5 gap-1"
      style={{background:`${ac}0d`,border:`2px dashed ${ac}35`,minHeight:40}}>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{color:ac}}>
        {DUMMY.challenge.emoji} Challenge
      </p>
      <p className="text-[10px] leading-snug" style={{color:"var(--pd-ink)"}}>{DUMMY.challenge.text}</p>
    </div>
  );
}

function WordTile({ac}:{ac:string}) {
  return (
    <div className="rounded-2xl h-full flex flex-col justify-center p-2.5 gap-0.5"
      style={{background:"var(--pd-surface)",border:`2px solid ${ac}22`,minHeight:40}}>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{color:ac}}>Word</p>
      <p className="font-bold text-sm leading-none" style={{color:"var(--pd-ink)"}}>{DUMMY.word.word}</p>
      <p className="text-[9px] italic" style={{color:"var(--pd-ink-muted)"}}>{DUMMY.word.pron}</p>
      <p className="text-[10px] leading-snug mt-0.5" style={{color:"var(--pd-ink-muted)"}}>{DUMMY.word.def}</p>
    </div>
  );
}

function StatTile({ac}:{ac:string}) {
  return (
    <div className="rounded-2xl h-full flex flex-col items-center justify-center p-2.5 text-center gap-0.5"
      style={{background:`${ac}0f`,border:`2px solid ${ac}22`,minHeight:40}}>
      <span style={{fontSize:18,lineHeight:1}}>{DUMMY.stat.emoji}</span>
      <p className="text-xl font-black leading-none" style={{color:ac}}>{DUMMY.stat.number}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide" style={{color:"var(--pd-ink-muted)"}}>{DUMMY.stat.label}</p>
    </div>
  );
}

function ExtraTile({kind,ac}:{kind:ExtraKind;ac:string}) {
  switch(kind){
    case "quote":     return <QuoteTile     ac={ac}/>;
    case "funfact":   return <FunFactTile   ac={ac}/>;
    case "challenge": return <ChallengeTile ac={ac}/>;
    case "word":      return <WordTile      ac={ac}/>;
    case "stat":      return <StatTile      ac={ac}/>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PonderGrid — ALL 8 cells animated between 4 complete layout snapshots
// ─────────────────────────────────────────────────────────────────────────────

export default function PonderGrid({pieces,accentColor,ageBand,tagline}:Props) {
  const [expanded,setExpanded] = useState<string|null>(null);
  const [params,setParams]     = useState<GridParams>(DEFAULT_PARAMS);
  const isDev = process.env.NODE_ENV === "development";

  const layout = BAND_LAYOUT[ageBand];
  const chars  = CHARS[ageBand];
  const p      = [pieces[0]??null, pieces[1]??null, pieces[2]??null];

  const rawIdx = expanded === null ? -1 : p.findIndex(x => x?.id === expanded);
  const expandedIdx: 0|1|2|null = (rawIdx === 0 || rawIdx === 1 || rawIdx === 2) ? rawIdx : null;

  // Current snapshot — every cell reads its slot from here
  const snap = resolveSnapshot(layout, expandedIdx);

  const spring = {
    type:"spring" as const,
    stiffness: params.springStiffness,
    damping:   params.springDamping,
    mass:      params.springMass,
  };
  // Staggered transition helper — cell i gets a small extra delay
  const t = (i:number) => ({ ...spring, delay:(i * params.staggerMs) / 1000 });

  const toggle = (id:string) => setExpanded(prev => prev===id ? null : id);

  return (
    <>
      <div className="mondri-grid">

        {/* ── Hero ─────────────────────────────────────────── */}
        <motion.div key="hero" layout transition={t(0)}
          className="mondri-cell" style={slotStyle(snap.hero)}>
          <HeroCell tagline={tagline} accentColor={accentColor}/>
        </motion.div>

        {/* ── Chars ────────────────────────────────────────── */}
        {snap.chars.map((slot,i)=>(
          <motion.div key={`char-${i}`} layout transition={t(1+i)}
            className="mondri-cell" style={slotStyle(slot)}>
            <CharCell {...chars[i]} accentColor={accentColor}/>
          </motion.div>
        ))}

        {/* ── Extras ───────────────────────────────────────── */}
        {snap.extras.map((slot,i)=>(
          <motion.div key={`extra-${layout.extraKinds[i]}`} layout transition={t(3+i)}
            className="mondri-cell" style={slotStyle(slot)}>
            <ExtraTile kind={layout.extraKinds[i]} ac={accentColor}/>
          </motion.div>
        ))}

        {/* ── Content cards ────────────────────────────────── */}
        {snap.contents.map((slot,i)=>{
          const piece = p[i];
          const isExp = !!piece && expanded===piece.id;
          return (
            <motion.div key={piece?.id ?? `empty-c-${i}`} layout transition={t(5+i)}
              className="mondri-cell" style={slotStyle(slot)}>
              {piece
                ? <PonderCard piece={piece} index={i} isExpanded={isExp}
                    accentColor={accentColor} type={piece.contentType??"article"}
                    params={params} onToggle={()=>toggle(piece.id)}/>
                : <EmptyCell accentColor={accentColor}/>}
            </motion.div>
          );
        })}

      </div>

      {isDev && <DevOverlay params={params} onChange={setParams}/>}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static cells
// ─────────────────────────────────────────────────────────────────────────────

function HeroCell({tagline,accentColor}:{tagline:string;accentColor:string}) {
  return (
    <div className="rounded-2xl p-3 flex flex-col justify-between h-full"
      style={{background:accentColor,minHeight:60,boxShadow:`0 4px 20px ${accentColor}40`}}>
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{color:"rgba(255,255,255,0.55)"}}>
        Ponder Daily
      </p>
      <div>
        <p className="text-white font-semibold text-xs leading-snug">{tagline}</p>
        <p className="text-[9px] mt-0.5" style={{color:"rgba(255,255,255,0.5)"}}>{fmtDate(new Date())}</p>
      </div>
    </div>
  );
}

function CharCell({emoji,name,quote,accentColor}:{emoji:string;name:string;quote:string;accentColor:string}) {
  return (
    <div className="rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-1 h-full"
      style={{background:`${accentColor}0f`,border:`2px solid ${accentColor}22`,minHeight:60}}>
      <span style={{fontSize:28,lineHeight:1}}>{emoji}</span>
      <div>
        <p className="font-bold text-[11px]" style={{color:accentColor}}>{name}</p>
        <p className="text-[9px] italic leading-snug mt-0.5" style={{color:"var(--pd-ink-muted)"}}>
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}

function EmptyCell({accentColor}:{accentColor:string}) {
  return (
    <div className="rounded-2xl h-full"
      style={{background:`${accentColor}07`,border:`2px solid ${accentColor}0f`,minHeight:40}}/>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PonderCard
// ─────────────────────────────────────────────────────────────────────────────

function PonderCard({piece,index,isExpanded,accentColor,type,params,onToggle}:{
  piece:ContentPiece; index:number; isExpanded:boolean; accentColor:string;
  type:string; params:GridParams; onToggle:()=>void;
}) {
  const emoji    = piece.emoji || TOPIC_EMOJI[piece.topicCategory] || "💭";
  const typeMeta = TYPE_META[type] ?? TYPE_META.article;
  const teaser   = firstTwoSentences(piece.body);

  const [vis,setVis]   = useState(true);
  const mounted        = useRef(false);
  const timer          = useRef<ReturnType<typeof setTimeout>|null>(null);
  const jellyRef       = useRef<HTMLDivElement>(null);
  const jellyCtrl      = useAnimation();
  const spring = {
    type:"spring" as const,
    stiffness:params.springStiffness, damping:params.springDamping, mass:params.springMass,
  };

  useLayoutEffect(()=>{
    if(!mounted.current){ mounted.current=true; return; }
    if(timer.current) clearTimeout(timer.current);
    setVis(false);
    timer.current = setTimeout(()=>{
      setVis(true);
      const h = jellyRef.current?.offsetHeight ?? 200;
      const d1=4/h, d2=d1/2;
      jellyCtrl.start({
        scaleY:[1-d1,1+d1,1-d2,1+d2,1],
        scaleX:[1+d1,1-d1,1+d2,1-d2,1],
        transition:{
          scaleY:{duration:params.jelDuration*0.7,times:[0,0.2,0.45,0.72,1],ease:"easeOut"},
          scaleX:{duration:params.jelDuration*0.7,times:[0,0.2,0.45,0.72,1],ease:"easeOut"},
        },
      });
    }, params.contentHideMs);
  },[isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.article
      layout
      initial={{opacity:0, y:20, scaleY:0.9, scaleX:1.06}}
      animate={{opacity:1, y:0,
        scaleY:[0.9,1.12,0.93,1.05,0.98,1.01,1],
        scaleX:[1.06,0.92,1.05,0.97,1.02,0.99,1]}}
      exit={{opacity:0, y:-10, scaleY:0.94}}
      transition={{
        layout: spring,
        opacity:{duration:0.15},
        y:{duration:0.25, ease:[0.2,0,0.2,1] as [number,number,number,number]},
        scaleY:{duration:params.jelDuration,times:[0,0.14,0.32,0.52,0.70,0.86,1],ease:"easeOut"},
        scaleX:{duration:params.jelDuration,times:[0,0.14,0.32,0.52,0.70,0.86,1],ease:"easeOut"},
        delay: index*0.06,
      }}
      className={`rounded-2xl cursor-pointer${isExpanded?"":" h-full overflow-hidden"}`}
      style={{
        background:"var(--pd-surface)",
        border:`2px solid ${accentColor}2e`,
        boxShadow: isExpanded
          ? `0 12px 40px ${accentColor}2e, 0 0 0 1px ${accentColor}1a`
          : "0 2px 8px rgba(0,0,0,0.05)",
        transformOrigin:"bottom center",
        position:"relative",
        zIndex: isExpanded ? 10 : 1,
      }}
      onClick={()=>{ if(window.getSelection()?.toString()) return; onToggle(); }}
      role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&onToggle()}
      aria-expanded={isExpanded}
    >
      <motion.div ref={jellyRef} animate={jellyCtrl} style={{transformOrigin:"bottom center"}}>
        <div style={{opacity:vis?1:0, transition:vis?"opacity 0.14s ease":"none"}}>

          {isExpanded ? (
            /* ── Expanded ── */
            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  {type!=="article"&&typeMeta.color&&(
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{background:`${typeMeta.color}1e`,color:typeMeta.color}}>
                      {typeMeta.badge}
                    </span>
                  )}
                </div>
                <span className="text-lg font-black leading-none flex-shrink-0"
                  style={{color:accentColor,transform:"rotate(45deg)",transition:"transform 0.22s ease"}}>+</span>
              </div>
              <h2 className="font-bold text-sm leading-snug mb-2" style={{color:"var(--pd-ink)"}}>
                {piece.title} <span style={{fontWeight:400,fontSize:"1.1em"}}>{emoji}</span>
              </h2>
              <p className="text-sm leading-relaxed mb-0" style={{color:"var(--pd-ink)"}}>{piece.body}</p>
              <AnimatePresence>
                <motion.div
                  initial={{opacity:0}} animate={{opacity:1,transition:{delay:0.1,duration:0.2}}}
                  exit={{opacity:0,transition:{duration:0.1}}}>
                  <div className="mt-3">
                    <div className="h-px mb-3" style={{background:`${accentColor}2e`}}/>
                    {type==="puzzle"  ? <PuzzleContent piece={piece} accentColor={accentColor}/>
                    :type==="bio"     ? <BioContent    piece={piece} accentColor={accentColor}/>
                    :                   <Questions     piece={piece} accentColor={accentColor}/>}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* ── Collapsed — fills full height ── */
            <div className="p-2.5 h-full flex flex-col" style={{minHeight:0}}>
              <div className="flex items-center justify-between mb-1.5">
                {type!=="article"&&typeMeta.color
                  ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{background:`${typeMeta.color}1e`,color:typeMeta.color}}>
                      {typeMeta.badge}
                    </span>
                  : <span/>}
                <span className="text-base font-black leading-none" style={{color:accentColor}}>+</span>
              </div>
              <h2 className="font-bold text-xs leading-snug mb-1" style={{color:"var(--pd-ink)"}}>
                {piece.title}
              </h2>
              <p className="text-[10px] leading-relaxed flex-1 overflow-hidden"
                style={{color:"var(--pd-ink-muted)",
                  display:"-webkit-box", WebkitLineClamp:6,
                  WebkitBoxOrient:"vertical" as React.CSSProperties["WebkitBoxOrient"],
                  overflow:"hidden"}}>
                {teaser}
              </p>
              <div className="flex items-end justify-between mt-1.5 pt-1"
                style={{borderTop:`1px solid ${accentColor}18`}}>
                <span className="text-[9px] font-semibold uppercase tracking-wider"
                  style={{color:`${accentColor}99`}}>{piece.topicCategory}</span>
                <span style={{fontSize:22,lineHeight:1,opacity:0.12}}>{emoji}</span>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content renderers
// ─────────────────────────────────────────────────────────────────────────────

function Questions({piece,accentColor}:{piece:ContentPiece;accentColor:string}) {
  return (
    <div className="space-y-2.5">
      {(["Recall","Inference","Discuss"] as const).map((label,i)=>(
        <div key={label} className="flex gap-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
            style={{background:accentColor}}>{i+1}</span>
          <div>
            <p className="text-[9px] uppercase tracking-wide font-semibold mb-0.5" style={{color:accentColor}}>{label}</p>
            <p className="text-xs leading-relaxed" style={{color:"var(--pd-ink)"}}>
              {[piece.question1,piece.question2,piece.question3][i]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PuzzleContent({piece,accentColor}:{piece:ContentPiece;accentColor:string}) {
  const [revealed,setRevealed] = useState(false);
  return (
    <div className="space-y-2.5">
      <div className="rounded-xl p-2.5" style={{background:`${accentColor}0f`}}>
        <p className="font-semibold text-[9px] uppercase tracking-wide mb-1" style={{color:accentColor}}>Hint</p>
        <p className="text-xs" style={{color:"var(--pd-ink-muted)"}}>{piece.question1}</p>
      </div>
      <button onClick={e=>{e.stopPropagation();setRevealed(r=>!r);}}
        className="w-full py-1.5 rounded-xl text-xs font-bold"
        style={{background:revealed?`${accentColor}1e`:accentColor,
          color:revealed?accentColor:"#fff",border:`2px solid ${accentColor}`}}>
        {revealed?"Hide answer":"Reveal answer"}
      </button>
      <AnimatePresence>
        {revealed&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}
            exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="rounded-xl p-2.5" style={{background:"#d1fae5"}}>
              <p className="text-[9px] uppercase tracking-wide font-semibold mb-1" style={{color:"#065f46"}}>Answer</p>
              <p className="text-xs" style={{color:"#065f46"}}>{piece.question2}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BioContent({piece,accentColor}:{piece:ContentPiece;accentColor:string}) {
  return (
    <div className="space-y-2">
      {[{l:"Key fact",c:piece.question1},{l:"Why it matters",c:piece.question2},{l:"Think about it",c:piece.question3}]
        .map(({l,c},i)=>(
          <div key={l} className="rounded-xl p-2.5" style={{background:`${accentColor}${i===2?"16":"0d"}`}}>
            <p className="text-[9px] font-bold uppercase tracking-wide mb-0.5" style={{color:accentColor}}>{l}</p>
            <p className="text-xs leading-relaxed" style={{color:"var(--pd-ink)"}}>{c}</p>
          </div>
        ))}
    </div>
  );
}
