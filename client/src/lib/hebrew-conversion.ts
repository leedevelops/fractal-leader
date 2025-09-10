// Hebrew name conversion and fractal generation utilities

export interface FractalPoint {
  x: number;
  y: number;
  intensity: number;
  letter: string;
}

// Hebrew alphabet with numerical values (Gematria)
const hebrewGematria: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90, 'ק': 100,
  'ר': 200, 'ש': 300, 'ת': 400,
  // Final forms
  'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90
};

// English to Hebrew transliteration mapping
const englishToHebrew: Record<string, string> = {
  'a': 'א', 'b': 'ב', 'c': 'ג', 'd': 'ד', 'e': 'ה', 'f': 'ו', 'g': 'ז',
  'h': 'ח', 'i': 'ט', 'j': 'י', 'k': 'כ', 'l': 'ל', 'm': 'מ', 'n': 'נ',
  'o': 'ס', 'p': 'פ', 'q': 'צ', 'r': 'ר', 's': 'ש', 't': 'ת', 'u': 'ו',
  'v': 'ו', 'w': 'ו', 'x': 'קס', 'y': 'י', 'z': 'ז'
};

// Biblical archetype mapping based on Hebrew letter patterns
const archetypePatterns: Record<string, string> = {
  'א': 'pioneer',     // Aleph - The Pioneer, beginnings
  'ב': 'builder',     // Beth - The Builder, house/structure  
  'ג': 'organizer',   // Gimel - The Organizer, completion/reward
  'ד': 'guardian',    // Daleth - The Guardian, door/pathway
  'ה': 'pioneer',     // He - The Pioneer, breath/revelation
  'ו': 'organizer',   // Vav - The Organizer, connection/hook
  'ז': 'guardian',    // Zayin - The Guardian, weapon/crown
  'ח': 'builder',     // Chet - The Builder, fence/private
  'ט': 'pioneer',     // Tet - The Pioneer, serpent/surround
  'י': 'organizer',   // Yod - The Organizer, hand/deed
  'כ': 'builder',     // Kaf - The Builder, palm/allow
  'ל': 'guardian',    // Lamed - The Guardian, staff/teach
  'מ': 'builder',     // Mem - The Builder, water/chaos
  'נ': 'organizer',   // Nun - The Organizer, fish/activity
  'ס': 'guardian',    // Samech - The Guardian, support/trust
  'ע': 'pioneer',     // Ayin - The Pioneer, eye/understand
  'פ': 'pioneer',     // Pe - The Pioneer, mouth/speak
  'צ': 'guardian',    // Tzade - The Guardian, fishhook/righteous
  'ק': 'builder',     // Qof - The Builder, back of head/behind
  'ר': 'organizer',   // Resh - The Organizer, head/person
  'ש': 'guardian',    // Shin - The Guardian, teeth/sharp
  'ת': 'builder',     // Tav - The Builder, mark/sign
};

/**
 * Convert English name to Hebrew equivalent
 */
export function convertNameToHebrew(name: string): string {
  if (!name) return '';
  
  return name.toLowerCase()
    .split('')
    .map(char => englishToHebrew[char] || char)
    .join('');
}

/**
 * Calculate the Gematria (numerical value) of a Hebrew name
 */
export function calculateGematria(hebrewName: string): number {
  return hebrewName
    .split('')
    .reduce((sum, letter) => sum + (hebrewGematria[letter] || 0), 0);
}

/**
 * Determine biblical archetype from Hebrew name
 */
export function getArchetypeFromHebrewName(hebrewName: string): string {
  if (!hebrewName) return 'pioneer';
  
  // Get the first letter's archetype as primary
  const firstLetter = hebrewName[0];
  const primaryArchetype = archetypePatterns[firstLetter] || 'pioneer';
  
  // Calculate weighted archetype based on all letters
  const archetypeCounts: Record<string, number> = {
    pioneer: 0,
    organizer: 0,
    builder: 0,
    guardian: 0,
  };
  
  hebrewName.split('').forEach(letter => {
    const archetype = archetypePatterns[letter];
    if (archetype) {
      archetypeCounts[archetype]++;
    }
  });
  
  // Find dominant archetype, but give extra weight to first letter
  archetypeCounts[primaryArchetype] += 0.5;
  
  return Object.entries(archetypeCounts).reduce((a, b) => 
    archetypeCounts[a[0] as keyof typeof archetypeCounts] > archetypeCounts[b[0] as keyof typeof archetypeCounts] ? a : b
  )[0];
}

/**
 * Generate fractal pattern points based on Hebrew name
 */
export function generateFractal(hebrewName: string): FractalPoint[] {
  if (!hebrewName) return [];
  
  const points: FractalPoint[] = [];
  const gematria = calculateGematria(hebrewName);
  const letters = hebrewName.split('');
  
  // Generate main pattern based on name length and gematria
  const centerX = 0;
  const centerY = 0;
  const baseRadius = 60;
  
  letters.forEach((letter, index) => {
    const letterValue = hebrewGematria[letter] || 1;
    const angle = (index / letters.length) * 2 * Math.PI;
    
    // Primary points
    const radius = baseRadius + (letterValue % 20);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    points.push({
      x: centerX + x,
      y: centerY + y,
      intensity: letterValue / 400, // Normalize to 0-1
      letter,
    });
    
    // Secondary fractal points based on letter value
    for (let i = 1; i <= 3; i++) {
      const subAngle = angle + (i * Math.PI / 6);
      const subRadius = radius * (0.5 + (letterValue % 10) / 20);
      const subX = Math.cos(subAngle) * subRadius;
      const subY = Math.sin(subAngle) * subRadius;
      
      points.push({
        x: centerX + subX,
        y: centerY + subY,
        intensity: (letterValue / 400) * (0.8 - i * 0.2),
        letter,
      });
    }
  });
  
  return points;
}

/**
 * Generate sacred geometry pattern for team visualization
 */
export function generateTeamFractal(teamMembers: Array<{ hebrewName?: string; generation: string }>): FractalPoint[] {
  const points: FractalPoint[] = [];
  const centerX = 0;
  const centerY = 0;
  
  teamMembers.forEach((member, index) => {
    if (!member.hebrewName) return;
    
    const memberPoints = generateFractal(member.hebrewName);
    const angle = (index / teamMembers.length) * 2 * Math.PI;
    const distance = 100 + index * 20;
    
    // Position each member's fractal around the team center
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;
    
    memberPoints.forEach(point => {
      points.push({
        ...point,
        x: point.x + offsetX,
        y: point.y + offsetY,
        intensity: point.intensity * 0.7, // Slightly dimmed for team view
      });
    });
  });
  
  // Add central team unity pattern
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    const radius = 40;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      intensity: 0.9,
      letter: 'ו', // Vav - connection
    });
  }
  
  return points;
}

/**
 * Calculate Hebrew name compatibility for team formation
 */
export function calculateNameCompatibility(name1: string, name2: string): number {
  const gematria1 = calculateGematria(name1);
  const gematria2 = calculateGematria(name2);
  
  // Calculate harmony based on numerical relationships
  const ratio = Math.max(gematria1, gematria2) / Math.min(gematria1, gematria2);
  const harmony = 1 / (1 + Math.abs(ratio - 1.618)); // Golden ratio preference
  
  // Bonus for complementary archetypes
  const archetype1 = getArchetypeFromHebrewName(name1);
  const archetype2 = getArchetypeFromHebrewName(name2);
  
  const complementaryPairs = [
    ['pioneer', 'builder'],
    ['organizer', 'guardian'],
  ];
  
  const isComplementary = complementaryPairs.some(pair => 
    (pair.includes(archetype1) && pair.includes(archetype2))
  );
  
  return harmony * (isComplementary ? 1.2 : 1.0);
}
