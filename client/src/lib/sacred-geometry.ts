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
export function getElementColor(element: string | undefined): string {
  if (!element) return '#888888'; // Gray fallback for undefined/null
  
  switch (element.toLowerCase()) {
    case 'fire': return '#FF4444'; // Red
    case 'air': return '#4A90E2'; // Blue  
    case 'water': return '#2ECC40'; // Teal/Green
    case 'earth': return '#228B22'; // Green
    case 'plasma': return '#FFD700'; // Gold
    case 'light': return '#FFFFFF'; // White
    case 'spirit': return '#C0C0C0'; // Silver
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
  },

  // Additional missing patterns
  'Monad Unity Point': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.1;
    
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('stroke-width', 2);
  },

  'Tetrahedron + Rays': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.25;
    
    // Draw tetrahedron base
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
    
    // Add rays
    const rayLength = size * 0.8;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = centerX + Math.cos(angle) * size/3;
      const y1 = centerY + Math.sin(angle) * size/3;
      const x2 = centerX + Math.cos(angle) * rayLength;
      const y2 = centerY + Math.sin(angle) * rayLength;
      
      svg.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', 1);
    }
  },

  'Hexagonal Mandala': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;
    
    // Central hexagon
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      hexPoints.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    svg.append('polygon')
      .attr('points', hexPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Inner patterns
    for (let ring = 1; ring <= 3; ring++) {
      const r = radius * ring / 3;
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);
    }
  },

  'Octahedron': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.3;
    
    // Draw octahedron as diamond shapes
    const topPoints = [
      [centerX, centerY - size/2],
      [centerX + size/3, centerY],
      [centerX, centerY + size/2],
      [centerX - size/3, centerY]
    ];
    
    svg.append('polygon')
      .attr('points', topPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Add depth lines
    svg.append('line')
      .attr('x1', centerX - size/6)
      .attr('y1', centerY - size/4)
      .attr('x2', centerX + size/6)
      .attr('y2', centerY - size/4)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
  },

  'Fractal Tree': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const trunkHeight = Math.min(width, height) * 0.25;
    
    function drawBranch(x: number, y: number, angle: number, length: number, depth: number) {
      if (depth === 0) return;
      
      const endX = x + length * Math.cos(angle);
      const endY = y + length * Math.sin(angle);
      
      svg.append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', endX)
        .attr('y2', endY)
        .attr('stroke', color)
        .attr('stroke-width', depth * 0.5)
        .attr('opacity', 0.8);
      
      if (depth > 1) {
        drawBranch(endX, endY, angle - Math.PI/6, length * 0.7, depth - 1);
        drawBranch(endX, endY, angle + Math.PI/6, length * 0.7, depth - 1);
      }
    }
    
    drawBranch(centerX, centerY + trunkHeight/2, -Math.PI/2, trunkHeight, 4);
  },

  'Icosahedron': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    
    // Draw icosahedron as pentagon with triangular faces
    const pentagonPoints = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5;
      pentagonPoints.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    svg.append('polygon')
      .attr('points', pentagonPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Add triangular faces
    pentagonPoints.forEach((point, i) => {
      const nextPoint = pentagonPoints[(i + 1) % 5];
      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', point[0])
        .attr('y2', point[1])
        .attr('stroke', color)
        .attr('stroke-width', 1);
    });
  },

  'Hexagonal Prism': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const offset = radius * 0.3;
    
    // Front hexagon
    const frontHex = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      frontHex.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    // Back hexagon (offset for 3D effect)
    const backHex = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      backHex.push([
        centerX + radius * Math.cos(angle) + offset,
        centerY + radius * Math.sin(angle) - offset
      ]);
    }
    
    // Draw back hexagon (dashed)
    svg.append('polygon')
      .attr('points', backHex.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    
    // Draw front hexagon
    svg.append('polygon')
      .attr('points', frontHex.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Connect corresponding vertices
    for (let i = 0; i < 6; i++) {
      svg.append('line')
        .attr('x1', frontHex[i][0])
        .attr('y1', frontHex[i][1])
        .attr('x2', backHex[i][0])
        .attr('y2', backHex[i][1])
        .attr('stroke', color)
        .attr('stroke-width', 1);
    }
  },

  'Golden Ratio Spiral': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const maxRadius = Math.min(width, height) * 0.35;
    
    const spiralPath = d3.path();
    const turns = 2;
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * turns * 2 * Math.PI;
      const radius = (t ** phi) * maxRadius;
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

  'Mobius Strip': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    
    // Draw mobius strip as twisted oval
    const path1 = d3.path();
    const path2 = d3.path();
    
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(t);
      const y1 = centerY + radius * 0.5 * Math.sin(t);
      const x2 = centerX + radius * 0.7 * Math.cos(t + Math.PI);
      const y2 = centerY + radius * 0.7 * 0.5 * Math.sin(t + Math.PI);
      
      if (i === 0) {
        path1.moveTo(x1, y1);
        path2.moveTo(x2, y2);
      } else {
        path1.lineTo(x1, y1);
        path2.lineTo(x2, y2);
      }
    }
    
    svg.append('path')
      .attr('d', path1.toString())
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    svg.append('path')
      .attr('d', path2.toString())
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.7);
  },

  '3D Pentagon': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const offset = radius * 0.25;
    
    // Front pentagon
    const frontPent = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI/2;
      frontPent.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    // Back pentagon
    const backPent = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI/2;
      backPent.push([
        centerX + radius * Math.cos(angle) + offset,
        centerY + radius * Math.sin(angle) - offset
      ]);
    }
    
    // Draw back pentagon (dashed)
    svg.append('polygon')
      .attr('points', backPent.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    
    // Draw front pentagon
    svg.append('polygon')
      .attr('points', frontPent.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Connect vertices
    for (let i = 0; i < 5; i++) {
      svg.append('line')
        .attr('x1', frontPent[i][0])
        .attr('y1', frontPent[i][1])
        .attr('x2', backPent[i][0])
        .attr('y2', backPent[i][1])
        .attr('stroke', color)
        .attr('stroke-width', 1);
    }
  },

  'Tetrahedron': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.3;
    
    // Draw tetrahedron faces
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
    
    // Add apex point and edges
    const apexX = centerX + size/4;
    const apexY = centerY - size/4;
    
    points.forEach(point => {
      svg.append('line')
        .attr('x1', point[0])
        .attr('y1', point[1])
        .attr('x2', apexX)
        .attr('y2', apexY)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
    });
    
    svg.append('circle')
      .attr('cx', apexX)
      .attr('cy', apexY)
      .attr('r', 2)
      .attr('fill', color);
  },

  'Isometric Grid': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const gridSize = Math.min(width, height) * 0.05;
    const rows = 6;
    const cols = 6;
    
    // Draw isometric grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = centerX + (col - cols/2) * gridSize * Math.cos(Math.PI/6) + (row - rows/2) * gridSize * Math.cos(Math.PI/6);
        const y = centerY + (col - cols/2) * gridSize * Math.sin(Math.PI/6) - (row - rows/2) * gridSize * Math.sin(Math.PI/6);
        
        // Draw rhombus
        const points = [
          [x, y - gridSize/2],
          [x + gridSize * Math.cos(Math.PI/6), y],
          [x, y + gridSize/2],
          [x - gridSize * Math.cos(Math.PI/6), y]
        ];
        
        svg.append('polygon')
          .attr('points', points.map(p => p.join(',')).join(' '))
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.6);
      }
    }
  },

  'Reflection Diagram': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.25;
    
    // Draw original shape (left)
    svg.append('circle')
      .attr('cx', centerX - size/2)
      .attr('cy', centerY)
      .attr('r', size/3)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Draw reflection line (center)
    svg.append('line')
      .attr('x1', centerX)
      .attr('y1', centerY - size/2)
      .attr('x2', centerX)
      .attr('y2', centerY + size/2)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    
    // Draw reflected shape (right)
    svg.append('circle')
      .attr('cx', centerX + size/2)
      .attr('cy', centerY)
      .attr('r', size/3)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);
    
    // Connection lines
    svg.append('line')
      .attr('x1', centerX - size/6)
      .attr('y1', centerY)
      .attr('x2', centerX + size/6)
      .attr('y2', centerY)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);
  },

  'Fibonacci Circle': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;
    
    // Fibonacci sequence
    const fib = [1, 1, 2, 3, 5, 8, 13];
    const total = fib.reduce((sum, val) => sum + val, 0);
    
    fib.forEach((val, i) => {
      const radius = (val / total) * maxRadius;
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.8 - i * 0.1);
    });
  },

  'Torus (3D)': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const majorRadius = Math.min(width, height) * 0.25;
    const minorRadius = majorRadius * 0.4;
    
    // Outer circle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', majorRadius)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Inner hole
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', majorRadius - minorRadius)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1);
    
    // 3D effect curves
    svg.append('ellipse')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('rx', majorRadius)
      .attr('ry', majorRadius * 0.3)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);
  },

  '64 Star Tetrahedron': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.3;
    
    // Central tetrahedron
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
    
    // Inverted tetrahedron
    const invertedPoints = [
      [centerX, centerY + size/2],
      [centerX - size/2 * Math.cos(Math.PI/6), centerY - size/2 * Math.sin(Math.PI/6)],
      [centerX + size/2 * Math.cos(Math.PI/6), centerY - size/2 * Math.sin(Math.PI/6)]
    ];
    
    svg.append('polygon')
      .attr('points', invertedPoints.map(p => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2);
    
    // Star pattern
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x1 = centerX + size/3 * Math.cos(angle);
      const y1 = centerY + size/3 * Math.sin(angle);
      const x2 = centerX + size/2 * Math.cos(angle);
      const y2 = centerY + size/2 * Math.sin(angle);
      
      svg.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.7);
    }
  },

  'Nested Fib Circles': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.05;
    
    // Fibonacci sequence
    const fib = [1, 1, 2, 3, 5, 8];
    
    fib.forEach((val, i) => {
      const radius = baseRadius * val;
      const offsetX = i % 2 === 0 ? -val * 2 : val * 2;
      const offsetY = Math.floor(i / 2) % 2 === 0 ? -val : val;
      
      svg.append('circle')
        .attr('cx', centerX + offsetX)
        .attr('cy', centerY + offsetY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);
    });
  },

  'Infinity': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.25;
    
    // Draw infinity symbol using bezier curves
    const path = d3.path();
    path.moveTo(centerX - size, centerY);
    path.quadraticCurveTo(centerX - size/2, centerY - size/2, centerX, centerY);
    path.quadraticCurveTo(centerX + size/2, centerY + size/2, centerX + size, centerY);
    path.quadraticCurveTo(centerX + size/2, centerY - size/2, centerX, centerY);
    path.quadraticCurveTo(centerX - size/2, centerY + size/2, centerX - size, centerY);
    
    svg.append('path')
      .attr('d', path.toString())
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3);
  },

  'Fractal Network': (svg, width, height, color) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    
    // Central node
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 4)
      .attr('fill', color);
    
    // Network nodes
    const nodeCount = 8;
    const nodes = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i * 2 * Math.PI) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodes.push([x, y]);
      
      // Draw node
      svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 3)
        .attr('fill', color)
        .attr('opacity', 0.8);
      
      // Connect to center
      svg.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('opacity', 0.6);
    }
    
    // Interconnect nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.6) { // Random connections
          svg.append('line')
            .attr('x1', nodes[i][0])
            .attr('y1', nodes[i][1])
            .attr('x2', nodes[j][0])
            .attr('y2', nodes[j][1])
            .attr('stroke', color)
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.4);
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