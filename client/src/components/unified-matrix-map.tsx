import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SacredMatrixEntry, GameProgressResponse } from '@shared/schema';
import { getElementColor } from '@/lib/sacred-geometry';
import GeometricShapeDisplay from '@/components/geometric-shape-display';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Home } from 'lucide-react';

interface ChapterNode {
  id: number;
  x: number;
  y: number;
  chapter: SacredMatrixEntry;
  isUnlocked: boolean;
  isCompleted: boolean;
}

interface UnifiedMatrixMapProps {
  onChapterClick: (chapter: SacredMatrixEntry) => void;
  sacredMatrixData?: SacredMatrixEntry[];
  gameProgress?: GameProgressResponse;
}

export default function UnifiedMatrixMap({ 
  onChapterClick, 
  sacredMatrixData = [], 
  gameProgress 
}: UnifiedMatrixMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const [selectedNode, setSelectedNode] = useState<ChapterNode | null>(null);
  const { toast } = useToast();

  // Map dimensions
  const mapWidth = 1200;
  const mapHeight = 800;
  const nodeSize = 60;

  // Calculate chapter positions based on YHWH structure
  const calculateChapterPositions = (): ChapterNode[] => {
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const radius = 250;
    const nodes: ChapterNode[] = [];

    sacredMatrixData.forEach((chapter) => {
      let x = centerX;
      let y = centerY;

      if (chapter.chapterNumber >= 1 && chapter.chapterNumber <= 5) {
        // North (Fire) - Chapters 1-5 - Horizontal line at top, flowing down
        const xOffset = (chapter.chapterNumber - 3) * 80; // Center around chapter 3
        x = centerX + xOffset;
        y = centerY - radius;
      } else if (chapter.chapterNumber >= 6 && chapter.chapterNumber <= 10) {
        // East (Air) - Chapters 6-10 - Vertical line on right, flowing right
        const yOffset = (chapter.chapterNumber - 8) * 80; // Center around chapter 8
        x = centerX + radius;
        y = centerY + yOffset;
      } else if (chapter.chapterNumber >= 11 && chapter.chapterNumber <= 15) {
        // South (Water) - Chapters 11-15 - Horizontal line at bottom, flowing up
        const xOffset = (13 - chapter.chapterNumber) * 80; // Reverse order for visual flow
        x = centerX + xOffset;
        y = centerY + radius;
      } else if (chapter.chapterNumber >= 16 && chapter.chapterNumber <= 20) {
        // West (Earth) - Chapters 16-20 - Vertical line on left, flowing left
        const yOffset = (18 - chapter.chapterNumber) * 80; // Reverse order for visual flow
        x = centerX - radius;
        y = centerY + yOffset;
      } else if (chapter.chapterNumber >= 21 && chapter.chapterNumber <= 27) {
        // Center (Yeshua) - Chapters 21-27 - Spiral pattern
        const centerChapter = 24; // Middle of 21-27
        const spiralIndex = chapter.chapterNumber - 21;
        const spiralRadius = 40 + spiralIndex * 15;
        const angle = spiralIndex * (Math.PI * 2 / 3); // Spiral spacing
        x = centerX + spiralRadius * Math.cos(angle);
        y = centerY + spiralRadius * Math.sin(angle);
      }

      // Get progress state
      const completedChapters = gameProgress?.progress.completedChapters || [];
      const unlockedChapters = gameProgress?.progress.unlockedChapters || [1];
      
      nodes.push({
        id: chapter.chapterNumber,
        x,
        y,
        chapter,
        isUnlocked: unlockedChapters.includes(chapter.chapterNumber),
        isCompleted: completedChapters.includes(chapter.chapterNumber)
      });
    });

    return nodes.sort((a, b) => a.id - b.id);
  };

  // Generate connection paths between sequential chapters
  const generateConnectionPaths = (nodes: ChapterNode[]): string[] => {
    const paths: string[] = [];
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i];
      const next = nodes[i + 1];
      
      if (current && next) {
        // Create curved path between chapters
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Use quadratic curve for more natural flow
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        const controlOffset = 30;
        
        // Adjust control point based on direction for better curves
        let controlX = midX;
        let controlY = midY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          controlY += dy > 0 ? -controlOffset : controlOffset;
        } else {
          controlX += dx > 0 ? -controlOffset : controlOffset;
        }
        
        const path = `M ${current.x} ${current.y} Q ${controlX} ${controlY} ${next.x} ${next.y}`;
        paths.push(path);
      }
    }
    
    return paths;
  };

  // Initialize map and D3 zoom behavior
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = d3.select(containerRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();
    
    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    svg.call(zoom);

    // Create main group for zoomable content
    const g = svg.append('g')
      .attr('class', 'main-group');

    // Apply transform
    g.attr('transform', transform.toString());

    // Calculate nodes and connections
    const nodes = calculateChapterPositions();
    const connectionPaths = generateConnectionPaths(nodes);

    // Draw background elements
    drawBackground(g);
    
    // Draw connection paths
    drawConnections(g, connectionPaths);
    
    // Draw chapter nodes
    drawChapterNodes(g, nodes);

    // Draw directional labels
    drawDirectionalLabels(g);

    // Store zoom behavior for external controls
    (svg.node() as any).__zoom__ = zoom;

  }, [sacredMatrixData, gameProgress, transform]);

  // Draw background sacred geometry
  const drawBackground = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const radius = 250;

    // Sacred cross
    g.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY - radius - 100)
      .attr('x2', centerX)
      .attr('y2', centerY + radius + 100)
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.3);

    g.append('line')
      .attr('x1', centerX - radius - 100)
      .attr('y1', centerY)
      .attr('x2', centerX + radius + 100)
      .attr('y2', centerY)
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.3);

    // Sacred circles
    [100, 150, 200, 250].forEach((r, i) => {
      g.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', '#FFD700')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.2 - i * 0.03);
    });
  };

  // Draw connection lines between chapters
  const drawConnections = (g: d3.Selection<SVGGElement, unknown, null, undefined>, paths: string[]) => {
    g.selectAll('.connection-path')
      .data(paths)
      .enter()
      .append('path')
      .attr('class', 'connection-path')
      .attr('d', (d) => d)
      .attr('fill', 'none')
      .attr('stroke', '#4A90E2')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    const defs = g.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#4A90E2')
      .attr('opacity', 0.7);
  };

  // Draw chapter nodes
  const drawChapterNodes = (g: d3.Selection<SVGGElement, unknown, null, undefined>, nodes: ChapterNode[]) => {
    const nodeGroups = g.selectAll('.chapter-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'chapter-node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
        onChapterClick(d.chapter);
      })
      .on('mouseenter', (event, d) => {
        // Add hover effect
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', `translate(${d.x}, ${d.y}) scale(1.1)`);
      })
      .on('mouseleave', (event, d) => {
        // Remove hover effect
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('transform', `translate(${d.x}, ${d.y}) scale(1)`);
      });

    // Node background circles
    nodeGroups.append('circle')
      .attr('r', nodeSize / 2)
      .attr('fill', (d) => d.isUnlocked ? getElementColor(d.chapter.element) : '#333333')
      .attr('opacity', (d) => d.isUnlocked ? 0.2 : 0.1)
      .attr('stroke', (d) => d.isUnlocked ? getElementColor(d.chapter.element) : '#666666')
      .attr('stroke-width', 2);

    // Chapter numbers
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', nodeSize / 2 + 20)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', (d) => d.isUnlocked ? '#FFD700' : '#888888')
      .text((d) => d.id);

    // Lock/unlock indicator
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -nodeSize / 2 - 10)
      .attr('font-size', '16px')
      .attr('fill', (d) => d.isCompleted ? '#00FF00' : d.isUnlocked ? '#FFD700' : '#666666')
      .text((d) => d.isCompleted ? '✓' : d.isUnlocked ? '🔓' : '🔒');

    // Add foreign object for geometric shapes
    nodeGroups.append('foreignObject')
      .attr('x', -nodeSize / 2)
      .attr('y', -nodeSize / 2)
      .attr('width', nodeSize)
      .attr('height', nodeSize)
      .html((d) => {
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        
        // This will be replaced by React rendering in the actual implementation
        div.innerHTML = `<div class="geometric-shape-placeholder" data-chapter="${d.id}"></div>`;
        
        return div.outerHTML;
      });
  };

  // Draw directional labels
  const drawDirectionalLabels = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    const centerX = mapWidth / 2;
    const centerY = mapHeight / 2;
    const labelRadius = 300;

    const directions = [
      { text: 'YOD - NORTH\nFire • Chapters 1-5', x: centerX, y: centerY - labelRadius, color: '#FF4444' },
      { text: 'HEH - EAST\nAir • Chapters 6-10', x: centerX + labelRadius, y: centerY, color: '#4A90E2' },
      { text: 'VAV - SOUTH\nWater • Chapters 11-15', x: centerX, y: centerY + labelRadius, color: '#2ECC40' },
      { text: 'FINAL HEH - WEST\nEarth • Chapters 16-20', x: centerX - labelRadius, y: centerY, color: '#228B22' },
      { text: 'YESHUA - CENTER\nPlasma • Chapters 21-27', x: centerX, y: centerY - 100, color: '#FFD700' }
    ];

    directions.forEach((dir) => {
      const lines = dir.text.split('\n');
      const textGroup = g.append('g')
        .attr('transform', `translate(${dir.x}, ${dir.y})`);

      lines.forEach((line, i) => {
        textGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', i * 16)
          .attr('font-size', i === 0 ? '16px' : '12px')
          .attr('font-weight', i === 0 ? 'bold' : 'normal')
          .attr('fill', dir.color)
          .text(line);
      });
    });
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom__;
      if (zoom) {
        svg.transition().duration(300).call(zoom.scaleBy, 1.5);
      }
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom__;
      if (zoom) {
        svg.transition().duration(300).call(zoom.scaleBy, 0.67);
      }
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom__;
      if (zoom) {
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
      }
    }
  };

  const handleCenter = () => {
    if (svgRef.current && containerRef.current) {
      const svg = d3.select(svgRef.current);
      const zoom = (svg.node() as any).__zoom__;
      const containerRect = containerRef.current.getBoundingClientRect();
      
      if (zoom) {
        const scale = Math.min(containerRect.width / mapWidth, containerRect.height / mapHeight) * 0.8;
        const centerTransform = d3.zoomIdentity
          .translate(containerRect.width / 2, containerRect.height / 2)
          .scale(scale)
          .translate(-mapWidth / 2, -mapHeight / 2);
        
        svg.transition().duration(500).call(zoom.transform, centerTransform);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-cosmic-void overflow-hidden" ref={containerRef}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-cosmic-deep/80 border-cosmic-golden/30 text-cosmic-silver hover:bg-cosmic-golden/20"
          data-testid="button-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-cosmic-deep/80 border-cosmic-golden/30 text-cosmic-silver hover:bg-cosmic-golden/20"
          data-testid="button-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="bg-cosmic-deep/80 border-cosmic-golden/30 text-cosmic-silver hover:bg-cosmic-golden/20"
          data-testid="button-reset-zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCenter}
          className="bg-cosmic-deep/80 border-cosmic-golden/30 text-cosmic-silver hover:bg-cosmic-golden/20"
          data-testid="button-center-map"
        >
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 right-4 z-10 bg-cosmic-deep/80 border border-cosmic-golden/30 rounded-lg p-4 text-sm">
        <h4 className="font-bold text-cosmic-golden mb-2">Map Legend</h4>
        <div className="space-y-1 text-cosmic-silver">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">🔓</span>
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🔒</span>
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">→</span>
            <span>Flow Path</span>
          </div>
        </div>
      </div>

      {/* Main SVG Map */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        className="w-full h-full"
        style={{ background: 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 100%)' }}
      />

      {/* Progress Summary */}
      <div className="absolute bottom-4 left-4 z-10 bg-cosmic-deep/80 border border-cosmic-golden/30 rounded-lg p-4">
        <div className="text-cosmic-golden font-bold text-lg">
          {gameProgress?.progress.totalChaptersCompleted || 0}/27 Chapters
        </div>
        <div className="text-cosmic-silver text-sm">
          Level {gameProgress?.user.level || 1} • {gameProgress?.user.experiencePoints || 0} XP
        </div>
      </div>
    </div>
  );
}