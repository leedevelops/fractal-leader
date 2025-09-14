import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ZoomIn, ZoomOut, Home, MapPin, Navigation, Compass } from 'lucide-react';
import GeometricShapeDisplay from '@/components/geometric-shape-display';
import { getElementColor } from '@/lib/sacred-geometry';

interface Chapter {
  ch: number;
  book: string;
  divineName: string;
  bookName: string;
  bookTheme: string;
  chapterTitle: string;
  geometryIcon: string;
  stone: string;
  element: string;
  templeSpace: string;
  storyStage: string;
  dimension: string;
  fractalGate: string;
  spiritualFrequency: string;
  bookColor: string;
  tribe: string;
  prophet: string;
  prophet2: string;
  apostle: string;
  directionalMapping: string;
}

interface UnifiedCompassMapProps {
  chapters: Chapter[];
  completedChapters: number[];
  currentChapter: number;
  unlockedShapes: string[];
  onChapterClick: (chapter: Chapter) => void;
  newlyUnlockedShapes: Set<string>;
  onAnimationComplete: (geometryIcon: string) => void;
}

interface PathPoint {
  x: number;
  y: number;
  angle: number;
  distance: number;
  chapter: Chapter;
}

interface CompassQuadrant {
  name: string;
  hebrewLetter: string;
  direction: string;
  chapterRange: [number, number];
  element: string;
  color: string;
  position: { centerX: number; centerY: number; width: number; height: number };
  theme: string;
}

// YHWH Compass Quadrant Definitions
const COMPASS_QUADRANTS: CompassQuadrant[] = [
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

// Generate spiral path within a quadrant
function generateQuadrantSpiral(
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

export default function UnifiedCompassSpiralMap({
  chapters,
  completedChapters,
  currentChapter,
  unlockedShapes,
  onChapterClick,
  newlyUnlockedShapes,
  onAnimationComplete
}: UnifiedCompassMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1400, height: 1000 });
  const [zoom, setZoom] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);
  const [showCompassLabels, setShowCompassLabels] = useState(true);

  // Generate all path points for all quadrants
  const allPathPoints = useMemo(() => {
    const allPoints: PathPoint[] = [];
    
    COMPASS_QUADRANTS.forEach(quadrant => {
      const quadrantPoints = generateQuadrantSpiral(
        quadrant, 
        chapters, 
        viewBox.width, 
        viewBox.height
      );
      allPoints.push(...quadrantPoints);
    });
    
    return allPoints;
  }, [chapters, viewBox]);

  // Group path points by quadrant for rendering paths
  const quadrantPaths = useMemo(() => {
    const paths: { [key: string]: PathPoint[] } = {};
    
    COMPASS_QUADRANTS.forEach(quadrant => {
      paths[quadrant.direction] = generateQuadrantSpiral(
        quadrant, 
        chapters, 
        viewBox.width, 
        viewBox.height
      );
    });
    
    return paths;
  }, [chapters, viewBox]);

  // Auto-focus on current chapter
  useEffect(() => {
    if (currentChapter && allPathPoints.length > 0) {
      const currentPoint = allPathPoints.find(p => p.chapter.ch === currentChapter);
      if (currentPoint) {
        const currentCenterX = viewBox.x + viewBox.width / 2;
        const currentCenterY = viewBox.y + viewBox.height / 2;
        const distance = Math.sqrt((currentPoint.x - currentCenterX) ** 2 + (currentPoint.y - currentCenterY) ** 2);
        
        if (distance > 150) {
          const newX = currentPoint.x - viewBox.width / 2;
          const newY = currentPoint.y - viewBox.height / 2;
          setViewBox(prev => ({ ...prev, x: newX, y: newY }));
        }
      }
    }
  }, [currentChapter]);

  // Chapter status helpers
  const isChapterCompleted = (chapterNum: number) => completedChapters.includes(chapterNum);
  const isChapterUnlocked = (chapterNum: number) => {
    const chapter = chapters.find(ch => ch.ch === chapterNum);
    return chapter && unlockedShapes.includes(chapter.geometryIcon);
  };
  const isCurrentChapter = (chapterNum: number) => chapterNum === currentChapter;
  const isNextChapter = (chapterNum: number) => chapterNum === currentChapter + 1;

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 4));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.25));
  const handleResetView = () => {
    setZoom(1);
    setViewBox({ x: 0, y: 0, width: 1400, height: 1000 });
  };

  // Pan to chapter
  const panToChapter = (chapterNum: number) => {
    const point = allPathPoints.find(p => p.chapter.ch === chapterNum);
    if (point) {
      setViewBox(prev => ({
        ...prev,
        x: point.x - prev.width / 2,
        y: point.y - prev.height / 2
      }));
    }
  };

  // Progress calculation
  const progressPercentage = Math.round((completedChapters.length / 27) * 100);

  return (
    <div className="w-full h-full flex flex-col bg-cosmic-deep" data-testid="unified-compass-map">
      {/* Compass Controls */}
      <div className="flex items-center justify-between p-4 bg-cosmic-deep/80 backdrop-blur border-b border-cosmic-golden/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-cosmic-golden" />
            <h2 className="text-xl font-bold text-cosmic-golden">YHWH Leadership Compass</h2>
          </div>
          <Progress value={progressPercentage} className="w-32" />
          <span className="text-sm text-cosmic-silver">{progressPercentage}% Complete</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Compass Options */}
          <Button
            variant={showCompassLabels ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompassLabels(!showCompassLabels)}
            data-testid="toggle-compass-labels"
          >
            Hebrew Letters
          </Button>
          
          {/* Navigation Controls */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleZoomOut} data-testid="zoom-out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn} data-testid="zoom-in">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView} data-testid="reset-view">
              <Home className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => panToChapter(currentChapter)}
              data-testid="pan-to-current"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Unified Compass Map */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
          data-testid="compass-svg"
        >
          {/* Background & Definitions */}
          <defs>
            <radialGradient id="cosmicBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0a0f" />
              <stop offset="70%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#050507" />
            </radialGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            <filter id="hebrewGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Gradient for each element */}
            <radialGradient id="fireGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.1"/>
            </radialGradient>
            
            <radialGradient id="airGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#74c0fc" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#74c0fc" stopOpacity="0.1"/>
            </radialGradient>
            
            <radialGradient id="waterGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#51cf66" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#51cf66" stopOpacity="0.1"/>
            </radialGradient>
            
            <radialGradient id="earthGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#69db7c" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#69db7c" stopOpacity="0.1"/>
            </radialGradient>
            
            <radialGradient id="plasmaGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd43b" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#ffd43b" stopOpacity="0.1"/>
            </radialGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#cosmicBg)" />
          
          {/* Compass Rose Background */}
          <g opacity="0.1">
            <circle 
              cx={viewBox.width * 0.5} 
              cy={viewBox.height * 0.5} 
              r={Math.min(viewBox.width, viewBox.height) * 0.45}
              fill="none"
              stroke="#ffd43b"
              strokeWidth="2"
              strokeDasharray="20,10"
            />
            
            {/* Cardinal direction lines */}
            <line x1={viewBox.width * 0.5} y1={viewBox.height * 0.1} x2={viewBox.width * 0.5} y2={viewBox.height * 0.9} stroke="#ffd43b" strokeWidth="1" opacity="0.3"/>
            <line x1={viewBox.width * 0.1} y1={viewBox.height * 0.5} x2={viewBox.width * 0.9} y2={viewBox.height * 0.5} stroke="#ffd43b" strokeWidth="1" opacity="0.3"/>
          </g>

          {/* Quadrant Background Areas */}
          {COMPASS_QUADRANTS.map((quadrant) => {
            const { position } = quadrant;
            const x = (position.centerX - position.width/2) * viewBox.width;
            const y = (position.centerY - position.height/2) * viewBox.height;
            const width = position.width * viewBox.width;
            const height = position.height * viewBox.height;
            
            let fillId = 'fireGradient';
            switch(quadrant.element) {
              case 'Fire': fillId = 'fireGradient'; break;
              case 'Air': fillId = 'airGradient'; break;
              case 'Water': fillId = 'waterGradient'; break;
              case 'Earth': fillId = 'earthGradient'; break;
              case 'Plasma': fillId = 'plasmaGradient'; break;
            }
            
            return (
              <rect
                key={quadrant.direction}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`url(#${fillId})`}
                rx="20"
                stroke={quadrant.color}
                strokeWidth="2"
                strokeOpacity="0.3"
                data-testid={`quadrant-${quadrant.direction.toLowerCase()}`}
              />
            );
          })}

          {/* Spiral Paths for Each Quadrant */}
          {Object.entries(quadrantPaths).map(([direction, points]) => {
            if (points.length < 2) return null;
            
            const line = d3.line<PathPoint>()
              .x(d => d.x)
              .y(d => d.y)
              .curve(d3.curveCatmullRom.alpha(0.5));
              
            const pathString = line(points);
            const quadrant = COMPASS_QUADRANTS.find(q => q.direction === direction);
            
            return pathString ? (
              <path
                key={direction}
                d={pathString}
                fill="none"
                stroke={quadrant?.color || '#ffd43b'}
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.6"
                filter="url(#glow)"
                data-testid={`path-${direction.toLowerCase()}`}
              />
            ) : null;
          })}

          {/* Hebrew Letters and Direction Labels */}
          {showCompassLabels && COMPASS_QUADRANTS.map((quadrant) => {
            const centerX = quadrant.position.centerX * viewBox.width;
            const centerY = quadrant.position.centerY * viewBox.height;
            
            // Position Hebrew letter at the edge of each quadrant
            let labelX = centerX;
            let labelY = centerY;
            const offset = 80;
            
            switch(quadrant.direction) {
              case 'North': labelY -= offset; break;
              case 'East': labelX += offset; break;
              case 'South': labelY += offset; break;
              case 'West': labelX -= offset; break;
              case 'Center': break; // No offset for center
            }
            
            return (
              <g key={quadrant.direction} data-testid={`hebrew-label-${quadrant.direction.toLowerCase()}`}>
                {/* Hebrew Letter */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="48"
                  fontWeight="bold"
                  fill={quadrant.color}
                  filter="url(#hebrewGlow)"
                  className="select-none"
                >
                  {quadrant.hebrewLetter}
                </text>
                
                {/* Direction Label */}
                {quadrant.direction !== 'Center' && (
                  <text
                    x={labelX}
                    y={labelY + 35}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#ffd43b"
                    className="select-none"
                  >
                    {quadrant.direction.toUpperCase()}
                  </text>
                )}
                
                {/* Theme Label */}
                <text
                  x={labelX}
                  y={labelY + (quadrant.direction === 'Center' ? 35 : 50)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="#ffffff"
                  opacity="0.8"
                  className="select-none"
                >
                  {quadrant.theme}
                </text>
              </g>
            );
          })}

          {/* Chapter Nodes */}
          {allPathPoints.map((point) => {
            const chapter = point.chapter;
            const completed = isChapterCompleted(chapter.ch);
            const unlocked = isChapterUnlocked(chapter.ch);
            const current = isCurrentChapter(chapter.ch);
            const next = isNextChapter(chapter.ch);
            const elementColor = getElementColor(chapter.element);

            return (
              <g key={chapter.ch} transform={`translate(${point.x}, ${point.y})`}>
                {/* Chapter Circle Background */}
                <circle
                  r={current ? 28 : next ? 22 : 18}
                  fill={completed ? elementColor : unlocked ? elementColor + '80' : '#333'}
                  stroke={current ? '#ffd43b' : next ? '#74c0fc' : elementColor}
                  strokeWidth={current ? 4 : 3}
                  className={`cursor-pointer transition-all duration-300 ${
                    unlocked ? 'hover:scale-110' : 'cursor-not-allowed'
                  }`}
                  onClick={() => unlocked && onChapterClick(chapter)}
                  onMouseEnter={() => setHoveredChapter(chapter.ch)}
                  onMouseLeave={() => setHoveredChapter(null)}
                  data-testid={`chapter-node-${chapter.ch}`}
                />

                {/* Chapter Number */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize={current ? "16" : "14"}
                  fontWeight="bold"
                  fill={completed || unlocked ? "#fff" : "#666"}
                  className="pointer-events-none"
                >
                  {chapter.ch}
                </text>

                {/* Current Chapter Indicator */}
                {current && (
                  <circle
                    r="40"
                    fill="none"
                    stroke="#ffd43b"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0;360"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Geometric Shape */}
                {unlocked && (
                  <g transform="translate(25, -25)">
                    <GeometricShapeDisplay
                      geometryIcon={chapter.geometryIcon}
                      element={chapter.element}
                      isUnlocked={unlocked}
                      chapterNumber={chapter.ch}
                      size={35}
                      isNewlyUnlocked={newlyUnlockedShapes.has(chapter.geometryIcon)}
                      onAnimationComplete={() => onAnimationComplete(chapter.geometryIcon)}
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Chapter Tooltip */}
          <AnimatePresence>
            {hoveredChapter && (
              <foreignObject
                x={allPathPoints.find(p => p.chapter.ch === hoveredChapter)?.x + 40}
                y={allPathPoints.find(p => p.chapter.ch === hoveredChapter)?.y - 60}
                width="320"
                height="140"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-cosmic-void/90 border-cosmic-golden/30 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-cosmic-golden">
                          Chapter {hoveredChapter}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {chapters.find(ch => ch.ch === hoveredChapter)?.divineName}
                        </Badge>
                      </div>
                      <p className="text-xs text-cosmic-silver mb-2">
                        {chapters.find(ch => ch.ch === hoveredChapter)?.chapterTitle}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {chapters.find(ch => ch.ch === hoveredChapter)?.element}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chapters.find(ch => ch.ch === hoveredChapter)?.geometryIcon}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chapters.find(ch => ch.ch === hoveredChapter)?.bookName}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </foreignObject>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Compass Legend */}
      <div className="p-4 bg-cosmic-deep/80 backdrop-blur border-t border-cosmic-golden/20">
        <div className="flex items-center justify-between">
          {/* Status Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-cosmic-silver">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-cosmic-golden bg-cosmic-golden/20" />
              <span className="text-cosmic-silver">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-400/20" />
              <span className="text-cosmic-silver">Next</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-600" />
              <span className="text-cosmic-silver">Locked</span>
            </div>
          </div>
          
          {/* Element Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-cosmic-silver">Fire</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-400" />
              <span className="text-cosmic-silver">Air</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-cosmic-silver">Water</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-600" />
              <span className="text-cosmic-silver">Earth</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400" />
              <span className="text-cosmic-silver">Plasma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}