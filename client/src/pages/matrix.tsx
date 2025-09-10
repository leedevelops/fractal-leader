import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { X } from "lucide-react";
import FractalMatrix from "@/components/fractal-matrix/FractalMatrix";
import { FMData, FMNode, FMEdge } from "@/components/fractal-matrix/types";
import { useAuth } from "@/hooks/useAuth";
import { 
  adaptContentForGeneration, 
  getUIAdaptationSettings, 
  generateOnboardingFlow,
  type Generation 
} from "@/lib/generational-adaptation";

// Enhanced 26-Chapter Data Structure with Complete Biblical Framework
const chapterData: Chapter[] = [
  { ch: 1, book: 'Book 1', divineName: 'Yod', bookName: 'Becoming Rooted', bookTheme: 'Identity, Calling, and the Formation of Glory', chapterTitle: 'Leadership Begins at the Altar', geometryIcon: 'Square', stone: 'Sardius', element: 'Fire', templeSpace: 'Altar', storyStage: 'Exposition', dimension: '1 Glory', fractalGate: 'Revelation', spiritualFrequency: 'Deep Stillness', bookColor: 'Red', tribe: 'Reuben', prophet: 'Hosea', prophet2: '', apostle: '', directionalMapping: 'North' },
  { ch: 2, book: 'Book 1', divineName: 'Yod', bookName: 'Becoming Rooted', bookTheme: 'Identity, Calling, and the Formation of Glory', chapterTitle: 'The Tripartite Leader: Spirit, Soul, and Body', geometryIcon: 'Equilateral Triangle', stone: 'Topaz', element: 'Fire', templeSpace: 'Altar', storyStage: 'Rising Action', dimension: '6 Image', fractalGate: 'Internalization', spiritualFrequency: 'Triune Tone', bookColor: 'Red', tribe: 'Simeon', prophet: 'Joel', prophet2: '', apostle: '', directionalMapping: 'North' },
  { ch: 3, book: 'Book 1', divineName: 'Yod', bookName: 'Becoming Rooted', bookTheme: 'Identity, Calling, and the Formation of Glory', chapterTitle: 'Why We Had to Leave Eden', geometryIcon: '2D Spiral', stone: 'Emerald', element: 'Fire', templeSpace: 'Altar', storyStage: 'Climax', dimension: '2 Presence', fractalGate: 'Embodiment', spiritualFrequency: 'Exilic Echo', bookColor: 'Red', tribe: 'Levi', prophet: 'Amos', prophet2: '', apostle: '', directionalMapping: 'North' },
  { ch: 4, book: 'Book 1', divineName: 'Yod', bookName: 'Becoming Rooted', bookTheme: 'Identity, Calling, and the Formation of Glory', chapterTitle: 'Formation in Exile: The Purpose of the Fall', geometryIcon: 'Isometric Cube', stone: 'Carbuncle', element: 'Fire', templeSpace: 'Altar', storyStage: 'Falling Action', dimension: '4 Word', fractalGate: 'Integration', spiritualFrequency: 'Structure Hum', bookColor: 'Red', tribe: 'Judah', prophet: 'Obadiah', prophet2: '', apostle: '', directionalMapping: 'North' },
  { ch: 5, book: 'Book 1', divineName: 'Yod', bookName: 'Becoming Rooted', bookTheme: 'Identity, Calling, and the Formation of Glory', chapterTitle: 'The Seed Hidden in the Dust', geometryIcon: 'Monad Unity Point', stone: 'Onyx', element: 'Fire', templeSpace: 'Altar', storyStage: 'Resolution', dimension: '7 Name', fractalGate: 'Hidden (North)', spiritualFrequency: 'Subterranean Hum', bookColor: 'Red', tribe: 'Dan', prophet: 'Jonah', prophet2: '', apostle: '', directionalMapping: 'North' },
  
  { ch: 6, book: 'Book 2', divineName: 'Heh', bookName: 'Becoming Aligned', bookTheme: 'Patterns and the Spiritual Core of Leadership', chapterTitle: 'Jesus as the Tree of Life, the Flaming Sword, and the Cosmic Unifier', geometryIcon: 'Tetrahedron + Rays', stone: 'Sapphire', element: 'Air', templeSpace: 'Holy Place', storyStage: 'Exposition', dimension: '6 Image', fractalGate: 'Revelation', spiritualFrequency: 'Tree Flame Pulse', bookColor: 'Blue', tribe: 'Naphtali', prophet: 'Micah', prophet2: '', apostle: '', directionalMapping: 'East' },
  { ch: 7, book: 'Book 2', divineName: 'Heh', bookName: 'Becoming Aligned', bookTheme: 'Patterns and the Spiritual Core of Leadership', chapterTitle: 'The Divine Pattern: YHWH Structure and the Wings of Wisdom', geometryIcon: 'Hexagonal Mandala', stone: 'Diamond', element: 'Air', templeSpace: 'Holy Place', storyStage: 'Rising Action', dimension: '4 Word', fractalGate: 'Internalization', spiritualFrequency: 'Wings of Wisdom Vibration', bookColor: 'Blue', tribe: 'Gad', prophet: 'Nahum', prophet2: '', apostle: '', directionalMapping: 'East' },
  { ch: 8, book: 'Book 2', divineName: 'Heh', bookName: 'Becoming Aligned', bookTheme: 'Patterns and the Spiritual Core of Leadership', chapterTitle: 'The Pattern Keeper: Heaven Interface and Leadership Design', geometryIcon: 'Octahedron', stone: 'Ligure', element: 'Air', templeSpace: 'Holy Place', storyStage: 'Climax', dimension: '2 Presence', fractalGate: 'Embodiment', spiritualFrequency: 'Guardian Harmonic', bookColor: 'Blue', tribe: 'Asher', prophet: 'Habakkuk', prophet2: '', apostle: '', directionalMapping: 'East' },
  { ch: 9, book: 'Book 2', divineName: 'Heh', bookName: 'Becoming Aligned', bookTheme: 'Patterns and the Spiritual Core of Leadership', chapterTitle: 'The Fractal Pattern of Leadership', geometryIcon: 'Fibonacci Spiral', stone: 'Agate', element: 'Air', templeSpace: 'Holy Place', storyStage: 'Falling Action', dimension: '5 Spirit', fractalGate: 'Integration', spiritualFrequency: 'Recursive Tone', bookColor: 'Blue', tribe: 'Issachar', prophet: 'Zephaniah', prophet2: '', apostle: '', directionalMapping: 'East' },
  { ch: 10, book: 'Book 2', divineName: 'Heh', bookName: 'Becoming Aligned', bookTheme: 'Patterns and the Spiritual Core of Leadership', chapterTitle: 'The Invisible Root System of Authority', geometryIcon: 'Fractal Tree', stone: 'Amethyst', element: 'Air', templeSpace: 'Holy Place', storyStage: 'Resolution', dimension: '7 Name', fractalGate: 'Hidden (South)', spiritualFrequency: 'Root Resonance', bookColor: 'Blue', tribe: 'Zebulun', prophet: 'Haggai', prophet2: '', apostle: '', directionalMapping: 'East' },
  
  { ch: 11, book: 'Book 3', divineName: 'Vav', bookName: 'Becoming Clear', bookTheme: 'Vision, Emotional Intelligence, and the Inner Compass', chapterTitle: 'Vision of God: The First Call of Every Leader', geometryIcon: 'Icosahedron', stone: 'Beryl', element: 'Water', templeSpace: 'Inner Light', storyStage: 'Exposition', dimension: '1 Glory', fractalGate: 'Revelation', spiritualFrequency: 'Visionary Call', bookColor: 'Teal', tribe: 'Joseph (Ephraim)', prophet: 'Zechariah', prophet2: '', apostle: '', directionalMapping: 'South' },
  { ch: 12, book: 'Book 3', divineName: 'Vav', bookName: 'Becoming Clear', bookTheme: 'Vision, Emotional Intelligence, and the Inner Compass', chapterTitle: 'Vision of Self: Emotional Tools and Soul Awareness', geometryIcon: 'Hexagonal Prism', stone: 'Onyx (2)', element: 'Water', templeSpace: 'Inner Light', storyStage: 'Rising Action', dimension: '3 Voice', fractalGate: 'Internalization', spiritualFrequency: 'Soul Frequency', bookColor: 'Teal', tribe: 'Benjamin', prophet: 'Malachi', prophet2: '', apostle: '', directionalMapping: 'South' },
  { ch: 13, book: 'Book 3', divineName: 'Vav', bookName: 'Becoming Clear', bookTheme: 'Vision, Emotional Intelligence, and the Inner Compass', chapterTitle: 'Vision of Mission: Discovering Your Divine Measure', geometryIcon: 'Golden Ratio Spiral', stone: 'Jasper', element: 'Water', templeSpace: 'Inner Light', storyStage: 'Climax', dimension: '4 Word', fractalGate: 'Embodiment', spiritualFrequency: 'Mission Tuning', bookColor: 'Teal', tribe: '', prophet: 'John the Baptist', prophet2: '', apostle: '', directionalMapping: 'South' },
  { ch: 14, book: 'Book 3', divineName: 'Vav', bookName: 'Becoming Clear', bookTheme: 'Vision, Emotional Intelligence, and the Inner Compass', chapterTitle: 'The Wounded Visionary: Leading Through Inner Conflict', geometryIcon: 'Mobius Strip', stone: 'Sapphire', element: 'Water', templeSpace: 'Inner Light', storyStage: 'Falling Action', dimension: '6 Image', fractalGate: 'Integration', spiritualFrequency: 'Wounded Harmony', bookColor: 'Teal', tribe: '', prophet: 'Elijah', prophet2: '', apostle: '', directionalMapping: 'South' },
  { ch: 15, book: 'Book 3', divineName: 'Vav', bookName: 'Becoming Clear', bookTheme: 'Vision, Emotional Intelligence, and the Inner Compass', chapterTitle: 'Sacred Sight: From Revelation to Discernment', geometryIcon: 'Metatron Cube', stone: 'Chalcedony', element: 'Water', templeSpace: 'Inner Light', storyStage: 'Resolution', dimension: '7 Name', fractalGate: 'Hidden (East)', spiritualFrequency: 'Sight Pulse', bookColor: 'Teal', tribe: '', prophet: 'John the Revelator', prophet2: '', apostle: '', directionalMapping: 'South' },
  
  { ch: 16, book: 'Book 4', divineName: 'Final Heh', bookName: 'Becoming Embodied', bookTheme: 'Walking in Wisdom, Spirit, and Glory', chapterTitle: 'Emotional Intelligence and Passion', geometryIcon: '3D Pentagon', stone: 'Emerald (2)', element: 'Earth', templeSpace: 'Holy of Holies', storyStage: 'Exposition', dimension: '5 Spirit', fractalGate: 'Revelation', spiritualFrequency: 'Passion Current', bookColor: 'Green', tribe: '', prophet: 'Samuel', prophet2: '', apostle: 'Andrew', directionalMapping: 'West' },
  { ch: 17, book: 'Book 4', divineName: 'Final Heh', bookName: 'Becoming Embodied', bookTheme: 'Walking in Wisdom, Spirit, and Glory', chapterTitle: 'Intelligent Action: Decision-Making in Alignment with the Spirit', geometryIcon: 'Tetrahedron', stone: 'Sardonyx', element: 'Earth', templeSpace: 'Holy of Holies', storyStage: 'Rising Action', dimension: '4 Word', fractalGate: 'Internalization', spiritualFrequency: 'Aligned Decision Pulse', bookColor: 'Green', tribe: '', prophet: 'Nathan', prophet2: '', apostle: 'James', directionalMapping: 'West' },
  { ch: 18, book: 'Book 4', divineName: 'Final Heh', bookName: 'Becoming Embodied', bookTheme: 'Walking in Wisdom, Spirit, and Glory', chapterTitle: 'Embodied Leadership: Why Your Body Matters', geometryIcon: 'Isometric Grid', stone: 'Carnelian', element: 'Earth', templeSpace: 'Holy of Holies', storyStage: 'Climax', dimension: '6 Image', fractalGate: 'Embodiment', spiritualFrequency: 'Embodied Presence', bookColor: 'Green', tribe: '', prophet: 'Gad', prophet2: '', apostle: 'Bartholomew', directionalMapping: 'West' },
  { ch: 19, book: 'Book 4', divineName: 'Final Heh', bookName: 'Becoming Embodied', bookTheme: 'Walking in Wisdom, Spirit, and Glory', chapterTitle: 'Mentors and Mirrors: Leading Like Jesus in a Fractured World', geometryIcon: 'Reflection Diagram', stone: 'Chrysolite', element: 'Earth', templeSpace: 'Holy of Holies', storyStage: 'Falling Action', dimension: '2 Presence', fractalGate: 'Integration', spiritualFrequency: 'Mirror Tone', bookColor: 'Green', tribe: '', prophet: 'David', prophet2: '', apostle: 'Matthew', directionalMapping: 'West' },
  { ch: 20, book: 'Book 4', divineName: 'Final Heh', bookName: 'Becoming Embodied', bookTheme: 'Walking in Wisdom, Spirit, and Glory', chapterTitle: 'The Body of Christ: Flesh Made Flame', geometryIcon: 'Flower of Life', stone: 'Beryl (2)', element: 'Earth', templeSpace: 'Holy of Holies', storyStage: 'Resolution', dimension: '7 Name', fractalGate: 'Hidden (West)', spiritualFrequency: 'Radiant Bloom', bookColor: 'Green', tribe: '', prophet: 'Isaiah', prophet2: '', apostle: 'Thomas', directionalMapping: 'West' },
  
  { ch: 21, book: 'Book 5', divineName: 'YESHUA', bookName: 'The Pattern Manifesto', bookTheme: 'Jesus, the Fractal Fulfillment, and the Apostolic Flame', chapterTitle: 'Yeshua: The Embodiment of YHWH', geometryIcon: 'Star of David', stone: 'Topaz (2)', element: 'Plasma', templeSpace: 'Ark', storyStage: 'Exposition', dimension: '7 Name', fractalGate: 'Revelation', spiritualFrequency: 'Incarnational Wave', bookColor: 'Gold', tribe: '', prophet: 'Jeremiah', prophet2: '', apostle: 'Peter', directionalMapping: 'Center' },
  { ch: 22, book: 'Book 5', divineName: 'YESHUA', bookName: 'The Pattern Manifesto', bookTheme: 'Jesus, the Fractal Fulfillment, and the Apostolic Flame', chapterTitle: 'The Spiral and the Sword: Jesus as Pattern and Portal', geometryIcon: 'Fibonacci Circle', stone: 'Chrysoprase', element: 'Plasma', templeSpace: 'Ark', storyStage: 'Rising Action', dimension: '6 Image', fractalGate: 'Internalization', spiritualFrequency: 'Sword Spiral Resonance', bookColor: 'Gold', tribe: '', prophet: 'Ezekiel', prophet2: '', apostle: 'John', directionalMapping: 'Center' },
  { ch: 23, book: 'Book 5', divineName: 'YESHUA', bookName: 'The Pattern Manifesto', bookTheme: 'Jesus, the Fractal Fulfillment, and the Apostolic Flame', chapterTitle: 'The Name and the Nations: Fractal Mission in the Latter Days', geometryIcon: 'Torus (3D)', stone: 'Jacinth', element: 'Plasma', templeSpace: 'Ark', storyStage: 'Climax', dimension: '4 Word', fractalGate: 'Embodiment', spiritualFrequency: 'Global Pulse', bookColor: 'Gold', tribe: '', prophet: 'Daniel', prophet2: '', apostle: 'Paul', directionalMapping: 'Center' },
  { ch: 24, book: 'Book 5', divineName: 'YESHUA', bookName: 'The Pattern Manifesto', bookTheme: 'Jesus, the Fractal Fulfillment, and the Apostolic Flame', chapterTitle: 'Pentecost, Fire, and the Echo of Eden', geometryIcon: '64 Star Tetrahedron', stone: 'Amethyst (2)', element: 'Plasma', templeSpace: 'Ark', storyStage: 'Falling Action', dimension: '7 Name', fractalGate: 'Integration', spiritualFrequency: 'Covenant Flame Ring', bookColor: 'Gold', tribe: '', prophet: 'Moses', prophet2: '', apostle: 'James the Less', directionalMapping: 'Center' },
  { ch: 25, book: 'Book 5', divineName: 'YESHUA', bookName: 'The Pattern Manifesto', bookTheme: 'Jesus, the Fractal Fulfillment, and the Apostolic Flame', chapterTitle: 'The Commissioning Pattern: Send as I Have Been Sent', geometryIcon: 'Nested Fibonacci Circles', stone: 'Diamond (2)', element: 'Plasma', templeSpace: 'Ark', storyStage: 'Resolution', dimension: '7 Name', fractalGate: 'Hidden (Center)', spiritualFrequency: 'Apostolic Send', bookColor: 'Gold', tribe: '', prophet: 'John the Baptist', prophet2: '', apostle: 'Matthias', directionalMapping: 'Center' },
  
  { ch: 26, book: 'Book 6', divineName: 'The Pattern', bookName: 'Christ Embodiment', bookTheme: 'Perfect Alignment', chapterTitle: 'The Pattern (Christ)', geometryIcon: 'Infinity', stone: 'Diamond', element: 'Light', templeSpace: 'Throne', storyStage: 'Eternal', dimension: '6 Christ', fractalGate: 'Perfect', spiritualFrequency: 'Christ Frequency', bookColor: 'White', tribe: '', prophet: 'Jesus', prophet2: '', apostle: 'The Word', directionalMapping: 'Center' }
];

const yhwhQuadrants = [
  { letter: "י", hebrew: "י", bookNumber: 1, position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-4", color: "red", chapters: "1-5", title: "YOD - North", direction: "North" },
  { letter: "ה", hebrew: "ה", bookNumber: 2, position: "top-1/2 right-0 transform translate-x-4 -translate-y-1/2", color: "blue", chapters: "6-10", title: "HEH - East", direction: "East" },
  { letter: "ו", hebrew: "ו", bookNumber: 3, position: "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4", color: "teal", chapters: "11-15", title: "VAV - South", direction: "South" },
  { letter: "ה", hebrew: "ה", bookNumber: 4, position: "top-1/2 left-0 transform -translate-x-4 -translate-y-1/2", color: "green", chapters: "16-20", title: "FINAL HEH - West", direction: "West" }
];

type Chapter = {
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
};

type ChatContext = {
  chapterTitle: string;
  bookTheme: string;
  element: string;
  templeSpace: string;
  spiritualFocus: string;
  hebrewLetter: string;
  stone: string;
  direction: string;
};

export default function Matrix() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeBook, setActiveBook] = useState<number | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [unlockedChapters, setUnlockedChapters] = useState<number[]>([1, 2, 3, 4, 5]); // Start with Book 1 unlocked
  const [achievements, setAchievements] = useState<string[]>([]);
  const [spiritualLevel, setSpiritualLevel] = useState<number>(1);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // Generational adaptation
  const currentGeneration = ((user as any)?.generation as Generation) || 'millennial';
  const uiSettings = getUIAdaptationSettings(currentGeneration);
  const onboardingFlow = generateOnboardingFlow(currentGeneration);
  
  // Adapt matrix content for current generation
  const baseMatrixContent = {
    matrix: {
      title: 'Interactive Biblical Leadership Matrix',
      description: '25 Fractal Tiers: The Pattern (Christ) & The Ripple (Paul)',
      callToAction: 'Explore Matrix',
      duration: '10 min exploration',
      format: 'interactive'
    },
    visualization: {
      title: 'Advanced Fractal Matrix Map',
      description: 'Interactive visualization of leadership patterns',
      callToAction: 'Discover Patterns',
      duration: '5 min',
      format: 'visual'
    },
    chapters: {
      title: 'Leadership Development Chapters',
      description: 'Biblical wisdom organized by sacred directions',
      callToAction: 'Begin Journey',
      duration: 'Self-paced',
      format: 'structured'
    }
  };
  
  const adaptedMatrixContent = adaptContentForGeneration(currentGeneration, baseMatrixContent);


  // Generational theme colors - memoized for performance and accessibility
  const generationalTheme = useMemo(() => {
    const themes = {
      gen_z: {
        Hub: "#ff6b6b",
        Chapter: "#4c6ef5", 
        Stone: "#51cf66",
        Tribe: "#ff8cc8",
        Prophet: "#845ef7",
        Apostle: "#fd7e14",
        Frequency: "#20c997",
        Book: "#fab005",
        Dimension: "#e83e8c"
      },
      millennial: {
        Hub: "#ffd43b",
        Chapter: "#74c0fc",
        Stone: "#69db7c", 
        Tribe: "#ff6b6b",
        Prophet: "#da77f2",
        Apostle: "#fd7e14",
        Frequency: "#20c997",
        Book: "#6f42c1", 
        Dimension: "#e83e8c"
      },
      gen_x: {
        Hub: "#868e96",
        Chapter: "#495057",
        Stone: "#343a40", 
        Tribe: "#6c757d",
        Prophet: "#adb5bd",
        Apostle: "#dee2e6",
        Frequency: "#e9ecef",
        Book: "#f8f9fa", 
        Dimension: "#ced4da"
      },
      boomer: {
        Hub: "#8b4513",
        Chapter: "#2e4057",
        Stone: "#5d4e75", 
        Tribe: "#b07156",
        Prophet: "#4a5c6a",
        Apostle: "#6b4e3d",
        Frequency: "#7d5a50",
        Book: "#9a7b6a", 
        Dimension: "#8b7d6b"
      }
    };
    return themes[currentGeneration];
  }, [currentGeneration]);

  // Helper functions - Improved Geometry Icons
  const getGeometryIcon = (geometry: string): string => {
    const icons: { [key: string]: string } = {
      square: "◾", 
      triangle: "🔻", 
      spiral: "💫",
      cube: "⬜",
      circle: "🟢",
      tetrahedron: "🔶",
      hexagon: "🔷",
      octahedron: "💎",
      tree: "🌲",
      icosahedron: "🔹",
      prism: "🔺",
      mobius: "♾️",
      pentagon: "🔸",
      grid: "⚡",
      mirror: "🪬",
      flower: "🌺",
      star: "⭐",
      torus: "🟣",
      "star-tetrahedron": "✨",
      circles: "🔵",
      infinity: "♾️",
      network: "🕷️",
      "equilateral triangle": "🔻",
      "2d spiral": "💫",
      "isometric cube": "⬜",
      "monad unity point": "🟡",
      "tetrahedron + rays": "🔆",
      "hexagonal mandala": "🔷",
      "fibonacci spiral": "💫",
      "fractal tree": "🌲",
      "hexagonal prism": "🔶",
      "golden ratio spiral": "💫",
      "mobius strip": "♾️",
      "metatron cube": "🔹",
      "3d pentagon": "🔸",
      "isometric grid": "⚡",
      "reflection diagram": "🪬",
      "flower of life": "🌺",
      "star of david": "✡️",
      "fibonacci circle": "🔵",
      "torus (3d)": "🟣",
      "64 star tetrahedron": "✨",
      "nested fibonacci circles": "🔵"
    };
    return icons[geometry.toLowerCase()] || "💎";
  };

  const getElementColor = (element: string): string => {
    const colors: { [key: string]: string } = {
      Fire: "red", Air: "blue", Water: "teal", Earth: "green", 
      Plasma: "yellow", Light: "white", Spirit: "purple"
    };
    return colors[element] || "gray";
  };

  const getBookColorClass = (bookColor: string): string => {
    const colorClasses: { [key: string]: string } = {
      Red: "bg-red-500/20 border-red-400 text-red-300",
      Blue: "bg-blue-500/20 border-blue-400 text-blue-300", 
      Teal: "bg-teal-500/20 border-teal-400 text-teal-300",
      Green: "bg-green-500/20 border-green-400 text-green-300",
      Gold: "bg-yellow-500/20 border-yellow-400 text-yellow-300",
      White: "bg-white/20 border-white text-white",
      Purple: "bg-purple-500/20 border-purple-400 text-purple-300"
    };
    return colorClasses[bookColor] || "bg-gray-500/20 border-gray-400 text-gray-300";
  };

  // Enhanced 7-dimension tracking
  const dimensionProgress = {
    '1 Glory': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '1 Glory').length,
    '2 Presence': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '2 Presence').length,
    '3 Voice': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '3 Voice').length,
    '4 Word': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '4 Word').length,
    '5 Spirit': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '5 Spirit').length,
    '6 Image': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '6 Image').length,
    '7 Name': unlockedChapters.filter(ch => chapterData[ch-1]?.dimension === '7 Name').length
  };

  // AI Chat Integration Functions
  const openChapterChat = (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatContext({
      chapterTitle: chapter.chapterTitle,
      bookTheme: chapter.bookTheme,
      element: chapter.element,
      templeSpace: chapter.templeSpace,
      spiritualFocus: chapter.dimension,
      hebrewLetter: chapter.divineName,
      stone: chapter.stone,
      direction: chapter.directionalMapping || 'Center'
    });
    setShowChat(true);
    
    // Enhanced contextual greeting with full context
    const contextualGreeting = `Hello! I'm here to guide you through **${chapter.chapterTitle}** from ${chapter.bookTheme}. This is Chapter ${chapter.ch} in the ${chapter.divineName} sequence.

**Sacred Elements:**
• **Geometry:** ${chapter.geometryIcon}
• **Element:** ${chapter.element}
• **Temple Space:** ${chapter.templeSpace} 
• **Stone:** ${chapter.stone}
• **Spiritual Frequency:** ${chapter.spiritualFrequency}
• **Fractal Gate:** ${chapter.fractalGate}
${chapter.tribe ? `• **Tribe:** ${chapter.tribe}` : ''}
${chapter.prophet ? `• **Prophet:** ${chapter.prophet}` : ''}
${chapter.apostle ? `• **Apostle:** ${chapter.apostle}` : ''}

What aspect of this fractal leadership tier would you like to explore?`;
    setChatMessages([{role: 'assistant', content: contextualGreeting}]);
  };

  const getBookTheme = (book: string): string => {
    const themes: { [key: string]: string } = {
      'Book 1': 'Becoming Rooted',
      'Book 2': 'Becoming Aligned', 
      'Book 3': 'Becoming Clear',
      'Book 4': 'Becoming Embodied',
      'Book 5': 'Pattern Manifesto'
    };
    return themes[book] || book;
  };

  const getHebrewLetter = (book: string): string => {
    const letters: { [key: string]: string } = {
      'Book 1': 'י', 'Book 2': 'ה', 'Book 3': 'ו', 'Book 4': 'ה', 'Book 5': 'ישוע'
    };
    return letters[book] || '';
  };

  const sendChatMessage = async (message: string) => {
    if (!chatContext) return;
    
    const newMessages = [...chatMessages, {role: 'user' as const, content: message}];
    setChatMessages(newMessages);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: `Chapter: ${chatContext.chapterTitle}, Theme: ${chatContext.bookTheme}, Element: ${chatContext.element}, Temple Space: ${chatContext.templeSpace}, Focus: ${chatContext.spiritualFocus}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChatMessages([...newMessages, {role: 'assistant', content: data.response}]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const unlockNextChapter = () => {
    if (unlockedChapters.length < 27) {
      setUnlockedChapters([...unlockedChapters, unlockedChapters.length + 1]);
      setSpiritualLevel(Math.floor(unlockedChapters.length / 5) + 1);
    }
  };

  const goToDirection = (direction: string): void => {
    const directionChapters = chapterData.filter(ch => ch.directionalMapping === direction);
    if (directionChapters.length > 0) {
      setActiveChapter(directionChapters[0]);
    }
  };

  // Convert chapter data to FractalMatrix format
  const fractalMatrixData: FMData = useMemo(() => {
    const nodes: FMNode[] = [
      // Hub - center YHWH
      { 
        id: "hub-yhwh", 
        kind: "Hub", 
        label: "יהוה", 
        element: "Spirit" 
      },
      // Books as chapters
      ...Array.from(new Set(chapterData.map(ch => ch.book))).map((book, index) => ({
        id: `chapter-${book.replace(' ', '-').toLowerCase()}`,
        kind: "Chapter" as const,
        label: book,
        element: ["Fire", "Air", "Water", "Earth", "Plasma"][index] as any,
        chapter: index + 1
      })),
      // Individual chapters as stones
      ...chapterData.slice(0, 12).map(ch => ({
        id: `stone-ch${ch.ch}`,
        kind: "Stone" as const,
        label: ch.chapterTitle.split(':')[0] || `Ch ${ch.ch}`,
        element: ch.element as any,
        chapter: ch.ch
      })),
      // Tribes
      ...Array.from(new Set(chapterData.map(ch => ch.tribe).filter(Boolean))).slice(0, 6).map((tribe, index) => ({
        id: `tribe-${tribe?.toLowerCase().replace(' ', '-')}`,
        kind: "Tribe" as const,
        label: tribe!,
        element: ["Fire", "Air", "Water", "Earth", "Spirit", "Fire"][index] as any
      })),
      // Prophets  
      ...Array.from(new Set(chapterData.map(ch => ch.prophet).filter(Boolean))).slice(0, 6).map((prophet, index) => ({
        id: `prophet-${prophet?.toLowerCase().replace(' ', '-')}`,
        kind: "Prophet" as const,
        label: prophet!,
        element: ["Earth", "Water", "Air", "Fire", "Spirit", "Water"][index] as any
      })),
      // Apostles
      ...Array.from(new Set(chapterData.map(ch => ch.apostle).filter(Boolean))).slice(0, 4).map((apostle, index) => ({
        id: `apostle-${apostle?.toLowerCase().replace(' ', '-')}`,
        kind: "Apostle" as const,
        label: apostle!,
        element: ["Water", "Fire", "Air", "Earth"][index] as any
      })),
      // Sacred frequencies
      ...Array.from(new Set(chapterData.map(ch => ch.spiritualFrequency).filter(Boolean))).slice(0, 6).map((freq, index) => ({
        id: `frequency-${index}`,
        kind: "Frequency" as const,
        label: freq!,
        element: "Spirit" as any
      })),
      // Books as book nodes
      ...Array.from(new Set(chapterData.map(ch => ch.bookName))).slice(0, 5).map((bookName, index) => ({
        id: `book-${bookName.toLowerCase().replace(' ', '-')}`,
        kind: "Book" as const,
        label: bookName,
        element: ["Fire", "Air", "Water", "Earth", "Plasma"][index] as any
      })),
      // Dimensions
      ...Array.from(new Set(chapterData.map(ch => ch.dimension).filter(Boolean))).slice(0, 7).map((dimension, index) => ({
        id: `dimension-${dimension?.replace(' ', '-').toLowerCase()}`,
        kind: "Dimension" as const,
        label: dimension!,
        element: ["Spirit", "Fire", "Air", "Water", "Earth", "Plasma", "Light"][index] as any
      }))
    ];

    const edges: FMEdge[] = [
      // Connect hub to books
      { source: "hub-yhwh", target: "chapter-book-1" },
      { source: "hub-yhwh", target: "chapter-book-2" },
      { source: "hub-yhwh", target: "chapter-book-3" },
      { source: "hub-yhwh", target: "chapter-book-4" },
      { source: "hub-yhwh", target: "chapter-book-5" },
      // Connect some stones to chapters
      { source: "chapter-book-1", target: "stone-ch1" },
      { source: "chapter-book-1", target: "stone-ch2" },
      { source: "chapter-book-2", target: "stone-ch6" },
      { source: "chapter-book-2", target: "stone-ch7" },
      // Connect tribes to prophets
      { source: "tribe-reuben", target: "prophet-hosea", relation: "PropheticApostolic" },
      { source: "tribe-simeon", target: "prophet-joel", relation: "PropheticApostolic" },
      // Connect frequencies to dimensions
      { source: "frequency-0", target: "dimension-1-glory" },
      { source: "frequency-1", target: "dimension-2-presence" }
    ];

    return { nodes, edges };
  }, [chapterData]);

  // Generation-specific matrix interface adaptations
  const interfaceSettings = useMemo(() => {
    switch(currentGeneration) {
      case 'gen_z':
        return {
          colorScheme: 'vibrant',
          typography: 'modern',
          spacing: 'compact',
          animations: true,
          complexity: 'moderate' as const
        };
      case 'millennial':
        return {
          colorScheme: 'balanced',
          typography: 'clean',
          spacing: 'comfortable',
          animations: true,
          complexity: 'detailed' as const
        };
      case 'gen_x':
        return {
          colorScheme: 'professional',
          typography: 'structured',
          spacing: 'spacious',
          animations: false,
          complexity: 'comprehensive' as const
        };
      case 'boomer':
        return {
          colorScheme: 'traditional',
          typography: 'readable',
          spacing: 'generous',
          animations: false,
          complexity: 'minimal' as const
        };
      default:
        return {
          colorScheme: 'balanced',
          typography: 'clean',
          spacing: 'comfortable',
          animations: true,
          complexity: 'moderate' as const
        };
    }
  }, [currentGeneration]);

  function ChapterCard({ chapter, isLocked, onClick }: { chapter: Chapter; isLocked: boolean; onClick: () => void }) {
    return (
      <div 
        className={`p-4 rounded-lg border cursor-pointer transition-all transform hover:scale-105 relative ${
          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
        } ${getBookColorClass(chapter.bookColor)}`}
        onClick={!isLocked ? onClick : undefined}
      >
        <div className="text-2xl mb-2 text-center">{getGeometryIcon(chapter.geometryIcon)}</div>
        <h3 className="font-bold text-sm mb-2 leading-tight">{chapter.chapterTitle}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${getElementColor(chapter.element)}-500`} />
            <span className="text-xs">{chapter.element}</span>
          </div>
          <p className="text-xs opacity-70">{chapter.templeSpace}</p>
          <p className="text-xs opacity-60">{chapter.storyStage}</p>
          <div className="text-xs text-center opacity-50">💎 {chapter.stone}</div>
          {chapter.tribe && <div className="text-xs opacity-60">🏛️ {chapter.tribe}</div>}
          {chapter.prophet && <div className="text-xs opacity-60">👑 {chapter.prophet}</div>}
          {chapter.apostle && <div className="text-xs opacity-60">✨ {chapter.apostle}</div>}
        </div>
        
        <div className="text-xs text-center mb-2 p-1 bg-black/20 rounded">
          <span className="text-cosmic-golden">♪ {chapter.spiritualFrequency}</span>
        </div>
        
        {!isLocked && (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full mt-2 text-xs py-1 h-7 bg-cosmic-golden/10 border-cosmic-golden/30 text-cosmic-golden hover:bg-cosmic-golden/20"
            onClick={(e) => openChapterChat(chapter, e)}
          >
            💬 Ask AI Coach
          </Button>
        )}
        
        {isLocked && <div className="mt-2 text-xs flex items-center justify-center gap-1">🔒 Locked</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-cosmic-navy to-cosmic-deep relative overflow-hidden">
      {/* Hebrew matrix animation background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="matrix-bg"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-cosmic-golden/20 bg-cosmic-deep/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => setLocation('/')}
              className="text-cosmic-golden hover:text-cosmic-ethereal transition-colors"
              data-testid="link-home"
            >
              ← Back to Home
            </button>
            <div className="flex items-center gap-4">
              <div className="text-sm text-cosmic-silver">
                Spiritual Level: <span className="text-cosmic-golden font-bold">{spiritualLevel}</span>
              </div>
              <div className="text-sm text-cosmic-silver">
                Progress: <span className="text-cosmic-golden font-bold">{unlockedChapters.length}/27</span>
              </div>
              <h1 className="text-xl font-bold text-cosmic-golden">The Pattern Matrix</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Generational Onboarding Guide */}
          {(currentGeneration === 'boomer' || interfaceSettings.complexity === 'comprehensive') && (
            <div className="mb-8 p-6 bg-cosmic-golden/10 rounded-lg border border-cosmic-golden/30">
              <h3 className="text-lg font-semibold text-cosmic-golden mb-3">Getting Started Guide</h3>
              <div className="space-y-2 text-sm text-cosmic-silver">
                {onboardingFlow.map((step: { title: string }, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-cosmic-golden text-cosmic-deep text-xs rounded-full flex items-center justify-center font-bold">{index + 1}</span>
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header with Generational Adaptation */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cosmic-silver mb-4">
              {adaptedMatrixContent.matrix.title}
            </h2>
            <p className="text-xl text-cosmic-silver/70 max-w-3xl mx-auto mb-6">
              {adaptedMatrixContent.matrix.description}
            </p>
            
            {/* Generation-specific features */}
            <div className="flex justify-center gap-4 mt-6">
              {currentGeneration === 'gen_z' && (
                <div className="px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <span className="text-yellow-400 text-sm">⚡ Daily Streak: {Math.floor(Math.random() * 12) + 1}</span>
                </div>
              )}
              {currentGeneration === 'millennial' && (
                <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <span className="text-blue-400 text-sm">🤝 Team Progress: 67%</span>
                </div>
              )}
              {currentGeneration === 'gen_x' && (
                <div className="px-4 py-2 bg-green-500/20 rounded-lg border border-green-400/30">
                  <span className="text-green-400 text-sm">📈 Completion Rate: 84%</span>
                </div>
              )}
            </div>
            
            {/* Achievement Progress Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex justify-between text-xs text-cosmic-silver mb-2">
                <span>Dimensions Unlocked</span>
                <span>{Object.values(dimensionProgress).filter(v => v > 0).length}/7</span>
              </div>
              <div className="w-full bg-cosmic-deep/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal h-3 rounded-full transition-all duration-500"
                  style={{width: `${(unlockedChapters.length / 27) * 100}%`}}
                />
              </div>
            </div>
          </div>

          {/* Advanced Fractal Matrix Visualization */}
          <div className="relative mb-12">
            <h3 className="text-3xl font-bold text-center text-cosmic-golden mb-8">{adaptedMatrixContent.visualization.title}</h3>
            <p className="text-center text-cosmic-silver/70 mb-6 max-w-2xl mx-auto">{adaptedMatrixContent.visualization.description}</p>
            <div className="bg-cosmic-deep/50 rounded-lg border border-cosmic-golden/30 p-4">
              <FractalMatrix
                data={fractalMatrixData}
                width={1000}
                height={600}
                enableAudio={true}
                mysteryMode={false}
                initialFocus="Hub"
                sacredOverlays={["Hub", "Chapter"]}
                onSelect={(nodeId, node) => {
                  console.log("Selected node:", nodeId, node);
                  // Could integrate with existing chapter selection
                  if (node?.kind === "Stone" && node.chapter) {
                    const chapter = chapterData.find(ch => ch.ch === node.chapter);
                    if (chapter) setActiveChapter(chapter);
                  }
                }}
                theme={{
                  background: "transparent",
                  nodeColors: generationalTheme,
                  edgeColor: '#495057',
                  textColor: '#f8f9fa',
                  highlightColor: generationalTheme.Hub
                }}
              />
            </div>
          </div>

          {/* Interactive YHWH Center */}
          <div className="relative mb-12">
            <h3 className="text-2xl font-bold text-center text-cosmic-silver mb-6">Traditional YHWH Compass</h3>
            <div className="flex justify-center">
              <div className="relative w-96 h-96 mx-auto cursor-pointer group">
                {/* Pulsing background */}
                <div className="absolute inset-0 animate-pulse bg-cosmic-golden/10 rounded-full" />
                
                {/* Improved Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 384">
                  {/* Vertical line: North (Red) to South (Teal) */}
                  <line x1="192" y1="48" x2="192" y2="336" stroke="#ef4444" strokeWidth="3" opacity="0.6"/>
                  {/* Horizontal line: East (Blue) to West (Green) */}
                  <line x1="48" y1="192" x2="336" y2="192" stroke="#3b82f6" strokeWidth="3" opacity="0.6"/>
                  {/* Center intersection point */}
                  <circle cx="192" cy="192" r="8" fill="#f59e0b" opacity="0.8"/>
                </svg>

                {/* Center - YESHUA */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-cosmic-golden to-white rounded-full border-4 border-cosmic-golden shadow-lg animate-hebrew-glow flex items-center justify-center relative cursor-pointer">
                    <span className="hebrew-letter text-2xl text-cosmic-golden">ישוע</span>
                    <div className="absolute inset-0 rounded-full bg-cosmic-golden/20 animate-ping"></div>
                  </div>
                  <p className="text-center text-cosmic-golden text-sm font-semibold mt-2">YESHUA - Book 5</p>
                </div>

                {/* Four YHWH Quadrants - Clickable Segments */}
                {yhwhQuadrants.map(quadrant => (
                  <div 
                    key={`${quadrant.letter}-${quadrant.bookNumber}`}
                    className={`absolute w-20 h-20 cursor-pointer hover:scale-110 transition-all duration-300 ${quadrant.position} ${
                      activeBook === quadrant.bookNumber ? 'ring-4 ring-cosmic-golden' : ''
                    }`}
                    onClick={() => setActiveBook(activeBook === quadrant.bookNumber ? null : quadrant.bookNumber)}
                  >
                    <div className={`w-full h-full bg-gradient-to-br from-${quadrant.color}-600 to-${quadrant.color}-800 rounded-lg border-2 border-${quadrant.color}-400 shadow-lg flex items-center justify-center`}>
                      <span className="hebrew-letter text-3xl text-white">{quadrant.hebrew}</span>
                    </div>
                    <div className="text-center mt-2">
                      <p className={`text-${quadrant.color}-400 font-semibold text-xs`}>{quadrant.title}</p>
                      <p className="text-xs text-muted-foreground">Ch {quadrant.chapters}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Fixed Directional Compass Navigation */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center text-cosmic-silver mb-6">Sacred Direction Navigator</h3>
            <div className="relative w-64 h-64 mx-auto">
              {/* North - Chapters 1-5 (Red/Fire) */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <div 
                  className="w-16 h-16 bg-red-500/30 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-red-400"
                  onClick={() => setActiveBook(1)}
                >
                  <span className="text-xs text-red-300 font-bold">1-5</span>
                  <span className="text-xs text-red-200">⚡</span>
                </div>
                <p className="text-center text-xs text-red-300 mt-1 font-semibold">North</p>
              </div>
              
              {/* East - Chapters 6-10 (Blue/Air) */}
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                <div 
                  className="w-16 h-16 bg-blue-500/30 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-blue-400"
                  onClick={() => setActiveBook(2)}
                >
                  <span className="text-xs text-blue-300 font-bold">6-10</span>
                  <span className="text-xs text-blue-200">💎</span>
                </div>
                <p className="text-center text-xs text-blue-300 mt-1 font-semibold">East</p>
              </div>
              
              {/* South - Chapters 11-15 (Teal/Water) */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <div 
                  className="w-16 h-16 bg-teal-500/30 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-teal-400"
                  onClick={() => setActiveBook(3)}
                >
                  <span className="text-xs text-teal-300 font-bold">11-15</span>
                  <span className="text-xs text-teal-200">🔮</span>
                </div>
                <p className="text-center text-xs text-teal-300 mt-1 font-semibold">South</p>
              </div>
              
              {/* West - Chapters 16-20 (Green/Earth) */}
              <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
                <div 
                  className="w-16 h-16 bg-green-500/30 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-green-400"
                  onClick={() => setActiveBook(4)}
                >
                  <span className="text-xs text-green-300 font-bold">16-20</span>
                  <span className="text-xs text-green-200">🌟</span>
                </div>
                <p className="text-center text-xs text-green-300 mt-1 font-semibold">West</p>
              </div>
              
              {/* Center - Chapters 21-25 (Gold/Plasma) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div 
                  className="w-20 h-20 bg-yellow-500/30 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all border-2 border-yellow-400"
                  onClick={() => setActiveBook(5)}
                >
                  <span className="text-xs text-yellow-300 font-bold">21-25</span>
                  <span className="text-xs text-yellow-200">✨</span>
                </div>
                <p className="text-center text-xs text-yellow-300 mt-1 font-semibold">Center</p>
              </div>
              
              {/* Compass lines */}
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 256 256">
                  <line x1="128" y1="16" x2="128" y2="240" stroke="#374151" strokeWidth="1" strokeDasharray="2,2" opacity="0.3"/>
                  <line x1="16" y1="128" x2="240" y2="128" stroke="#374151" strokeWidth="1" strokeDasharray="2,2" opacity="0.3"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Progressive Chapter Display */}
          {activeBook && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-center text-cosmic-silver mb-6">
                Book {activeBook}: {yhwhQuadrants.find(q => q.bookNumber === activeBook)?.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {chapterData
                  .filter(ch => ch.book === `Book ${activeBook}`)
                  .map(chapter => (
                    <ChapterCard 
                      key={chapter.ch}
                      chapter={chapter}
                      isLocked={!unlockedChapters.includes(chapter.ch)}
                      onClick={() => setActiveChapter(chapter)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Book 5 Access */}
          <div className="mb-12">
            <div className="text-center p-6 bg-gradient-to-br from-cosmic-golden/20 to-yellow-500/20 rounded-lg border border-cosmic-golden/30 max-w-md mx-auto">
              <div className="hebrew-letter text-3xl mb-4 text-cosmic-golden">ישוע</div>
              <h3 className="font-semibold text-cosmic-golden text-lg mb-2">Book 5: Pattern Manifesto</h3>
              <p className="text-sm text-muted-foreground mb-4">Chapters 21-25</p>
              <button 
                className="px-6 py-2 bg-cosmic-golden text-cosmic-deep rounded-lg font-semibold hover:bg-cosmic-golden/80 transition-colors"
                onClick={() => setActiveBook(5)}
              >
                Explore Pattern Manifesto
              </button>
            </div>
          </div>

          {/* The Pattern & Ripple */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center text-cosmic-silver mb-6">25 Fractal Tiers: The Pattern & The Ripple</h3>
            <div className="flex justify-center gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-cosmic-golden/20 to-white/10 rounded-lg border border-cosmic-golden/30 max-w-xs">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cosmic-golden to-white rounded-full border-4 border-cosmic-golden shadow-lg animate-hebrew-glow flex items-center justify-center">
                  <span className="hebrew-letter text-xl text-cosmic-golden">∞</span>
                </div>
                <h3 className="font-semibold text-cosmic-golden mb-2 text-lg">26: The Pattern</h3>
                <p className="text-sm text-muted-foreground mb-2">Christ - Perfect Alignment</p>
                <p className="text-xs text-cosmic-golden">Optimal Fractal Dimension (2.8)</p>
                <p className="text-xs text-cosmic-silver/70 mt-2">Where every decision resonates with purpose</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-cosmic-ethereal/20 to-cosmic-golden/10 rounded-lg border border-cosmic-ethereal/30 max-w-xs">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cosmic-ethereal to-cosmic-golden rounded-full border-4 border-cosmic-ethereal shadow-lg animate-pulse-slow flex items-center justify-center">
                  <span className="hebrew-letter text-xl text-cosmic-ethereal">🕸️</span>
                </div>
                <h3 className="font-semibold text-cosmic-ethereal mb-2 text-lg">27: The Ripple</h3>
                <p className="text-sm text-muted-foreground mb-2">Paul - Influence Spread</p>
                <p className="text-xs text-cosmic-ethereal">Cascade Network</p>
                <p className="text-xs text-cosmic-silver/70 mt-2">How leadership patterns ripple through teams</p>
              </div>
            </div>
          </div>

          {/* Active Chapter Detail Modal */}
          {activeChapter && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className={`max-w-lg w-full rounded-lg border-2 p-6 ${getBookColorClass(activeChapter.bookColor)}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">{activeChapter.chapterTitle}</h3>
                  <button 
                    onClick={() => setActiveChapter(null)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{getGeometryIcon(activeChapter.geometryIcon)}</div>
                  <p className="text-lg font-semibold">Chapter {activeChapter.ch}</p>
                  <p className="text-sm text-cosmic-silver/70">{activeChapter.bookTheme}</p>
                </div>
                <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  <p><span className="font-semibold">Divine Name:</span> {activeChapter.divineName}</p>
                  <p><span className="font-semibold">Element:</span> {activeChapter.element}</p>
                  <p><span className="font-semibold">Temple Space:</span> {activeChapter.templeSpace}</p>
                  <p><span className="font-semibold">Story Stage:</span> {activeChapter.storyStage}</p>
                  <p><span className="font-semibold">Dimension:</span> {activeChapter.dimension}</p>
                  <p><span className="font-semibold">Fractal Gate:</span> {activeChapter.fractalGate}</p>
                  <p><span className="font-semibold">Stone:</span> {activeChapter.stone}</p>
                  <p><span className="font-semibold">Spiritual Frequency:</span> {activeChapter.spiritualFrequency}</p>
                  {activeChapter.tribe && <p><span className="font-semibold">Tribe:</span> {activeChapter.tribe}</p>}
                  {activeChapter.prophet && <p><span className="font-semibold">Prophet:</span> {activeChapter.prophet}</p>}
                  {activeChapter.apostle && <p><span className="font-semibold">Apostle:</span> {activeChapter.apostle}</p>}
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={unlockNextChapter}
                    className="flex-1 px-4 py-2 bg-cosmic-golden text-cosmic-deep rounded-lg font-semibold hover:bg-cosmic-golden/80 transition-colors"
                    disabled={unlockedChapters.length >= 27}
                  >
                    {unlockedChapters.length >= 27 ? '✓ All Unlocked' : '🔓 Unlock Next Chapter'}
                  </button>
                  <button 
                    onClick={() => setActiveChapter(null)}
                    className="px-4 py-2 border border-cosmic-silver/30 rounded-lg hover:bg-cosmic-silver/10 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced 7-Dimension Achievement System */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center text-cosmic-silver mb-6">Sacred Dimensions Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 max-w-6xl mx-auto">
              {Object.entries(dimensionProgress).map(([dimension, count]) => (
                <div key={dimension} className="text-center p-4 bg-cosmic-deep/30 rounded-lg border border-cosmic-silver/20 hover:border-cosmic-golden/50 transition-colors">
                  <div className="text-2xl mb-2">
                    {dimension === '1 Glory' && '⚡'}
                    {dimension === '2 Presence' && '💎'}
                    {dimension === '3 Voice' && '🔮'}
                    {dimension === '4 Word' && '🌟'}
                    {dimension === '5 Image' && '✨'}
                    {dimension === '6 Spirit' && '🌺'}
                    {dimension === '7 Name' && '♾️'}
                  </div>
                  <h4 className="font-semibold text-xs text-cosmic-silver">{dimension}</h4>
                  <p className="text-cosmic-golden font-bold text-sm">{count}/5</p>
                  <div className="w-full bg-cosmic-deep/50 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-cosmic-golden h-1.5 rounded-full transition-all duration-500"
                      style={{width: `${(count / 5) * 100}%`}}
                    />
                  </div>
                  {count === 5 && <div className="text-xs text-cosmic-golden mt-1">✓ Mastered</div>}
                </div>
              ))}
            </div>
          </div>

          {/* AI Chat Integration Modal */}
          {showChat && chatContext && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-cosmic-deep border border-cosmic-golden/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-cosmic-golden/20 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-cosmic-golden">{chatContext.chapterTitle}</h3>
                    <p className="text-sm text-cosmic-silver">{chatContext.bookTheme} • {chatContext.element} • {chatContext.templeSpace}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                    className="text-cosmic-silver hover:text-cosmic-golden"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-cosmic-golden text-cosmic-deep' 
                          : 'bg-cosmic-silver/10 text-cosmic-silver border border-cosmic-silver/20'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-cosmic-golden/20">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Ask about ${chatContext.chapterTitle}...`}
                      className="flex-1 px-3 py-2 bg-cosmic-deep/50 border border-cosmic-silver/20 rounded-lg text-cosmic-silver placeholder-cosmic-silver/50 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          sendChatMessage(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="bg-cosmic-golden text-cosmic-deep hover:bg-cosmic-golden/80"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          sendChatMessage(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>
                  
                  {/* Quick Questions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => sendChatMessage(`What does the ${chatContext.element} element teach us about leadership?`)}
                      className="px-3 py-1 text-xs bg-cosmic-ethereal/20 border border-cosmic-ethereal/30 text-cosmic-ethereal rounded-full hover:bg-cosmic-ethereal/30 transition-colors"
                    >
                      Element Meaning
                    </button>
                    <button
                      onClick={() => sendChatMessage(`How does ${chatContext.templeSpace} relate to my leadership journey?`)}
                      className="px-3 py-1 text-xs bg-cosmic-ethereal/20 border border-cosmic-ethereal/30 text-cosmic-ethereal rounded-full hover:bg-cosmic-ethereal/30 transition-colors"
                    >
                      Temple Significance
                    </button>
                    <button
                      onClick={() => sendChatMessage(`What is the deeper meaning of ${chatContext.stone}?`)}
                      className="px-3 py-1 text-xs bg-cosmic-ethereal/20 border border-cosmic-ethereal/30 text-cosmic-ethereal rounded-full hover:bg-cosmic-ethereal/30 transition-colors"
                    >
                      Stone Wisdom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-primary/20 p-12">
            <h2 className="text-3xl font-bold mb-4 text-cosmic-silver">Ready to Navigate the Matrix?</h2>
            <p className="text-xl text-cosmic-silver/70 mb-8 max-w-2xl mx-auto">
              Begin your journey through the biblical leadership framework and discover 
              your divine calling in the pattern of creation.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/assessment')}
                className="px-12 py-4 text-lg bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal hover:from-cosmic-ethereal hover:to-cosmic-golden transition-all"
                data-testid="button-start-assessment"
              >
                🧭 Start Your Assessment
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="px-12 py-4 text-lg border-cosmic-golden/50 text-cosmic-golden hover:bg-cosmic-golden/10"
                data-testid="button-login"
              >
                🔑 Access Your Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}