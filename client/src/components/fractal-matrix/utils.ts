import { FMData, FMNode, FMEdge, FMNodeKind, FMId, LayoutResult, LayoutNode, Theme, ELEMENT_COLORS } from "./types";
import { RefObject, useEffect, useState } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Core utilities
// ──────────────────────────────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

export const elementColor = (theme: Theme, element?: string): string => {
  if (!element) return theme.nodeColors.Hub;
  return ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] || theme.nodeColors.Hub;
};

export const constructThemeVars = (theme: Theme): string => {
  return JSON.stringify({
    '--fm-bg': theme.background,
    '--fm-text': theme.textColor,
    '--fm-edge': theme.edgeColor,
    '--fm-highlight': theme.highlightColor,
    ...Object.entries(theme.nodeColors).reduce((acc, [kind, color]) => {
      acc[`--fm-${kind.toLowerCase()}`] = color;
      return acc;
    }, {} as Record<string, string>)
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Data processing
// ──────────────────────────────────────────────────────────────────────────────

export const ensurePlaceholders = (dimensions?: Array<{ name: string; layers: string[] }>): Array<{ name: string; layers: string[] }> => {
  const defaults = [
    { name: "Genesis", layers: ["Hub", "Chapter", "Stone", "Tribe"] },
    { name: "Exodus", layers: ["Prophet", "Apostle"] },
    { name: "Leviticus", layers: ["Frequency", "Book"] },
    { name: "Numbers", layers: ["Dimension"] }
  ];
  
  return dimensions && dimensions.length > 0 ? dimensions : defaults;
};

export const normalizeData = (data: FMData, dimensions: Array<{ name: string; layers: string[] }>): FMData => {
  const nodes = [...data.nodes];
  const edges = [...data.edges];
  
  // Ensure we have at least one node of each kind
  const nodeKinds = new Set(nodes.map(n => n.kind));
  const allKinds: FMNodeKind[] = ["Hub", "Chapter", "Stone", "Tribe", "Prophet", "Apostle", "Frequency", "Book", "Dimension"];
  
  allKinds.forEach((kind, index) => {
    if (!nodeKinds.has(kind)) {
      nodes.push({
        id: `${kind.toLowerCase()}-placeholder-${index}`,
        kind,
        label: `${kind}*`,
        element: index % 2 === 0 ? "Fire" : "Water"
      });
    }
  });
  
  return { nodes, edges };
};

export const generateInferredEdges = (
  data: FMData, 
  dimensions: Array<{ name: string; layers: string[] }>,
  rules: { tribeRepeat: boolean; prophApos: boolean; elemCycle: boolean; axisLink: boolean }
): FMEdge[] => {
  const edges: FMEdge[] = [];
  
  if (rules.tribeRepeat) {
    edges.push(...findRepeatingTribeAcrossChapters(data).toEdges());
  }
  
  if (rules.prophApos) {
    edges.push(...findPropheticPairs(data).toEdges());
  }
  
  if (rules.elemCycle) {
    edges.push(...findElementalCycles(data).toEdges());
  }
  
  if (rules.axisLink) {
    edges.push(...findBookDimensionCrossings(data).toEdges());
  }
  
  return edges.map((edge, index) => ({
    ...edge,
    id: edge.id || `inferred-${index}`
  }));
};

// ──────────────────────────────────────────────────────────────────────────────
// Pattern recognition
// ──────────────────────────────────────────────────────────────────────────────

class PatternSet {
  private nodeIds: Set<FMId> = new Set();
  
  add(nodeId: FMId) {
    this.nodeIds.add(nodeId);
  }
  
  has(nodeId: FMId): boolean {
    return this.nodeIds.has(nodeId);
  }
  
  toEdges(): FMEdge[] {
    const ids = Array.from(this.nodeIds);
    const edges: FMEdge[] = [];
    
    for (let i = 0; i < ids.length - 1; i++) {
      edges.push({
        source: ids[i],
        target: ids[i + 1],
        relation: "Default"
      });
    }
    
    return edges;
  }
}

export const findRepeatingTribeAcrossChapters = (data: FMData): PatternSet => {
  const pattern = new PatternSet();
  const tribesByLabel = new Map<string, FMId[]>();
  
  data.nodes
    .filter(n => n.kind === "Tribe")
    .forEach(node => {
      const key = node.label.replace(/\*/g, '');
      if (!tribesByLabel.has(key)) tribesByLabel.set(key, []);
      tribesByLabel.get(key)!.push(node.id);
    });
  
  tribesByLabel.forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => pattern.add(id));
    }
  });
  
  return pattern;
};

export const findPropheticPairs = (data: FMData): PatternSet => {
  const pattern = new PatternSet();
  const prophets = data.nodes.filter(n => n.kind === "Prophet");
  const apostles = data.nodes.filter(n => n.kind === "Apostle");
  
  prophets.forEach(prophet => {
    const matchingApostle = apostles.find(apostle => 
      apostle.element === prophet.element || 
      apostle.chapter === prophet.chapter
    );
    
    if (matchingApostle) {
      pattern.add(prophet.id);
      pattern.add(matchingApostle.id);
    }
  });
  
  return pattern;
};

export const findElementalCycles = (data: FMData): PatternSet => {
  const pattern = new PatternSet();
  const elements = ["Fire", "Air", "Water", "Earth", "Spirit"];
  
  elements.forEach(element => {
    const elementNodes = data.nodes.filter(n => n.element === element);
    if (elementNodes.length >= 3) {
      elementNodes.forEach(node => pattern.add(node.id));
    }
  });
  
  return pattern;
};

export const findBookDimensionCrossings = (data: FMData): PatternSet => {
  const pattern = new PatternSet();
  const books = data.nodes.filter(n => n.kind === "Book");
  const dimensions = data.nodes.filter(n => n.kind === "Dimension");
  
  books.forEach(book => {
    const relatedDimension = dimensions.find(dim => 
      dim.label.includes(book.label.substring(0, 3)) ||
      book.label.includes(dim.label.substring(0, 3))
    );
    
    if (relatedDimension) {
      pattern.add(book.id);
      pattern.add(relatedDimension.id);
    }
  });
  
  return pattern;
};

// ──────────────────────────────────────────────────────────────────────────────
// Layout system
// ──────────────────────────────────────────────────────────────────────────────

export const layoutRings = (nodes: FMNode[], width: number, height: number): LayoutResult => {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;
  
  const nodesByKind = new Map<FMNodeKind, FMNode[]>();
  nodes.forEach(node => {
    if (!nodesByKind.has(node.kind)) nodesByKind.set(node.kind, []);
    nodesByKind.get(node.kind)!.push(node);
  });
  
  const layoutNodes = new Map<FMId, LayoutNode>();
  const rings: Array<{ nodes: LayoutNode[]; radius: number }> = [];
  
  // Hub at center
  const hubNodes = nodesByKind.get("Hub") || [];
  if (hubNodes.length > 0) {
    const hub = hubNodes[0];
    layoutNodes.set(hub.id, {
      id: hub.id,
      x: centerX,
      y: centerY,
      r: 12,
      kind: hub.kind
    });
  }
  
  // Arrange other kinds in rings
  const ringKinds: FMNodeKind[] = ["Chapter", "Stone", "Tribe", "Prophet", "Apostle", "Frequency", "Book", "Dimension"];
  
  ringKinds.forEach((kind, ringIndex) => {
    const kindNodes = nodesByKind.get(kind) || [];
    if (kindNodes.length === 0) return;
    
    const radius = (maxRadius / ringKinds.length) * (ringIndex + 1);
    const angleStep = 360 / kindNodes.length;
    const ringLayoutNodes: LayoutNode[] = [];
    
    kindNodes.forEach((node, nodeIndex) => {
      const angle = nodeIndex * angleStep;
      const pos = polarToCartesian(centerX, centerY, radius, angle);
      
      const layoutNode: LayoutNode = {
        id: node.id,
        x: pos.x,
        y: pos.y,
        r: 8,
        kind: node.kind
      };
      
      layoutNodes.set(node.id, layoutNode);
      ringLayoutNodes.push(layoutNode);
    });
    
    rings.push({ nodes: ringLayoutNodes, radius });
  });
  
  return {
    nodes: layoutNodes,
    hub: { x: centerX, y: centerY, r: 12 },
    rings
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Sacred overlays
// ──────────────────────────────────────────────────────────────────────────────

export const buildSacredOverlay = (kind: FMNodeKind, width: number, height: number): string => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  switch (kind) {
    case "Hub":
      return `<circle cx="${centerX}" cy="${centerY}" r="20" fill="none" stroke="gold" stroke-width="2" opacity="0.3" />`;
    case "Chapter":
      return `<polygon points="${centerX-30},${centerY-30} ${centerX+30},${centerY-30} ${centerX},${centerY+30}" fill="none" stroke="silver" stroke-width="1" opacity="0.2" />`;
    default:
      return "";
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Export utilities
// ──────────────────────────────────────────────────────────────────────────────

export const toSVGString = (svgElement: SVGSVGElement): string => {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
};

export const toPNGFromSVG = async (svgElement: SVGSVGElement, width: number, height: number): Promise<string> => {
  const svgString = toSVGString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = width;
  canvas.height = height;
  
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = url;
  });
};

export const toJSONWithState = (state: any): string => {
  return JSON.stringify(state, null, 2);
};

export const buildShareURL = async (jsonData: string): Promise<string> => {
  // In a real implementation, this would upload to a service and return a URL
  return `data:application/json;base64,${btoa(jsonData)}`;
};

// ──────────────────────────────────────────────────────────────────────────────
// React hooks
// ──────────────────────────────────────────────────────────────────────────────

export const useResizeObserver = (
  ref: RefObject<HTMLElement>,
  callback: (width: number, height: number) => void
) => {
  useEffect(() => {
    if (!ref.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        callback(width, height);
      }
    });
    
    resizeObserver.observe(ref.current);
    
    return () => resizeObserver.disconnect();
  }, [ref, callback]);
};

// ──────────────────────────────────────────────────────────────────────────────
// Debug utilities
// ──────────────────────────────────────────────────────────────────────────────

export const emitDebug = (event: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[FractalMatrix] ${event}:`, data);
  }
};
