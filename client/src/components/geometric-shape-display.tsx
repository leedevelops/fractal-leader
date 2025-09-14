import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { geometryPatterns, getElementColor } from '@/lib/sacred-geometry';

interface GeometricShapeDisplayProps {
  geometryIcon: string;
  element: string;
  isUnlocked: boolean;
  chapterNumber: number;
  size?: number;
  className?: string;
  onClick?: () => void;
  isNewlyUnlocked?: boolean;
  onAnimationComplete?: () => void;
}

export default function GeometricShapeDisplay({
  geometryIcon,
  element,
  isUnlocked,
  chapterNumber,
  size = 60,
  className = "",
  onClick,
  isNewlyUnlocked = false,
  onAnimationComplete
}: GeometricShapeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUnlockEffect, setShowUnlockEffect] = useState(false);

  // Handle unlock animation trigger
  useEffect(() => {
    if (isNewlyUnlocked && !isAnimating) {
      setIsAnimating(true);
      setShowUnlockEffect(true);
      
      // Complete animation after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowUnlockEffect(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 2000); // 2 second animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isNewlyUnlocked, isAnimating, onAnimationComplete]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const baseColor = getElementColor(element);
    
    // Apply visual styling based on unlock status
    const color = isUnlocked ? baseColor : '#666666'; // Grayscale for locked
    const opacity = isUnlocked ? 1 : 0.4; // Reduced opacity for locked
    
    // Get the pattern function for this geometry
    const pattern = geometryPatterns[geometryIcon];
    
    if (pattern) {
      pattern(svg, size, size, color);
    } else {
      // Fallback to simple circle if pattern not found
      const radius = size * 0.2;
      svg.append('circle')
        .attr('cx', size / 2)
        .attr('cy', size / 2)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2);
    }
    
    // Apply opacity to all elements
    svg.selectAll('*').attr('opacity', opacity);
    
    // Enhanced glow effect for unlocked shapes
    if (isUnlocked) {
      const glowIntensity = isAnimating ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.8))' : 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.4))';
      svg.style('filter', glowIntensity);
    }
    
    // Unlock animation with D3 transitions
    if (isAnimating && isUnlocked) {
      // Scale pulse animation
      svg.selectAll('*')
        .transition()
        .duration(500)
        .attr('transform', 'scale(1.2)')
        .transition()
        .duration(500)
        .attr('transform', 'scale(1)')
        .transition()
        .duration(500)
        .attr('transform', 'scale(1.1)')
        .transition()
        .duration(500)
        .attr('transform', 'scale(1)');
      
      // Color intensity pulsing
      const pulseColor = d3.interpolate('#666666', baseColor);
      svg.selectAll('*')
        .transition()
        .duration(1000)
        .attrTween('stroke', () => (t) => pulseColor(t))
        .attrTween('fill', () => (t) => pulseColor(t));
    }
    
  }, [geometryIcon, element, isUnlocked, size, isAnimating]);

  return (
    <div 
      className={`relative cursor-pointer transition-all duration-300 hover:scale-110 ${className} ${
        isAnimating ? 'animate-unlock-celebration' : ''
      } ${
        showUnlockEffect ? 'unlock-effect-active' : ''
      }`}
      onClick={onClick}
      data-testid={`geometric-shape-${chapterNumber}`}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className={`${
          isUnlocked && !isAnimating ? 'animate-pulse-slow' : ''
        } ${
          isAnimating ? 'animate-unlock-scale' : ''
        }`}
        viewBox={`0 0 ${size} ${size}`}
      />
      
      {/* Unlock sparkle effect */}
      {showUnlockEffect && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-unlock-sparkle absolute top-0 left-0 w-2 h-2 bg-cosmic-golden rounded-full opacity-0" />
          <div className="animate-unlock-sparkle absolute top-2 right-1 w-1 h-1 bg-cosmic-golden rounded-full opacity-0" style={{animationDelay: '0.2s'}} />
          <div className="animate-unlock-sparkle absolute bottom-1 left-2 w-1.5 h-1.5 bg-cosmic-golden rounded-full opacity-0" style={{animationDelay: '0.4s'}} />
          <div className="animate-unlock-sparkle absolute bottom-0 right-0 w-1 h-1 bg-cosmic-golden rounded-full opacity-0" style={{animationDelay: '0.6s'}} />
        </div>
      )}
      
      {/* Chapter number overlay */}
      <div className="absolute -bottom-1 -right-1 bg-cosmic-deep border border-cosmic-golden/50 rounded-full w-5 h-5 flex items-center justify-center">
        <span className="text-xs font-bold text-cosmic-golden">{chapterNumber}</span>
      </div>
      
      {/* Lock/unlock indicator */}
      <div className="absolute -top-1 -right-1">
        {isUnlocked ? (
          <div className="w-4 h-4 bg-cosmic-golden rounded-full flex items-center justify-center">
            <span className="text-xs text-cosmic-deep">✓</span>
          </div>
        ) : (
          <div className="w-4 h-4 bg-cosmic-silver/50 rounded-full flex items-center justify-center">
            <span className="text-xs text-cosmic-deep">🔒</span>
          </div>
        )}
      </div>
    </div>
  );
}