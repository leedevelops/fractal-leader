import { Chapter } from '@shared/schema';

export interface PathPoint {
  x: number;
  y: number;
  angle: number;
  distance: number;
  chapter: Chapter;
}

export interface CompassQuadrant {
  name: string;
  hebrewLetter: string;
  direction: string;
  chapterRange: [number, number];
  element: string;
  color: string;
  position: { centerX: number; centerY: number; width: number; height: number };
  theme: string;
}

// YHWH Compass Quadrant Definitions with proper directional mappings
export const COMPASS_QUADRANTS: CompassQuadrant[] = [
  {
    name: 'Yod',
    hebrewLetter: 'י',
    direction: 'North',
    chapterRange: [1, 5],
    element: 'Fire',
    color: '#ff6b6b',
    position: { centerX: 0.5, centerY: 0.2, width: 0.4, height: 0.35 },
    theme: 'Becoming Rooted'
  },
  {
    name: 'Heh',
    hebrewLetter: 'ה',
    direction: 'East',
    chapterRange: [6, 10],
    element: 'Air',
    color: '#74c0fc',
    position: { centerX: 0.8, centerY: 0.5, width: 0.35, height: 0.4 },
    theme: 'Becoming Aligned'
  },
  {
    name: 'Vav',
    hebrewLetter: 'ו',
    direction: 'South',
    chapterRange: [11, 15],
    element: 'Water',
    color: '#51cf66',
    position: { centerX: 0.5, centerY: 0.8, width: 0.4, height: 0.35 },
    theme: 'Becoming Clear'
  },
  {
    name: 'Final Heh',
    hebrewLetter: 'ה',
    direction: 'West',
    chapterRange: [16, 20],
    element: 'Earth',
    color: '#69db7c',
    position: { centerX: 0.2, centerY: 0.5, width: 0.35, height: 0.4 },
    theme: 'Becoming Embodied'
  },
  {
    name: 'YESHUA',
    hebrewLetter: 'ישוע',
    direction: 'Center',
    chapterRange: [21, 27],
    element: 'Plasma',
    color: '#ffd43b',
    position: { centerX: 0.5, centerY: 0.5, width: 0.3, height: 0.3 },
    theme: 'The Pattern Manifesto'
  }
];

/**
 * Compute the compass quadrants with normalized positions
 * Returns quadrant definitions for the YHWH structure
 */
export function computeCompassQuadrants(): CompassQuadrant[] {
  return COMPASS_QUADRANTS;
}

/**
 * Generate spiral path within a specific quadrant (outside-to-inside)
 */
export function generateQuadrantSpiral(
  quadrant: CompassQuadrant, 
  chapters: Chapter[],
  canvasWidth: number,
  canvasHeight: number
): PathPoint[] {
  const { position } = quadrant;
  const [startCh, endCh] = quadrant.chapterRange;
  
  // Get chapters for this quadrant
  const quadrantChapters = chapters.filter(ch => ch.ch >= startCh && ch.ch <= endCh);
  const chapterCount = quadrantChapters.length;
  
  if (chapterCount === 0) return [];
  
  // Calculate actual pixel positions
  const centerX = position.centerX * canvasWidth;
  const centerY = position.centerY * canvasHeight;
  const maxRadius = Math.min(position.width * canvasWidth, position.height * canvasHeight) * 0.4;
  const minRadius = 30;
  
  const points: PathPoint[] = [];
  const turns = 2; // Number of spiral turns within quadrant
  
  for (let i = 0; i < chapterCount; i++) {
    const t = i / Math.max(chapterCount - 1, 1); // Progress from 0 to 1
    const angle = t * turns * 2 * Math.PI;
    
    // Start from outside, spiral inward
    const radiusRange = maxRadius - minRadius;
    const radius = maxRadius - (t * radiusRange);
    
    // Apply directional offset based on quadrant
    let directionOffset = 0;
    switch (quadrant.direction) {
      case 'North': directionOffset = -Math.PI/2; break; // Top
      case 'East': directionOffset = 0; break;           // Right
      case 'South': directionOffset = Math.PI/2; break;  // Bottom
      case 'West': directionOffset = Math.PI; break;     // Left
      case 'Center': directionOffset = 0; break;         // No offset
    }
    
    const finalAngle = angle + directionOffset;
    const x = centerX + radius * Math.cos(finalAngle);
    const y = centerY + radius * Math.sin(finalAngle);
    
    points.push({
      x,
      y,
      angle: finalAngle,
      distance: radius,
      chapter: quadrantChapters[i]
    });
  }
  
  return points;
}

/**
 * Build unified path points for all 27 chapters across all quadrants
 */
export function buildUnifiedPathPoints(
  chapters: Chapter[],
  canvasWidth: number,
  canvasHeight: number
): PathPoint[] {
  const allPoints: PathPoint[] = [];
  
  // Generate points for each quadrant in order
  COMPASS_QUADRANTS.forEach(quadrant => {
    const quadrantPoints = generateQuadrantSpiral(
      quadrant, 
      chapters, 
      canvasWidth, 
      canvasHeight
    );
    allPoints.push(...quadrantPoints);
  });
  
  // Sort by chapter number to ensure correct 1-27 order
  return allPoints.sort((a, b) => a.chapter.ch - b.chapter.ch);
}

/**
 * Generate smooth path string for SVG path element
 */
export function generateSmoothPathString(points: PathPoint[]): string {
  if (points.length < 2) return '';
  
  let pathString = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const current = points[i];
    const previous = points[i - 1];
    
    // Use quadratic curves for smooth connections
    if (i === points.length - 1) {
      // Last point - straight line
      pathString += ` L ${current.x} ${current.y}`;
    } else {
      // Control point between current and next
      const next = points[i + 1];
      const controlX = current.x;
      const controlY = current.y;
      const nextX = next.x;
      const nextY = next.y;
      
      pathString += ` Q ${controlX} ${controlY} ${(current.x + nextX) / 2} ${(current.y + nextY) / 2}`;
    }
  }
  
  return pathString;
}

/**
 * Get quadrant by chapter number
 */
export function getQuadrantByChapter(chapterNumber: number): CompassQuadrant | null {
  return COMPASS_QUADRANTS.find(quadrant => 
    chapterNumber >= quadrant.chapterRange[0] && chapterNumber <= quadrant.chapterRange[1]
  ) || null;
}

/**
 * Calculate view box bounds to center on a specific chapter
 */
export function calculateViewBoxForChapter(
  chapterNumber: number,
  allPoints: PathPoint[],
  viewBoxWidth: number,
  viewBoxHeight: number
): { x: number; y: number; width: number; height: number } {
  const point = allPoints.find(p => p.chapter.ch === chapterNumber);
  
  if (!point) {
    return { x: 0, y: 0, width: viewBoxWidth, height: viewBoxHeight };
  }
  
  return {
    x: point.x - viewBoxWidth / 2,
    y: point.y - viewBoxHeight / 2,
    width: viewBoxWidth,
    height: viewBoxHeight
  };
}

/**
 * Get chapter color based on its element/quadrant
 */
export function getChapterColor(chapter: Chapter): string {
  const quadrant = getQuadrantByChapter(chapter.ch);
  return quadrant?.color || '#666666';
}

/**
 * Check if chapter is a gate chapter (has directionalMapping)
 */
export function isGateChapter(chapter: Chapter): boolean {
  return chapter.directionalMapping !== '' && chapter.directionalMapping !== null;
}

/**
 * Get gate chapters (those with directional mappings)
 */
export function getGateChapters(chapters: Chapter[]): Chapter[] {
  return chapters.filter(isGateChapter);
}

/**
 * Generate compass background layers for SVG
 */
export function generateCompassBackground(
  canvasWidth: number,
  canvasHeight: number
): {
  quadrantBackgrounds: Array<{
    quadrant: CompassQuadrant;
    path: string;
    color: string;
  }>;
  hebrewLabels: Array<{
    quadrant: CompassQuadrant;
    x: number;
    y: number;
    label: string;
  }>;
} {
  const quadrantBackgrounds = COMPASS_QUADRANTS.map(quadrant => {
    const { position } = quadrant;
    const x = (position.centerX - position.width / 2) * canvasWidth;
    const y = (position.centerY - position.height / 2) * canvasHeight;
    const width = position.width * canvasWidth;
    const height = position.height * canvasHeight;
    
    // Create rounded rectangle path
    const radius = 20;
    const path = `
      M ${x + radius} ${y}
      H ${x + width - radius}
      Q ${x + width} ${y} ${x + width} ${y + radius}
      V ${y + height - radius}
      Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
      H ${x + radius}
      Q ${x} ${y + height} ${x} ${y + height - radius}
      V ${y + radius}
      Q ${x} ${y} ${x + radius} ${y}
      Z
    `;
    
    return {
      quadrant,
      path,
      color: quadrant.color
    };
  });
  
  const hebrewLabels = COMPASS_QUADRANTS.map(quadrant => {
    const { position } = quadrant;
    
    return {
      quadrant,
      x: position.centerX * canvasWidth,
      y: position.centerY * canvasHeight - 50, // Above the quadrant center
      label: quadrant.hebrewLetter
    };
  });
  
  return {
    quadrantBackgrounds,
    hebrewLabels
  };
}