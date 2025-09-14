import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Home, MapPin, Navigation, Compass, X } from 'lucide-react';
import GeometricShapeDisplay from '@/components/geometric-shape-display';
import { getElementColor } from '@/lib/sacred-geometry';
import { Chapter } from '@shared/schema';
import {
  COMPASS_QUADRANTS,
  buildUnifiedPathPoints,
  generateSmoothPathString,
  getChapterColor,
  isGateChapter,
  generateCompassBackground,
  PathPoint,
  CompassQuadrant
} from '@/lib/matrixLayout';

interface MatrixCompassMapProps {
  chapters: Chapter[];
  completedChapters: number[];
  currentChapter: number;
  unlockedShapes: string[];
  onChapterClick: (chapter: Chapter) => void;
  newlyUnlockedShapes: Set<string>;
  onAnimationComplete: (geometryIcon: string) => void;
  previewMode?: boolean; // Disable interactions for guest preview
}

export default function MatrixCompassMap({
  chapters,
  completedChapters,
  currentChapter,
  unlockedShapes,
  onChapterClick,
  newlyUnlockedShapes,
  onAnimationComplete,
  previewMode = false
}: MatrixCompassMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1400, height: 1000 });
  const [zoom, setZoom] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);
  const [showCompassLabels, setShowCompassLabels] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  // Generate all path points for all 27 chapters using the layout engine
  const allPathPoints = useMemo(() => {
    return buildUnifiedPathPoints(chapters, viewBox.width, viewBox.height);
  }, [chapters, viewBox.width, viewBox.height]);

  // Generate compass background layers
  const compassBackground = useMemo(() => {
    return generateCompassBackground(viewBox.width, viewBox.height);
  }, [viewBox.width, viewBox.height]);

  // Generate unified path string for the complete 1→27 journey
  const unifiedPathString = useMemo(() => {
    return generateSmoothPathString(allPathPoints);
  }, [allPathPoints]);

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
  }, [currentChapter, allPathPoints]);

  // Chapter status helpers
  const isChapterCompleted = (chapterNum: number) => completedChapters.includes(chapterNum);
  const isChapterUnlocked = (chapterNum: number) => {
    const chapter = chapters.find(ch => ch.ch === chapterNum);
    return chapter && unlockedShapes.includes(chapter.geometryIcon);
  };
  const isCurrentChapter = (chapterNum: number) => chapterNum === currentChapter;

  // Pan and zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
    setViewBox(prev => ({
      x: prev.x + prev.width * 0.1,
      y: prev.y + prev.height * 0.1,
      width: prev.width * 0.8,
      height: prev.height * 0.8
    }));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
    setViewBox(prev => ({
      x: prev.x - prev.width * 0.125,
      y: prev.y - prev.height * 0.125,
      width: prev.width * 1.25,
      height: prev.height * 1.25
    }));
  };

  const handleResetView = () => {
    setZoom(1);
    setViewBox({ x: 0, y: 0, width: 1400, height: 1000 });
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (previewMode) return; // Disable dragging in preview mode
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOrigin({ x: viewBox.x, y: viewBox.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setViewBox(prev => ({
      ...prev,
      x: dragOrigin.x - deltaX * zoom,
      y: dragOrigin.y - deltaY * zoom
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Chapter click handler
  const handleChapterClick = (chapter: Chapter) => {
    if (previewMode) return; // Disable clicks in preview mode
    if (isChapterUnlocked(chapter.ch) || isChapterCompleted(chapter.ch)) {
      setSelectedChapter(chapter);
      onChapterClick(chapter);
    }
  };

  return (
    <div className="relative w-full h-full bg-background" ref={containerRef}>
      {/* Preview Mode Overlay Badge */}
      {previewMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <Badge className="bg-amber-500/90 text-black font-semibold px-4 py-2 text-sm backdrop-blur-sm shadow-lg">
            👁️ Preview Mode (Read-Only)
          </Badge>
        </div>
      )}

      {/* Control Panel - Hidden in preview mode */}
      {!previewMode && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomIn}
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomOut}
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetView}
          data-testid="button-reset-view"
        >
          <Home className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCompassLabels(!showCompassLabels)}
          data-testid="button-toggle-labels"
        >
          <Compass className="w-4 h-4" />
        </Button>
        </div>
      )}

      {/* Progress Info - Hidden in preview mode */}
      {!previewMode && (
        <div className="absolute top-4 right-4 z-10">
        <Card className="bg-background/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-sm space-y-1">
              <div>Chapter: {currentChapter}/27</div>
              <div>Completed: {completedChapters.length}/27</div>
              <div>Shapes: {unlockedShapes.length}/27</div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="svg-matrix-canvas"
      >
        <defs>
          {/* Gradients for quadrants */}
          {COMPASS_QUADRANTS.map(quadrant => (
            <radialGradient key={`gradient-${quadrant.direction}`} id={`gradient-${quadrant.direction}`}>
              <stop offset="0%" stopColor={quadrant.color} stopOpacity="0.1" />
              <stop offset="100%" stopColor={quadrant.color} stopOpacity="0.05" />
            </radialGradient>
          ))}
          
          {/* Drop shadow filter */}
          <filter id="drop-shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Compass Background Quadrants */}
        {compassBackground.quadrantBackgrounds.map(({ quadrant, path, color }) => (
          <path
            key={`bg-${quadrant.direction}`}
            d={path}
            fill={`url(#gradient-${quadrant.direction})`}
            stroke={color}
            strokeWidth="2"
            strokeOpacity="0.3"
            fillOpacity="0.1"
          />
        ))}

        {/* Hebrew Letters */}
        {showCompassLabels && compassBackground.hebrewLabels.map(({ quadrant, x, y, label }) => (
          <g key={`hebrew-${quadrant.direction}`}>
            <circle
              cx={x}
              cy={y}
              r="30"
              fill={quadrant.color}
              fillOpacity="0.2"
              stroke={quadrant.color}
              strokeWidth="2"
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="24"
              fontWeight="bold"
              fill={quadrant.color}
              filter="url(#drop-shadow)"
            >
              {label}
            </text>
            <text
              x={x}
              y={y + 45}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12"
              fill={quadrant.color}
              opacity="0.8"
            >
              {quadrant.theme}
            </text>
          </g>
        ))}

        {/* Unified Path (1→27) */}
        <path
          d={unifiedPathString}
          fill="none"
          stroke="url(#unified-gradient)"
          strokeWidth="3"
          strokeOpacity="0.6"
          strokeDasharray="5,5"
          className="animate-pulse"
        />

        {/* Quadrant Spiral Paths */}
        {COMPASS_QUADRANTS.map(quadrant => {
          const quadrantPoints = allPathPoints.filter(p => 
            p.chapter.ch >= quadrant.chapterRange[0] && p.chapter.ch <= quadrant.chapterRange[1]
          );
          if (quadrantPoints.length === 0) return null;
          
          const pathString = generateSmoothPathString(quadrantPoints);
          return (
            <path
              key={`path-${quadrant.direction}`}
              d={pathString}
              fill="none"
              stroke={quadrant.color}
              strokeWidth="2"
              strokeOpacity="0.4"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
          
          {/* Unified gradient */}
          <linearGradient id="unified-gradient">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="25%" stopColor="#74c0fc" />
            <stop offset="50%" stopColor="#51cf66" />
            <stop offset="75%" stopColor="#69db7c" />
            <stop offset="100%" stopColor="#ffd43b" />
          </linearGradient>
        </defs>

        {/* Chapter Nodes */}
        {allPathPoints.map(({ x, y, chapter }) => {
          const isCompleted = isChapterCompleted(chapter.ch);
          const isUnlocked = isChapterUnlocked(chapter.ch);
          const isCurrent = isCurrentChapter(chapter.ch);
          const isHovered = hoveredChapter === chapter.ch;
          const isGate = isGateChapter(chapter);
          const isNewlyUnlocked = newlyUnlockedShapes.has(chapter.geometryIcon);
          
          return (
            <g key={`chapter-${chapter.ch}`}>
              {/* Chapter Background Circle */}
              <circle
                cx={x}
                cy={y}
                r={isGate ? 25 : 20}
                fill={isCompleted ? getChapterColor(chapter) : (isUnlocked ? getChapterColor(chapter) : '#666666')}
                fillOpacity={isCompleted ? 0.8 : (isUnlocked ? 0.6 : 0.3)}
                stroke={isCurrent ? '#ffd43b' : getChapterColor(chapter)}
                strokeWidth={isCurrent ? 4 : 2}
                className={`transition-all duration-300 ${
                  (isUnlocked || isCompleted) ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
                }`}
                onClick={() => handleChapterClick(chapter)}
                onMouseEnter={() => setHoveredChapter(chapter.ch)}
                onMouseLeave={() => setHoveredChapter(null)}
                data-testid={`chapter-node-${chapter.ch}`}
              />
              
              {/* Geometric Shape */}
              <foreignObject
                x={x - 15}
                y={y - 15}
                width={30}
                height={30}
                className="pointer-events-none"
              >
                <div className="flex items-center justify-center w-full h-full">
                  <GeometricShapeDisplay
                    geometryIcon={chapter.geometryIcon}
                    element={chapter.element}
                    chapterNumber={chapter.ch}
                    size={24}
                    isUnlocked={isUnlocked || isCompleted}
                    isNewlyUnlocked={isNewlyUnlocked}
                    onAnimationComplete={() => onAnimationComplete && onAnimationComplete(chapter.geometryIcon)}
                  />
                </div>
              </foreignObject>
              
              {/* Chapter Number */}
              <text
                x={x}
                y={y + 35}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="12"
                fontWeight="bold"
                fill={isCompleted ? getChapterColor(chapter) : (isUnlocked ? getChapterColor(chapter) : '#666666')}
              >
                {chapter.ch}
              </text>
              
              {/* Gate Badge */}
              {isGate && (
                <text
                  x={x}
                  y={y - 35}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffd43b"
                >
                  GATE
                </text>
              )}
              
              {/* Current Chapter Indicator */}
              {isCurrent && (
                <circle
                  cx={x}
                  cy={y}
                  r="35"
                  fill="none"
                  stroke="#ffd43b"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Chapter Detail Popup */}
      <AnimatePresence>
        {selectedChapter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-4 left-4 right-4 z-20"
          >
            <Card className="bg-background/95 backdrop-blur-sm border-2 border-primary">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="mb-2">
                    Chapter {selectedChapter.ch} • {selectedChapter.element}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedChapter(null)}
                    data-testid="button-close-detail"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-bold text-lg mb-1" data-testid={`text-chapter-title-${selectedChapter.ch}`}>
                  {selectedChapter.chapterTitle}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedChapter.bookName} • {selectedChapter.bookTheme}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedChapter.geometryIcon}</Badge>
                  <Badge variant="secondary">{selectedChapter.stone}</Badge>
                  <Badge variant="secondary">{selectedChapter.templeSpace}</Badge>
                  {selectedChapter.directionalMapping && (
                    <Badge variant="destructive">{selectedChapter.directionalMapping} Gate</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}