import * as d3 from 'd3';

/**
 * Biblical pattern visualization functions based on Hebrew letter framework
 */

export interface GeometryPattern {
  name: string;
  element: string;
  color: string;
  frequency: string;
  draw: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number) => void;
}

/**
 * Get color based on element
 */
export function getElementColor(element: string): string {
  switch (element.toLowerCase()) {
    case 'fire': return '#FF4444'; // Red
    case 'air': return '#4A90E2'; // Blue  
    case 'water': return '#2ECC40'; // Teal/Green
    case 'earth': return '#228B22'; // Green
    case 'plasma': return '#FFD700'; // Gold
    default: return '#888888'; // Gray fallback
  }
}

/**
 * Draw biblical geometry patterns
 */
export const geometryPatterns: Record<string, (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number, color: string) => void> = {
  'Square': (svg, width, height, color) => {
    const size = Math.min(width, height) * 0.4;
    const x = width / 2 - size / 2;
    const y = height / 2 - size / 2;
    
    svg.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', size)
      .attr('height', size)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  'Equilateral Triangle': (svg, width, height, color) => {
    const size = Math.min(width, height) * 0.4;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const points = [
      [centerX, centerY - size/2],
      [centerX - size/2 * Math.cos(Math.PI/6), centerY + size/2 * Math.sin(Math.PI/6)],
      [centerX + size/2 * Math.cos(Math.PI/6), centerY + size/2 * Math.sin(Math.PI/6)]
    ];
    
    svg.append('polygon')
      .attr('points', points.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  '2D Spiral': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.3;
    
    const spiralPath = d3.path();
    const turns = 3;
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * 2 * Math.PI;
      const radius = t * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        spiralPath.moveTo(x, y);
      } else {
        spiralPath.lineTo(x, y);
      }
    }
    
    svg.append('path')
      .attr('d', spiralPath.toString())
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  'Isometric Cube': (svg, width, height, color) => {
    const size = Math.min(width, height) * 0.25;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Front face
    const frontPoints = [
      [centerX - size/2, centerY - size/2],
      [centerX + size/2, centerY - size/2],
      [centerX + size/2, centerY + size/2],
      [centerX - size/2, centerY + size/2]
    ];
    
    // Back face (offset for isometric view)
    const offset = size * 0.3;
    const backPoints = [
      [centerX - size/2 + offset, centerY - size/2 - offset],
      [centerX + size/2 + offset, centerY - size/2 - offset],
      [centerX + size/2 + offset, centerY + size/2 - offset],
      [centerX - size/2 + offset, centerY + size/2 - offset]
    ];
    
    // Draw back face
    svg.append('polygon')
      .attr('points', backPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    
    // Draw front face
    svg.append('polygon')
      .attr('points', frontPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Connect corners
    for (let i = 0; i < 4; i++) {
      svg.append('line')
        .attr('x1', frontPoints[i][0])
        .attr('y1', frontPoints[i][1])
        .attr('x2', backPoints[i][0])
        .attr('y2', backPoints[i][1])
        .attr('stroke', color)
        .attr('stroke-width', 1);
    }
  },

  'Fibonacci Spiral': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;
    
    // Generate fibonacci sequence for spiral
    const fib = [1, 1];
    for (let i = 2; i < 10; i++) {
      fib[i] = fib[i-1] + fib[i-2];
    }
    
    const spiralPath = d3.path();
    let currentX = centerX;
    let currentY = centerY;
    let currentAngle = 0;
    
    for (let i = 0; i < 8; i++) {
      const radius = (fib[i] / fib[7]) * maxRadius;
      const startAngle = currentAngle;
      const endAngle = currentAngle + Math.PI / 2;
      
      // Draw quarter circle arc
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(startAngle)
        .endAngle(endAngle);
      
      if (i === 0) {
        spiralPath.moveTo(centerX + radius, centerY);
      }
      
      // Approximate arc with line segments
      const steps = 20;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const angle = startAngle + (endAngle - startAngle) * t;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0 && j === 0) {
          spiralPath.moveTo(x, y);
        } else {
          spiralPath.lineTo(x, y);
        }
      }
      
      currentAngle = endAngle;
    }
    
    svg.append('path')
      .attr('d', spiralPath.toString())
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  'Star of David': (svg, width, height, color) => {
    const size = Math.min(width, height) * 0.35;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // First triangle (pointing up)
    const triangle1Points = [
      [centerX, centerY - size/2],
      [centerX - size/2 * Math.cos(Math.PI/6), centerY + size/2 * Math.sin(Math.PI/6)],
      [centerX + size/2 * Math.cos(Math.PI/6), centerY + size/2 * Math.sin(Math.PI/6)]
    ];
    
    // Second triangle (pointing down)  
    const triangle2Points = [
      [centerX, centerY + size/2],
      [centerX - size/2 * Math.cos(Math.PI/6), centerY - size/2 * Math.sin(Math.PI/6)],
      [centerX + size/2 * Math.cos(Math.PI/6), centerY - size/2 * Math.sin(Math.PI/6)]
    ];
    
    svg.append('polygon')
      .attr('points', triangle1Points.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    svg.append('polygon')
      .attr('points', triangle2Points.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  'Flower of Life': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.1;
    
    // Central circle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1);
    
    // Six surrounding circles
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1);
    }
    
    // Outer ring of 12 circles
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const distance = radius * Math.sqrt(3);
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      
      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.7);
    }
  },

  'Metatron Cube': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.15;
    
    // 13 circles arranged in Metatron's Cube pattern
    const positions = [
      [0, 0], // center
      [0, -radius*2], [0, radius*2], // vertical
      [-radius*Math.sqrt(3), -radius], [-radius*Math.sqrt(3), radius], // left
      [radius*Math.sqrt(3), -radius], [radius*Math.sqrt(3), radius], // right
      [-radius*Math.sqrt(3)/2, -radius*3/2], [-radius*Math.sqrt(3)/2, radius*3/2], // outer left
      [radius*Math.sqrt(3)/2, -radius*3/2], [radius*Math.sqrt(3)/2, radius*3/2], // outer right
      [-radius*Math.sqrt(3), 0], [radius*Math.sqrt(3), 0] // outer horizontal
    ];
    
    // Draw circles
    positions.forEach(([dx, dy]) => {
      svg.append('circle')
        .attr('cx', centerX + dx)
        .attr('cy', centerY + dy)
        .attr('r', radius/3)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1);
    });
    
    // Draw connecting lines (simplified)
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const [x1, y1] = positions[i];
        const [x2, y2] = positions[j];
        const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
        
        // Only connect nearby circles
        if (distance < radius * 2.5) {
          svg.append('line')
            .attr('x1', centerX + x1)
            .attr('y1', centerY + y1)
            .attr('x2', centerX + x2)
            .attr('y2', centerY + y2)
            .attr('stroke', color)
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.6);
        }
      }
    }
  }
};

/**
 * Render a biblical geometry pattern
 */
export function renderBiblicalGeometry(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  geometryName: string,
  element: string,
  width: number,
  height: number
): void {
  const color = getElementColor(element);
  const pattern = geometryPatterns[geometryName];
  
  if (pattern) {
    pattern(svg, width, height, color);
  } else {
    // Fallback to simple circle
    const radius = Math.min(width, height) * 0.2;
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
  }
}