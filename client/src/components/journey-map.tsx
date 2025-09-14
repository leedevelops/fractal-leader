import { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ZoomIn, ZoomOut, Home, MapPin, Navigation } from 'lucide-react';
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

interface JourneyMapProps {
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
}

// Generate spiral path for 27 chapters (outside to inside)
function generateSpiralPath(width: number, height: number, chapters: number): PathPoint[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.45; // Slightly larger spiral
  const minRadius = 60; // Minimum radius for center chapters to avoid cramping
  const turns = 3.5; // Fewer turns for better spacing
  const points: PathPoint[] = [];

  for (let i = 0; i < chapters; i++) {
    const t = i / (chapters - 1); // Progress from 0 to 1
    const angle = t * turns * 2 * Math.PI;
    
    // Better radius distribution: keep minimum space in center
    const radiusRange = maxRadius - minRadius;
    const radius = maxRadius - (t * radiusRange); // Start from outside, spiral inward with min radius
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    points.push({
      x,
      y,
      angle,
      distance: radius
    });
  }

  return points;
}

// Generate winding river path for variety
function generateRiverPath(width: number, height: number, chapters: number): PathPoint[] {
  const points: PathPoint[] = [];
  const startX = width * 0.1;
  const startY = height * 0.8;
  const endX = width * 0.9;
  const endY = height * 0.2;

  for (let i = 0; i < chapters; i++) {
    const t = i / (chapters - 1);
    
    // Base linear progression
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;
    
    // Add river-like curves
    const waveAmplitude = width * 0.15;
    const waveFrequency = 3;
    const offsetX = Math.sin(t * waveFrequency * Math.PI) * waveAmplitude * (1 - t * 0.5);
    const offsetY = Math.cos(t * waveFrequency * Math.PI * 0.7) * height * 0.05;
    
    points.push({
      x: baseX + offsetX,
      y: baseY + offsetY,
      angle: Math.atan2(endY - startY, endX - startX),
      distance: t * Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
    });
  }

  return points;
}

// Generate mountain path (ascending with switchbacks)
function generateMountainPath(width: number, height: number, chapters: number): PathPoint[] {
  const points: PathPoint[] = [];
  const baseY = height * 0.9;
  const peakY = height * 0.1;
  const pathWidth = width * 0.8;
  const startX = width * 0.1;

  for (let i = 0; i < chapters; i++) {
    const t = i / (chapters - 1);
    
    // Vertical progression (going up the mountain)
    const y = baseY - (baseY - peakY) * t;
    
    // Switchback horizontal movement
    const switchbacks = 6;
    const switchbackT = (t * switchbacks) % 1;
    const switchbackDir = Math.floor(t * switchbacks) % 2 === 0 ? 1 : -1;
    const x = startX + (switchbackDir > 0 ? switchbackT : (1 - switchbackT)) * pathWidth;
    
    points.push({
      x,
      y,
      angle: switchbackDir > 0 ? 0 : Math.PI,
      distance: t * height
    });
  }

  return points;
}

export default function JourneyMap({
  chapters,
  completedChapters,
  currentChapter,
  unlockedShapes,
  onChapterClick,
  newlyUnlockedShapes,
  onAnimationComplete
}: JourneyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [pathType, setPathType] = useState<'spiral' | 'river' | 'mountain'>('spiral');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  // Generate path points based on selected path type
  const pathPoints = useMemo(() => {
    const width = viewBox.width;
    const height = viewBox.height;
    
    switch (pathType) {
      case 'river':
        return generateRiverPath(width, height, 27);
      case 'mountain':
        return generateMountainPath(width, height, 27);
      case 'spiral':
      default:
        return generateSpiralPath(width, height, 27);
    }
  }, [pathType, viewBox]);

  // Generate smooth path for rendering
  const pathString = useMemo(() => {
    if (pathPoints.length < 2) return '';
    
    const line = d3.line<PathPoint>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    return line(pathPoints) || '';
  }, [pathPoints]);

  // Auto-focus on current chapter (only on initial load)
  useEffect(() => {
    if (currentChapter && pathPoints.length > 0) {
      const chapterIndex = currentChapter - 1;
      const point = pathPoints[chapterIndex];
      if (point) {
        // Center view on current chapter (only if not already centered)
        const currentCenterX = viewBox.x + viewBox.width / 2;
        const currentCenterY = viewBox.y + viewBox.height / 2;
        const distance = Math.sqrt((point.x - currentCenterX) ** 2 + (point.y - currentCenterY) ** 2);
        
        // Only pan if we're far away (avoid constant updates)
        if (distance > 100) {
          const newX = point.x - viewBox.width / 2;
          const newY = point.y - viewBox.height / 2;
          setViewBox(prev => ({ ...prev, x: newX, y: newY }));
        }
      }
    }
  }, [currentChapter]); // Remove pathPoints from dependencies to prevent loop

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
    setViewBox({ x: 0, y: 0, width: 1200, height: 800 });
  };

  // Pan to chapter
  const panToChapter = (chapterNum: number) => {
    const point = pathPoints[chapterNum - 1];
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
    <div className="w-full h-full flex flex-col bg-cosmic-deep" data-testid="journey-map">
      {/* Journey Controls */}
      <div className="flex items-center justify-between p-4 bg-cosmic-deep/80 backdrop-blur border-b border-cosmic-golden/20">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-cosmic-golden">Leadership Journey</h2>
          <Progress value={progressPercentage} className="w-32" />
          <span className="text-sm text-cosmic-silver">{progressPercentage}% Complete</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Path Type Selector */}
          <div className="flex bg-cosmic-void/50 rounded-md p-1">
            {(['spiral', 'river', 'mountain'] as const).map((type) => (
              <Button
                key={type}
                variant={pathType === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setPathType(type)}
                className="capitalize"
                data-testid={`path-type-${type}`}
              >
                {type}
              </Button>
            ))}
          </div>
          
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

      {/* Journey Map */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
          data-testid="journey-svg"
        >
          {/* Background */}
          <defs>
            <radialGradient id="cosmicBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a0a0f" />
              <stop offset="100%" stopColor="#050507" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#cosmicBg)" />
          
          {/* Journey Path */}
          <path
            d={pathString}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="4"
            strokeDasharray="10,5"
            opacity="0.6"
            filter="url(#glow)"
          />
          
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd43b" />
              <stop offset="50%" stopColor="#74c0fc" />
              <stop offset="100%" stopColor="#51cf66" />
            </linearGradient>
          </defs>

          {/* Chapter Nodes */}
          {chapters.map((chapter, index) => {
            const point = pathPoints[index];
            if (!point) return null;

            const completed = isChapterCompleted(chapter.ch);
            const unlocked = isChapterUnlocked(chapter.ch);
            const current = isCurrentChapter(chapter.ch);
            const next = isNextChapter(chapter.ch);
            const elementColor = getElementColor(chapter.element);

            return (
              <g key={chapter.ch} transform={`translate(${point.x}, ${point.y})`}>
                {/* Chapter Circle Background */}
                <circle
                  r={current ? 25 : next ? 20 : 15}
                  fill={completed ? elementColor : unlocked ? elementColor + '80' : '#333'}
                  stroke={current ? '#ffd43b' : next ? '#74c0fc' : elementColor}
                  strokeWidth={current ? 3 : 2}
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
                  fontSize={current ? "14" : "12"}
                  fontWeight="bold"
                  fill={completed || unlocked ? "#fff" : "#666"}
                  className="pointer-events-none"
                >
                  {chapter.ch}
                </text>

                {/* Current Chapter Indicator */}
                {current && (
                  <circle
                    r="35"
                    fill="none"
                    stroke="#ffd43b"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.8"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0;360"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Geometric Shape */}
                {unlocked && (
                  <g transform="translate(20, -20)">
                    <GeometricShapeDisplay
                      geometryIcon={chapter.geometryIcon}
                      element={chapter.element}
                      isUnlocked={unlocked}
                      chapterNumber={chapter.ch}
                      size={30}
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
                x={pathPoints[hoveredChapter - 1]?.x + 30}
                y={pathPoints[hoveredChapter - 1]?.y - 50}
                width="300"
                height="120"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-cosmic-void/90 border-cosmic-golden/30 backdrop-blur">
                    <CardContent className="p-3">
                      <h4 className="text-sm font-bold text-cosmic-golden mb-1">
                        Chapter {hoveredChapter}
                      </h4>
                      <p className="text-xs text-cosmic-silver mb-2">
                        {chapters[hoveredChapter - 1]?.chapterTitle}
                      </p>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {chapters[hoveredChapter - 1]?.element}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chapters[hoveredChapter - 1]?.bookName}
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

      {/* Legend */}
      <div className="p-4 bg-cosmic-deep/80 backdrop-blur border-t border-cosmic-golden/20">
        <div className="flex items-center justify-center gap-6 text-sm">
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
      </div>
    </div>
  );
}