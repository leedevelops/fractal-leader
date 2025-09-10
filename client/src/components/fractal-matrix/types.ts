// FractalMatrix TypeScript definitions

export type FMId = string;
export type FMNodeKind = "Hub" | "Chapter" | "Stone" | "Tribe" | "Prophet" | "Apostle" | "Frequency" | "Book" | "Dimension";

export interface FMNode {
  id: FMId;
  kind: FMNodeKind;
  label: string;
  element?: "Fire" | "Air" | "Water" | "Earth" | "Spirit";
  chapter?: number;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface FMEdge {
  id?: FMId;
  source: FMId;
  target: FMId;
  relation?: "PropheticApostolic" | "ElementalCycle" | "TribeRepeat" | "AxisLink" | "Default";
  weight?: number;
  metadata?: Record<string, any>;
}

export interface FMData {
  nodes: FMNode[];
  edges: FMEdge[];
}

export interface Theme {
  background: string;
  nodeColors: {
    Hub: string;
    Chapter: string;
    Stone: string;
    Tribe: string;
    Prophet: string;
    Apostle: string;
    Frequency: string;
    Book: string;
    Dimension: string;
  };
  edgeColor: string;
  textColor: string;
  highlightColor: string;
}

export interface FractalMatrixProps {
  data: FMData;
  theme?: Partial<Theme>;
  width?: number;
  height?: number;
  initialFocus?: string | FMNodeKind;
  mysteryMode?: boolean;
  enableAudio?: boolean;
  sacredOverlays?: FMNodeKind[];
  fractalDimensions?: Array<{ name: string; layers: string[] }>;
  onSelect?: (id: FMId, node?: FMNode) => void;
  onExport?: (data: { png: string; svg: string; json: string; url: string }) => void;
}

export interface LayoutNode {
  id: FMId;
  x: number;
  y: number;
  r: number;
  kind: FMNodeKind;
}

export interface LayoutResult {
  nodes: Map<FMId, LayoutNode>;
  hub: { x: number; y: number; r: number };
  rings: Array<{ nodes: LayoutNode[]; radius: number }>;
}

export const ELEMENT_COLORS = {
  Fire: "#ff6b6b",
  Air: "#74c0fc",
  Water: "#69db7c",
  Earth: "#ffd43b",
  Spirit: "#da77f2"
} as const;

export const DEFAULT_THEME: Theme = {
  background: "#0a0a0a",
  nodeColors: {
    Hub: "#ffd43b",
    Chapter: "#74c0fc",
    Stone: "#69db7c",
    Tribe: "#ff6b6b",
    Prophet: "#da77f2",
    Apostle: "#fd7e14",
    Frequency: "#20c997",
    Book: "#6f42c1",
    Dimension: "#e83e8c"
  },
  edgeColor: "#495057",
  textColor: "#f8f9fa",
  highlightColor: "#ffd43b"
};
