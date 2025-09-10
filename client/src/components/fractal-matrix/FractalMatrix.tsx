import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FMData, FMEdge, FMId, FMNode, FMNodeKind, FractalMatrixProps,
  Theme, DEFAULT_THEME
} from "./types";
import {
  clamp,
  constructThemeVars,
  ensurePlaceholders,
  normalizeData,
  generateInferredEdges,
  layoutRings,
  polarToCartesian,
  elementColor,
  buildSacredOverlay,
  toSVGString,
  toPNGFromSVG,
  toJSONWithState,
  buildShareURL,
  useResizeObserver,
  findRepeatingTribeAcrossChapters,
  findPropheticPairs,
  findElementalCycles,
  findBookDimensionCrossings,
  emitDebug
} from "./utils";
import "./styles.css";

// ──────────────────────────────────────────────────────────────────────────────
// FractalMatrix — main component
// Performance posture: SVG for small/medium graphs; auto-canvas planned stub
// ──────────────────────────────────────────────────────────────────────────────

const EDGE_CANVAS_THRESHOLD = 2000;

const LAYERS_ORDER: FMNodeKind[] = [
  "Hub", "Chapter", "Stone", "Tribe", "Prophet", "Apostle", "Frequency", "Book", "Dimension"
];

type FilterState = {
  kinds: Set<FMNodeKind>;
  elements: Set<string>;
  tribes: Set<string>;
  prophets: Set<string>;
  apostles: Set<string>;
  frequencies: Set<string>;
  books: Set<string>;
  dimensions: Set<string>;
  mode: "AND" | "OR";
};

const DEFAULT_FILTERS: FilterState = {
  kinds: new Set(), elements: new Set(), tribes: new Set(), prophets: new Set(), apostles: new Set(),
  frequencies: new Set(), books: new Set(), dimensions: new Set(), mode: "OR"
};

const mysteryMask = (label: string, revealed: boolean) => 
  revealed ? label : "•".repeat(Math.min(8, Math.max(3, label.length)));

export default function FractalMatrix(props: FractalMatrixProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number, h: number }>({ 
    w: props.width ?? 900, 
    h: props.height ?? 600 
  });
  
  useResizeObserver(outerRef, (w, h) => setSize({ w, h }));

  // Theme
  const theme: Theme = useMemo(() => ({ ...DEFAULT_THEME, ...props.theme }), [props.theme]);

  // Normalize inputs & placeholders
  const dims = useMemo(() => ensurePlaceholders(props.fractalDimensions), [props.fractalDimensions]);
  const baseData = useMemo(() => normalizeData(props.data, dims), [props.data, dims]);

  // Inferred edges (toggleable via internal UI)
  const [inferRules, setInferRules] = useState<{
    tribeRepeat: boolean; 
    prophApos: boolean; 
    elemCycle: boolean; 
    axisLink: boolean;
  }>({
    tribeRepeat: true, 
    prophApos: true, 
    elemCycle: true, 
    axisLink: true
  });
  
  const data: FMData = useMemo(() => ({
    nodes: baseData.nodes,
    edges: [...baseData.edges, ...generateInferredEdges(baseData, dims, inferRules)]
  }), [baseData, dims, inferRules]);

  // Layout (polar + de-overlap)
  const layout = useMemo(() => layoutRings(data.nodes, size.w, size.h), [data.nodes, size]);

  // Filters, selection, focus
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<FMId | null>(
    typeof props.initialFocus === "string" && props.initialFocus.includes(":") 
      ? props.initialFocus as FMId 
      : null
  );
  const [focusKind, setFocusKind] = useState<FMNodeKind | null>(
    typeof props.initialFocus === "string" && !props.initialFocus.includes(":") 
      ? props.initialFocus as FMNodeKind 
      : null
  );
  const [mysteryProgress, setMysteryProgress] = useState<number>(0);
  const [revealed, setRevealed] = useState<Set<FMId>>(new Set());

  // Pattern recognition (heat overlays)
  const patternSets = useMemo(() => {
    const tribe = findRepeatingTribeAcrossChapters(data);
    const pairs = findPropheticPairs(data);
    const cycles = findElementalCycles(data);
    const crossings = findBookDimensionCrossings(data);
    return { tribe, pairs, cycles, crossings };
  }, [data]);

  // Derived maps
  const nodeById = useMemo(() => new Map(data.nodes.map(n => [n.id, n])), [data.nodes]);
  const edgesByNode = useMemo(() => {
    const m = new Map<FMId, FMEdge[]>();
    data.edges.forEach(e => {
      if (!m.has(e.source)) m.set(e.source, []);
      if (!m.has(e.target)) m.set(e.target, []);
      m.get(e.source)!.push(e);
      m.get(e.target)!.push(e);
    });
    return m;
  }, [data.edges]);

  // Accessibility: keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { 
        setSelectedId(null); 
        setFocusKind(null); 
        return; 
      }
      if (e.key === "/") { 
        e.preventDefault(); 
        const el = document.getElementById("fm-search-input"); 
        el?.focus(); 
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        const idx = focusKind ? LAYERS_ORDER.indexOf(focusKind) : 0;
        const next = LAYERS_ORDER[clamp(idx + dir, 0, LAYERS_ORDER.length - 1)];
        setFocusKind(next);
        emitDebug("focus:layer", next);
      }
      if (e.key === "Enter" && focusKind) {
        const first = data.nodes.find(n => n.kind === focusKind);
        if (first) select(first.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusKind, data.nodes]);

  // Mystery mode progress
  useEffect(() => {
    if (!props.mysteryMode) return;
    const totalRevealable = data.nodes.length;
    setMysteryProgress(Math.round((revealed.size / Math.max(1, totalRevealable)) * 100));
  }, [revealed, data.nodes, props.mysteryMode]);

  // Selection
  const select = (id: FMId) => {
    setSelectedId(id);
    const node = nodeById.get(id) || undefined;
    if (props.mysteryMode && node) {
      const next = new Set(revealed); 
      next.add(id); 
      setRevealed(next);
    }
    props.onSelect?.(id, node);
    emitDebug("select:node", { id, node });
  };

  // Filter predicate
  const visibleNode = (n: FMNode) => {
    const checks: boolean[] = [];
    if (filters.kinds.size) checks.push(filters.kinds.has(n.kind));
    if (n.element && filters.elements.size) checks.push(filters.elements.has(n.element));
    if (filters.tribes.size && n.kind === "Tribe") checks.push(filters.tribes.has(n.label));
    if (filters.prophets.size && n.kind === "Prophet") checks.push(filters.prophets.has(n.label));
    if (filters.apostles.size && n.kind === "Apostle") checks.push(filters.apostles.has(n.label));
    if (filters.frequencies.size && n.kind === "Frequency") checks.push(filters.frequencies.has(n.label));
    if (filters.books.size && n.kind === "Book") checks.push(filters.books.has(n.label));
    if (filters.dimensions.size && n.kind === "Dimension") checks.push(filters.dimensions.has(n.label));
    if (checks.length === 0) return true;
    return filters.mode === "AND" ? checks.every(Boolean) : checks.some(Boolean);
  };

  // Determine renderer mode
  const useCanvas = data.edges.length >= EDGE_CANVAS_THRESHOLD;

  // Export handlers
  const handleExport = async () => {
    if (!svgRef.current) return;
    const svg = toSVGString(svgRef.current);
    const png = await toPNGFromSVG(svgRef.current, size.w, size.h);
    const json = toJSONWithState({ data, filters, inferRules, focusKind, selectedId, mystery: props.mysteryMode });
    const url = await buildShareURL(json);
    props.onExport?.({ png, svg, json, url });
  };

  // Audio (hover/select)
  const audioRef = useRef<{ ctx: AudioContext | null, mute: boolean }>({ ctx: null, mute: false });
  useEffect(() => {
    if (!props.enableAudio) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioRef.current.ctx = ctx;
    return () => {
      ctx.close();
    };
  }, [props.enableAudio]);

  const playHoverTone = (n: FMNode) => {
    if (!props.enableAudio || audioRef.current.mute) return;
    const ctx = audioRef.current.ctx; 
    if (!ctx) return;
    const o = ctx.createOscillator(); 
    const g = ctx.createGain();
    o.type = "sine"; 
    const base = 220;
    const mult = n.element === "Fire" ? 1.0 : n.element === "Air" ? 1.25 : n.element === "Water" ? 1.5 : n.element === "Earth" ? 2.0 : 2.5;
    o.frequency.value = base * mult;
    g.gain.value = 0.0001; 
    o.connect(g); 
    g.connect(ctx.destination); 
    o.start();
    g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.55);
  };

  // Tooltip state
  const [tip, setTip] = useState<{ x: number, y: number, content: string } | null>(null);

  // Render helpers
  const renderEdgesSVG = () => (
    <g className="fm-edges" aria-hidden>
      {data.edges.map((e, i) => {
        const s = layout.nodes.get(e.source); 
        const t = layout.nodes.get(e.target);
        if (!s || !t) return null;
        const dx = t.x - s.x, dy = t.y - s.y; 
        const mx = s.x + dx / 2, my = s.y + dy / 2;
        const path = `M ${s.x},${s.y} Q ${mx},${my} ${t.x},${t.y}`;
        const isPA = e.relation === "PropheticApostolic";
        return (
          <path 
            key={e.id || i} 
            d={path} 
            className={"fm-edge " + (isPA ? "fm-edge-dashed" : "")} 
            strokeOpacity={0.35} 
          />
        );
      })}
    </g>
  );

  const renderNodesSVG = () => (
    <g className="fm-nodes">
      {data.nodes.filter(visibleNode).map(n => {
        const p = layout.nodes.get(n.id); 
        if (!p) return null;
        const isSel = selectedId === n.id; 
        const color = elementColor(theme, n.element);
        const label = props.mysteryMode ? mysteryMask(n.label, revealed.has(n.id) || isSel) : n.label;
        return (
          <g key={n.id}
            role="button" 
            tabIndex={0} 
            aria-label={`${n.kind} ${n.label}`}
            className={"fm-node fm-kind-" + n.kind.toLowerCase()}
            onMouseEnter={(e) => { 
              setTip({ x: e.clientX, y: e.clientY, content: `${n.label} • ${n.kind}` }); 
              playHoverTone(n); 
            }}
            onMouseLeave={() => setTip(null)}
            onClick={() => select(n.id)}
          >
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={isSel ? 10 : 6} 
              fill={color} 
              className={n.label.endsWith("*") ? "fm-node-placeholder" : ""} 
            />
            {(!props.mysteryMode || revealed.has(n.id) || isSel) && (
              <text x={p.x + 10} y={p.y + 4} className="fm-label">{label}</text>
            )}
            {/* Heat overlays */}
            {(patternSets.tribe.has(n.id) || patternSets.pairs.has(n.id) || patternSets.cycles.has(n.id) || patternSets.crossings.has(n.id)) && (
              <circle cx={p.x} cy={p.y} r={isSel ? 16 : 12} className="fm-heat" />
            )}
          </g>
        );
      })}
    </g>
  );

  const hub = layout.hub;

  return (
    <div 
      ref={outerRef} 
      className="fm-root" 
      style={{
        width: props.width ? props.width : undefined, 
        height: props.height ? props.height : undefined
      }} 
      data-theme-vars={constructThemeVars(theme)}
    >
      {/* Toolbar */}
      <div className="fm-toolbar">
        <div className="fm-left">
          <button className="fm-btn" onClick={() => setFocusKind(null)}>Reset Focus</button>
          <button className="fm-btn" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset Filters</button>
          <label className="fm-check">
            <input 
              type="checkbox" 
              checked={inferRules.tribeRepeat} 
              onChange={e => setInferRules({ ...inferRules, tribeRepeat: e.target.checked })}
            /> 
            TribeRepeat
          </label>
          <label className="fm-check">
            <input 
              type="checkbox" 
              checked={inferRules.prophApos} 
              onChange={e => setInferRules({ ...inferRules, prophApos: e.target.checked })}
            /> 
            Prophetic↔Apostolic
          </label>
          <label className="fm-check">
            <input 
              type="checkbox" 
              checked={inferRules.elemCycle} 
              onChange={e => setInferRules({ ...inferRules, elemCycle: e.target.checked })}
            /> 
            ElementCycle
          </label>
          <label className="fm-check">
            <input 
              type="checkbox" 
              checked={inferRules.axisLink} 
              onChange={e => setInferRules({ ...inferRules, axisLink: e.target.checked })}
            /> 
            AxisLink
          </label>
          <button className="fm-btn" onClick={handleExport}>Export</button>
        </div>
        <div className="fm-right">
          {props.mysteryMode && (
            <div className="fm-meter" aria-label="Discovery progress">
              <div style={{ width: `${mysteryProgress}%` }} />
            </div>
          )}
          <input 
            id="fm-search-input" 
            className="fm-search" 
            placeholder="Search labels… (/)"
          />
        </div>
      </div>

      {/* Main Stage */}
      <svg 
        ref={svgRef} 
        className="fm-stage" 
        viewBox={`0 0 ${size.w} ${size.h}`} 
        role="img" 
        aria-label="Fractal Matrix"
      >
        {/* Background starfield via CSS; sacred overlays */}
        {props.sacredOverlays?.map((kind, i) => (
          <g key={i} className="fm-sacred">
            <g dangerouslySetInnerHTML={{ __html: buildSacredOverlay(kind, size.w, size.h) }} />
          </g>
        ))}

        {/* Edges */}
        {renderEdgesSVG()}

        {/* Nodes */}
        {renderNodesSVG()}
      </svg>

      {/* Tooltip */}
      {tip && (
        <div 
          className="fm-tooltip" 
          style={{ 
            left: tip.x + 10, 
            top: tip.y - 30 
          }}
        >
          {tip.content}
        </div>
      )}
    </div>
  );
}