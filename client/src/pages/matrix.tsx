import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect, useRef } from "react";
import { X, Play, BookOpen, ArrowRight, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProgress, CHAPTERS, Chapter } from "@shared/schema";
import { getElementColor } from "@/lib/sacred-geometry";
import ChapterProgress from '@/components/chapter-progress';
import GeometricShapeDisplay from '@/components/geometric-shape-display';
import MatrixCompassMap from '@/components/MatrixCompassMap';
import { toast } from '@/hooks/use-toast';

// Use CHAPTERS from shared schema - centralized data source

// Remove duplicate types - using shared schema types

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
  
  // Extract URL parameters including assessment results
  const urlParams = new URLSearchParams(window.location.search);
  const chapter = urlParams.get('chapter');
  const archetypeFromUrl = urlParams.get('archetype');
  const generationFromUrl = urlParams.get('generation');
  
  // Assessment result state for new users
  const [assessmentResults, setAssessmentResults] = useState<{
    archetype?: string;
    generation?: string;
  } | null>(null);
  
  // ALL HOOKS MUST BE DECLARED AT THE TOP - BEFORE ANY CONDITIONAL LOGIC OR RETURNS
  const [activeBook, setActiveBook] = useState<number | null>(null);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [showChapterDetail, setShowChapterDetail] = useState<boolean>(false);
  const [selectedChapterForDetail, setSelectedChapterForDetail] = useState<Chapter | null>(null);
  const [hasAutoRedirected, setHasAutoRedirected] = useState<boolean>(false);
  const [showOnboardingWelcome, setShowOnboardingWelcome] = useState<boolean>(false);
  const [newlyUnlockedShapes, setNewlyUnlockedShapes] = useState<Set<string>>(new Set());
  const [showWelcomeMessage, setShowWelcomeMessage] = useState<boolean>(false);
  
  // Use refs for proper initialization tracking
  const initialized = useRef(false);
  const prevShapesRef = useRef<string[] | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch user progress - Allow for guests with fallback (MOVED UP to prevent TDZ errors)
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      if (!user) return null; // Return null for guests, don't make request
      const response = await fetch('/api/user-progress');
      if (!response.ok) return null;
      return await response.json();
    },
    enabled: true, // Always enabled, but query function handles guest case
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
  
  // Handle assessment results from URL parameters
  useEffect(() => {
    if (archetypeFromUrl && generationFromUrl) {
      setAssessmentResults({
        archetype: archetypeFromUrl,
        generation: generationFromUrl
      });
      
      // Show welcome message for new assessment completers
      if (!userProgress?.completedChapters?.length) {
        setShowWelcomeMessage(true);
        toast({
          title: `Welcome, ${archetypeFromUrl.charAt(0).toUpperCase() + archetypeFromUrl.slice(1)} Leader! 🌟`,
          description: `Your ${generationFromUrl.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} generation brings unique strengths to leadership. Let's begin your journey!`,
          duration: 6000,
        });
      }
    }
  }, [archetypeFromUrl, generationFromUrl, userProgress?.completedChapters?.length]);
  
  // Effect to track newly unlocked shapes - FIXED to detect first unlock
  useEffect(() => {
    if (userProgress?.sacredShapesMastered) {
      const currentShapes = userProgress.sacredShapesMastered;
      
      // Initialize tracking on first run
      if (!initialized.current) {
        initialized.current = true;
        prevShapesRef.current = [...currentShapes];
        return; // Don't animate on initialization
      }
      
      // Compare with previous to find newly unlocked shapes
      if (prevShapesRef.current) {
        const newlyUnlocked = currentShapes.filter(shape => !prevShapesRef.current!.includes(shape));
        
        if (newlyUnlocked.length > 0) {
          // Add to animation set
          setNewlyUnlockedShapes(prev => {
            const newSet = new Set(prev);
            newlyUnlocked.forEach(shape => newSet.add(shape));
            return newSet;
          });
          
          // Call toast notification for each newly unlocked shape
          newlyUnlocked.forEach(shape => {
            // Find the chapter that corresponds to this shape
            const correspondingChapter = CHAPTERS.find(ch => ch.geometryIcon === shape);
            if (correspondingChapter) {
              showShapeUnlockNotification(shape, correspondingChapter.ch);
            }
          });
        }
      }
      
      // Update previous reference
      prevShapesRef.current = [...currentShapes];
    }
  }, [userProgress?.sacredShapesMastered]); // FIXED: Removed dependency loop
  
  // Clear animation callback
  const handleAnimationComplete = (geometryIcon: string) => {
    setNewlyUnlockedShapes(prev => {
      const newSet = new Set(prev);
      newSet.delete(geometryIcon);
      return newSet;
    });
  };
  
  // Shape unlock notification function
  const showShapeUnlockNotification = (geometryIcon: string, chapterNumber: number) => {
    const chapter = CHAPTERS.find(c => c.ch === chapterNumber);
    toast({
      title: "Sacred Shape Unlocked! ✨",
      description: `${geometryIcon} - Chapter ${chapterNumber}: ${chapter?.chapterTitle || 'Leadership Journey'}`,
      duration: 4000,
    });
  };

  // Progress mutations
  const completeChapterMutation = useMutation({
    mutationFn: async (chapterNumber: number) => {
      const response = await fetch('/api/user-progress/complete-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber })
      });
      if (!response.ok) throw new Error('Failed to complete chapter');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache - the useEffect will automatically detect unlock and handle animations/toasts
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    }
  });
  
  const unlockDimensionMutation = useMutation({
    mutationFn: async (dimension: string) => {
      const response = await fetch('/api/user-progress/unlock-dimension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimension })
      });
      if (!response.ok) throw new Error('Failed to unlock dimension');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    }
  });
  
  // Simplified - no assessment tools needed for core matrix flow
  
  // Matrix content
  const matrixContent = {
    matrix: {
      title: 'Interactive Biblical Leadership Matrix',
      description: '27 Chapters: The Complete Leadership Journey',
      callToAction: 'Explore Matrix',
      duration: '10 min exploration',
      format: 'interactive'
    },
    visualization: {
      title: 'Sacred Geometric Matrix Map',
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

  // YHWH Quadrants for the compass display
  const yhwhQuadrants = [
    {
      letter: 'Yod', hebrew: 'י', title: 'Becoming Rooted', bookNumber: 1, 
      chapters: '1-5', color: 'red', position: 'top-8 left-1/2 transform -translate-x-1/2'
    },
    {
      letter: 'Heh', hebrew: 'ה', title: 'Becoming Aligned', bookNumber: 2,
      chapters: '6-10', color: 'blue', position: 'right-8 top-1/2 transform -translate-y-1/2'
    },
    {
      letter: 'Vav', hebrew: 'ו', title: 'Becoming Clear', bookNumber: 3,
      chapters: '11-15', color: 'teal', position: 'bottom-8 left-1/2 transform -translate-x-1/2'
    },
    {
      letter: 'Final Heh', hebrew: 'ה', title: 'Becoming Embodied', bookNumber: 4,
      chapters: '16-20', color: 'green', position: 'left-8 top-1/2 transform -translate-y-1/2'
    }
  ];

  // Simplified theme colors
  const theme = {
    Hub: "#ffd43b",
    Chapter: "#74c0fc",
    Stone: "#69db7c", 
    Tribe: "#ff6b6b",
    Prophet: "#da77f2",
    Apostle: "#fd7e14",
    Frequency: "#20c997",
    Book: "#6f42c1", 
    Dimension: "#e83e8c"
  };
  
  // Simplified - show all 27 chapters in order without filtering

  // Enhanced 7-dimension tracking using UserProgress
  const completedChapters = userProgress?.completedChapters || [];
  const unlockedDimensions = userProgress?.unlockedDimensions || [];
  const sacredShapesMastered = userProgress?.sacredShapesMastered || [];
  
  // Helper function to determine if a geometric shape is unlocked
  const isShapeUnlocked = (geometryIcon: string): boolean => {
    return sacredShapesMastered.includes(geometryIcon);
  };
  
  // Count unlocked shapes for progress display
  const unlockedShapesCount = sacredShapesMastered.length;
  
  // Auto-redirect to onboarding welcome logic (placed after completedChapters is declared)
  useEffect(() => {
    // Only auto-redirect if no specific chapter is selected and user hasn't been redirected yet
    if (!chapter && !hasAutoRedirected && CHAPTERS.length > 0) {
      // Check if user is new (no completed chapters)
      if (completedChapters.length === 0) {
        setShowOnboardingWelcome(true);
      } else {
        // Returning user - go to their current chapter or next available
        const currentChapterNum = userProgress?.currentChapterId ? parseInt(userProgress.currentChapterId) : 1;
        const currentChapter = CHAPTERS.find(ch => ch.ch === currentChapterNum);
        if (currentChapter) {
          setSelectedChapterForDetail(currentChapter);
          setShowChapterDetail(true);
        }
      }
      setHasAutoRedirected(true);
    }
  }, [chapter, hasAutoRedirected, userProgress?.completedChapters?.length, userProgress]);
  
  // Chapter navigation helpers
  const getCurrentChapterNumber = () => {
    if (selectedChapterForDetail) return selectedChapterForDetail.ch;
    if (userProgress?.currentChapterId) return parseInt(userProgress.currentChapterId);
    return 1; // Default to Chapter 1
  };
  
  const getNextChapter = (currentChapterNumber: number) => {
    return CHAPTERS.find(ch => ch.ch === currentChapterNumber + 1);
  };
  
  const getPreviousChapter = (currentChapterNumber: number) => {
    return CHAPTERS.find(ch => ch.ch === currentChapterNumber - 1);
  };
  
  const startJourney = (startChapter: Chapter) => {
    setActiveChapter(startChapter);
    setShowChapterDetail(false);
    
    // Complete the chapter and advance to next (only if user is authenticated)
    if (user && completeChapterMutation && startChapter.ch) {
      completeChapterMutation.mutate(startChapter.ch);
    }
    
    // Automatically advance to next chapter after a brief delay
    setTimeout(() => {
      const nextChapter = getNextChapter(startChapter.ch);
      if (nextChapter) {
        setSelectedChapterForDetail(nextChapter);
        setShowChapterDetail(true);
      }
    }, 2000);
  };
  
  const navigateToNextChapter = () => {
    const current = getCurrentChapterNumber();
    const nextChapter = getNextChapter(current);
    if (nextChapter) {
      setSelectedChapterForDetail(nextChapter);
      setShowChapterDetail(true);
    }
  };
  
  const navigateToPreviousChapter = () => {
    const current = getCurrentChapterNumber();
    const prevChapter = getPreviousChapter(current);
    if (prevChapter) {
      setSelectedChapterForDetail(prevChapter);
      setShowChapterDetail(true);
    }
  };
  
  const dimensionProgress = {
    '1 Glory': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '1 Glory').length,
    '2 Presence': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '2 Presence').length,
    '3 Voice': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '3 Voice').length,
    '4 Word': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '4 Word').length,
    '5 Spirit': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '5 Spirit').length,
    '6 Image': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '6 Image').length,
    '7 Name': completedChapters.filter((ch: number) => CHAPTERS[ch-1]?.dimension === '7 Name').length
  };

  // Additional memoized computations that need to be at top level
  const fractalMatrixData = useMemo(() => {
    // This needs to be defined here since it was originally after conditional returns
    const nodes = CHAPTERS.map((chapter, index) => ({
      id: `chapter-${chapter.ch}`,
      kind: 'Chapter',
      label: chapter.chapterTitle,
      element: chapter.element,
      data: {
        chapterNumber: chapter.ch,
        title: chapter.chapterTitle,
        book: chapter.bookName,
        element: chapter.element,
        dimension: chapter.dimension,
        color: getElementColor(chapter.element)
      },
      position: { x: index * 150, y: index * 100 },
      style: { background: getElementColor(chapter.element) }
    }));

    const edges = CHAPTERS.slice(0, -1).map((chapter, index) => ({
      id: `edge-${chapter.ch}-${chapter.ch + 1}`,
      source: `chapter-${chapter.ch}`,
      target: `chapter-${chapter.ch + 1}`,
      type: 'smoothstep',
      style: { stroke: getElementColor(chapter.element) }
    }));

    return { nodes, edges };
  }, []);

  const interfaceSettings = {
    theme: theme,
    layout: 'comfortable',
    interactions: true,
    accessibility: true
  };
  
  // NOW CONDITIONAL LOGIC AND EARLY RETURNS CAN HAPPEN AFTER ALL HOOKS
  
  // Check for demo login or authentication
  const isDemoUser = user && (user as any).isDemo;
  const isAuthenticated = user && ((user as any).id || (user as any).claims?.sub || (user as any).sub);
  
  // Allow all users to access the matrix
  
  // Show enhanced ChapterProgress if no specific chapter is selected and user is authenticated
  if (!chapter && user && isAuthenticated) {
    const userId = (user as any).id || (user as any).claims?.sub || (user as any).sub;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="matrix-title">Biblical Leadership Matrix</h1>
            <p className="text-gray-300 text-lg">Your 27-chapter journey to biblical leadership</p>
          </div>
          <ChapterProgress 
            userId={userId} 
          />
        </div>
      </div>
    );
  }

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


  const goToDirection = (direction: string): void => {
    const directionChapters = CHAPTERS.filter(ch => ch.directionalMapping === direction);
    if (directionChapters.length > 0) {
      setActiveChapter(directionChapters[0]);
    }
  };


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
                Spiritual Level: <span className="text-cosmic-golden font-bold">{Math.floor((completedChapters.length) / 5) + 1}</span>
              </div>
              <div className="text-sm text-cosmic-silver">
                Progress: <span className="text-cosmic-golden font-bold">{completedChapters.length}/27</span>
              </div>
              <h1 className="text-xl font-bold text-cosmic-golden">The Pattern Matrix</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Core Matrix Features */}

          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cosmic-silver mb-4">
              The Fractal Leadership Matrix
            </h2>
            <p className="text-xl text-cosmic-silver/70 max-w-3xl mx-auto mb-6">
              27 Chapters of Biblical Leadership Development: The Pattern (Christ) & The Ripple (Paul)
            </p>
            
            {/* Progress features */}
            <div className="flex justify-center gap-4 mt-6">
              <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <span className="text-blue-400 text-sm">📚 Chapters: {completedChapters.length}/27</span>
              </div>
              <div className="px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <span className="text-purple-400 text-sm">🔯 Shapes: {unlockedShapesCount}</span>
              </div>
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
                  style={{width: `${(completedChapters.length / 27) * 100}%`}}
                />
              </div>
            </div>
          </div>

          {/* Simplified Chapter Journey Focus */}
          <div className="relative mb-12">
            <h3 className="text-3xl font-bold text-center text-cosmic-golden mb-8">Your Biblical Leadership Journey</h3>
            <p className="text-center text-cosmic-silver/70 mb-6 max-w-2xl mx-auto">
              Follow the sacred path through 27 chapters of transformational leadership development
            </p>
            
            {/* Journey Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 text-red-400">י</div>
                <h4 className="font-bold text-red-300 mb-2">Chapters 1-5</h4>
                <p className="text-red-200 text-sm">Becoming Rooted</p>
                <p className="text-red-200/70 text-xs mt-2">Fire • North • Identity</p>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 text-blue-400">ה</div>
                <h4 className="font-bold text-blue-300 mb-2">Chapters 6-10</h4>
                <p className="text-blue-200 text-sm">Becoming Aligned</p>
                <p className="text-blue-200/70 text-xs mt-2">Air • East • Patterns</p>
              </div>
              
              <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 text-teal-400">ו</div>
                <h4 className="font-bold text-teal-300 mb-2">Chapters 11-15</h4>
                <p className="text-teal-200 text-sm">Becoming Clear</p>
                <p className="text-teal-200/70 text-xs mt-2">Water • South • Vision</p>
              </div>
              
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 text-green-400">ה</div>
                <h4 className="font-bold text-green-300 mb-2">Chapters 16-20</h4>
                <p className="text-green-200 text-sm">Becoming Embodied</p>
                <p className="text-green-200/70 text-xs mt-2">Earth • West • Action</p>
              </div>
            </div>
            
            {/* Center - Final Chapters */}
            <div className="mt-8 max-w-lg mx-auto">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3 text-yellow-400">ישוע</div>
                <h4 className="font-bold text-yellow-300 mb-2">Chapters 21-27</h4>
                <p className="text-yellow-200 text-sm">The Pattern Manifesto</p>
                <p className="text-yellow-200/70 text-xs mt-2">Plasma • Center • Jesus Complete</p>
              </div>
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
                {CHAPTERS
                  .filter(ch => ch.book === `Book ${activeBook}`)
                  .map(chapter => (
                    <ChapterCard 
                      key={chapter.ch}
                      chapter={chapter}
                      isLocked={!completedChapters.includes(chapter.ch)}
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

          {/* Journey Map - Sequential 1→27 Leadership Progression */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-cosmic-silver mb-4">Leadership Journey Map</h3>
              <div className="text-cosmic-golden text-lg font-semibold mb-2">
                {unlockedShapesCount} of 27 Sacred Shapes Unlocked
              </div>
              <div className="w-full max-w-md mx-auto bg-cosmic-deep/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal h-3 rounded-full transition-all duration-700"
                  style={{width: `${(unlockedShapesCount / 27) * 100}%`}}
                />
              </div>
              <p className="text-cosmic-silver/70 text-sm mt-2">
                Follow the sequential journey from Chapter 1 to Chapter 27
              </p>
            </div>

            {/* Unified YHWH Compass-Spiral Map Container */}
            <div className="max-w-7xl mx-auto min-h-[900px] bg-cosmic-deep/20 rounded-2xl border border-cosmic-silver/20 overflow-hidden">
              <MatrixCompassMap
                chapters={CHAPTERS}
                completedChapters={completedChapters}
                currentChapter={getCurrentChapterNumber()}
                unlockedShapes={sacredShapesMastered}
                onChapterClick={(chapter) => {
                  setSelectedChapterForDetail(chapter);
                  setShowChapterDetail(true);
                }}
                newlyUnlockedShapes={newlyUnlockedShapes}
                onAnimationComplete={handleAnimationComplete}
              />
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
                    onClick={() => {/* Will implement chapter completion flow later */}}
                    className="flex-1 px-4 py-2 bg-cosmic-golden text-cosmic-deep rounded-lg font-semibold hover:bg-cosmic-golden/80 transition-colors"
                    disabled={completedChapters.length >= 27}
                  >
                    {completedChapters.length >= 27 ? '✓ All Complete' : '📖 Continue Journey'}
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

          {/* Onboarding Welcome Modal */}
          {showOnboardingWelcome && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
              <div className="bg-gradient-to-br from-cosmic-deep via-cosmic-void to-cosmic-deep border border-cosmic-golden/30 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="relative p-8 text-center">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-blue-900/20 via-teal-900/20 to-green-900/20 animate-pulse"></div>
                  <div className="relative z-10">
                    {/* Assessment Results Personalization */}
                    {assessmentResults && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-cosmic-golden/10 via-cosmic-ethereal/10 to-cosmic-golden/10 rounded-xl border border-cosmic-golden/30">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-4xl">
                            {assessmentResults.archetype === 'pioneer' && '🚀'}
                            {assessmentResults.archetype === 'organizer' && '🗂️'}
                            {assessmentResults.archetype === 'builder' && '🏗️'}
                            {assessmentResults.archetype === 'guardian' && '🛡️'}
                          </div>
                          <div className="text-center">
                            <h2 className="text-2xl font-bold text-cosmic-golden">
                              {assessmentResults.archetype?.charAt(0).toUpperCase() + assessmentResults.archetype?.slice(1)} Leader
                            </h2>
                            <p className="text-cosmic-silver text-sm">
                              {assessmentResults.generation?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Generation
                            </p>
                          </div>
                        </div>
                        <div className="text-center text-cosmic-silver/80 text-sm">
                          <p className="mb-2">
                            <strong className="text-cosmic-golden">Your Leadership Style:</strong> {' '}
                            {assessmentResults.archetype === 'pioneer' && 'You break new ground and explore possibilities with vision and courage.'}
                            {assessmentResults.archetype === 'organizer' && 'You bring people together and create harmony through collaboration.'}
                            {assessmentResults.archetype === 'builder' && 'You create strong foundations and lasting systems with methodical excellence.'}
                            {assessmentResults.archetype === 'guardian' && 'You protect and preserve what matters most with wisdom and strength.'}
                          </p>
                          <p>
                            <strong className="text-cosmic-golden">Generational Approach:</strong> {' '}
                            {assessmentResults.generation === 'gen-z' && 'Interactive, visual learning with immediate application and authentic leadership.'}
                            {assessmentResults.generation === 'millennial' && 'Community-based learning with meaningful impact and purpose-driven focus.'}
                            {assessmentResults.generation === 'gen-x' && 'Practical application with clear ROI, efficiency, and work-life balance.'}
                            {assessmentResults.generation === 'boomer' && 'Traditional study enhanced with modern tools and relationship-focused mentorship.'}
                            {assessmentResults.generation === 'silent' && 'Classical approach with deep theological foundation and institutional wisdom.'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-8xl mb-6 animate-bounce">🌟</div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cosmic-golden via-cosmic-ethereal to-cosmic-golden bg-clip-text text-transparent mb-4">
                      {assessmentResults ? `Welcome, ${assessmentResults.archetype?.charAt(0).toUpperCase() + assessmentResults.archetype?.slice(1)} Leader!` : 'Welcome to Your Biblical Leadership Journey!'}
                    </h1>
                    <p className="text-xl text-cosmic-silver/90 mb-6 max-w-3xl mx-auto leading-relaxed">
                      You're about to embark on a transformative <strong className="text-cosmic-golden">27-chapter journey</strong> through biblical leadership principles. 
                      Each chapter builds upon the last, taking you from foundational identity to complete embodiment of biblical leadership.
                      {assessmentResults && (
                        <span className="block mt-2 text-lg text-cosmic-golden/90">
                          This journey has been customized for your {assessmentResults.archetype} leadership style and {assessmentResults.generation?.replace('-', ' ')} perspective.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-8 pb-6">
                  {/* Journey Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-red-300 mb-3 flex items-center">
                        <span className="text-3xl mr-2">י</span> Chapters 1-5: Becoming Rooted
                      </h3>
                      <p className="text-red-200/80 text-sm">
                        <strong>Focus:</strong> Identity, Calling, Formation of Glory<br/>
                        <strong>Element:</strong> Fire (North)<br/>
                        <strong>Foundation:</strong> "Leadership Begins at the Altar"
                      </p>
                    </div>
                    
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-blue-300 mb-3 flex items-center">
                        <span className="text-3xl mr-2">ה</span> Chapters 6-10: Becoming Aligned
                      </h3>
                      <p className="text-blue-200/80 text-sm">
                        <strong>Focus:</strong> Patterns & Spiritual Core<br/>
                        <strong>Element:</strong> Air (East)<br/>
                        <strong>Key:</strong> Divine Pattern & YHWH Structure
                      </p>
                    </div>
                    
                    <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-teal-300 mb-3 flex items-center">
                        <span className="text-3xl mr-2">ו</span> Chapters 11-15: Becoming Clear
                      </h3>
                      <p className="text-teal-200/80 text-sm">
                        <strong>Focus:</strong> Vision & Emotional Intelligence<br/>
                        <strong>Element:</strong> Water (South)<br/>
                        <strong>Core:</strong> Inner Compass & Sacred Sight
                      </p>
                    </div>
                    
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-green-300 mb-3 flex items-center">
                        <span className="text-3xl mr-2">ה</span> Chapters 16-20: Becoming Embodied
                      </h3>
                      <p className="text-green-200/80 text-sm">
                        <strong>Focus:</strong> Walking in Wisdom & Glory<br/>
                        <strong>Element:</strong> Earth (West)<br/>
                        <strong>Goal:</strong> Embodied Leadership
                      </p>
                    </div>
                  </div>
                  
                  {/* Center Section */}
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
                    <h3 className="text-xl font-bold text-yellow-300 mb-3 text-center flex items-center justify-center">
                      <span className="text-3xl mr-2">ש</span> Chapters 21-27: The Pattern Manifesto
                    </h3>
                    <p className="text-yellow-200/80 text-sm text-center">
                      <strong>Focus:</strong> Jesus, the Fractal Fulfillment & Apostolic Flame<br/>
                      <strong>Element:</strong> Plasma (Center)<br/>
                      <strong>Culmination:</strong> Living as YESHUA Pattern Complete
                    </p>
                  </div>
                  
                  {/* Your Starting Point */}
                  <div className="bg-cosmic-golden/10 border border-cosmic-golden/30 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-cosmic-golden mb-4 text-center">
                      🚀 Your Journey Begins: Chapter 1
                    </h3>
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">⬜</div>
                      <h4 className="text-xl font-semibold text-cosmic-silver">"Leadership Begins at the Altar"</h4>
                      <p className="text-cosmic-silver/70 mt-2">
                        Fire Element • Sardius Stone • North Direction<br/>
                        <em>"Every true leader must first encounter the sacred."</em>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 border-t border-cosmic-golden/20 bg-cosmic-void/30">
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        setShowOnboardingWelcome(false);
                        const chapter1 = CHAPTERS.find(ch => ch.ch === 1);
                        if (chapter1) {
                          setSelectedChapterForDetail(chapter1);
                          setShowChapterDetail(true);
                        }
                      }}
                      className="px-10 py-4 text-lg bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal hover:from-cosmic-ethereal hover:to-cosmic-golden text-cosmic-deep font-bold transition-all shadow-lg"
                      data-testid="button-begin-journey"
                    >
                      🌅 Begin Your Journey at Chapter 1
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setShowOnboardingWelcome(false)}
                      className="px-8 py-4 text-lg border-cosmic-silver/30 text-cosmic-silver hover:border-cosmic-golden hover:text-cosmic-golden"
                      data-testid="button-explore-matrix"
                    >
                      🗺️ Explore Matrix First
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-cosmic-silver/60">
                      💡 <strong>Tip:</strong> Follow the chapters in order (1→2→3...→27) for the complete transformational experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Detail Modal */}
          {showChapterDetail && selectedChapterForDetail && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-cosmic-deep border border-cosmic-golden/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-cosmic-golden/20">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-4xl">
                          {selectedChapterForDetail.geometryIcon === 'Square' && '⬜'}
                          {selectedChapterForDetail.geometryIcon === 'Equilateral Triangle' && '🔺'}
                          {selectedChapterForDetail.geometryIcon === '2D Spiral' && '🌀'}
                          {selectedChapterForDetail.geometryIcon === 'Isometric Cube' && '🎲'}
                          {selectedChapterForDetail.geometryIcon === 'Monad Unity Point' && '⚫'}
                          {!['Square', 'Equilateral Triangle', '2D Spiral', 'Isometric Cube', 'Monad Unity Point'].includes(selectedChapterForDetail.geometryIcon) && '◯'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-cosmic-silver/70 font-medium mb-1">
                            Chapter {selectedChapterForDetail.ch} of 27 • {selectedChapterForDetail.bookName}
                          </div>
                          <h2 className="text-2xl font-bold text-cosmic-golden mb-2">
                            {selectedChapterForDetail.chapterTitle}
                          </h2>
                          <div className="flex gap-4 text-sm text-cosmic-silver">
                            <span className="flex items-center gap-1">
                              🔥 {selectedChapterForDetail.element}
                            </span>
                            <span className="flex items-center gap-1">
                              💎 {selectedChapterForDetail.stone}
                            </span>
                            <span className="flex items-center gap-1">
                              🏛️ {selectedChapterForDetail.templeSpace}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChapterDetail(false)}
                      className="text-cosmic-silver hover:text-cosmic-golden"
                      data-testid="button-close-chapter-detail"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="bg-cosmic-deep/50 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal h-3 rounded-full transition-all duration-500"
                      style={{width: `${(selectedChapterForDetail.ch / 27) * 100}%`}}
                    />
                  </div>
                  <div className="text-center text-xs text-cosmic-silver/70">
                    Progress: {selectedChapterForDetail.ch} / 27 chapters ({Math.round((selectedChapterForDetail.ch / 27) * 100)}%)
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Book Theme */}
                    <div>
                      <h3 className="text-lg font-semibold text-cosmic-silver mb-2">Book Theme</h3>
                      <p className="text-cosmic-silver/80">{selectedChapterForDetail.bookTheme}</p>
                    </div>
                    
                    {/* Sacred Elements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-cosmic-void/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-cosmic-golden mb-2">Sacred Dimension</h4>
                        <p className="text-sm text-cosmic-silver">{selectedChapterForDetail.dimension}</p>
                      </div>
                      <div className="bg-cosmic-void/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-cosmic-golden mb-2">Fractal Gate</h4>
                        <p className="text-sm text-cosmic-silver">{selectedChapterForDetail.fractalGate}</p>
                      </div>
                      <div className="bg-cosmic-void/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-cosmic-golden mb-2">Story Stage</h4>
                        <p className="text-sm text-cosmic-silver">{selectedChapterForDetail.storyStage}</p>
                      </div>
                      <div className="bg-cosmic-void/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-cosmic-golden mb-2">Spiritual Frequency</h4>
                        <p className="text-sm text-cosmic-silver">{selectedChapterForDetail.spiritualFrequency}</p>
                      </div>
                    </div>
                    
                    {/* Special Messages for Key Chapters */}
                    {selectedChapterForDetail.ch === 1 && (
                      <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-red-300 mb-3">🌟 Foundation Chapter: The Sacred Beginning</h3>
                        <p className="text-red-200/90 mb-4">
                          This foundational chapter establishes the sacred cornerstone of biblical leadership. 
                          "Leadership Begins at the Altar" teaches that every true leader must first encounter the sacred.
                        </p>
                        <div className="bg-red-800/20 p-4 rounded-lg">
                          <p className="text-sm text-red-200/80">
                            <strong>Your Sequential Path:</strong> Ch 1 → 2 → 3 → 4 → 5 (North/Yod) → Ch 6-10 (East/Heh) → Ch 11-15 (South/Vav) → Ch 16-20 (West/Heh) → Ch 21-27 (Center/Yeshua)<br/>
                            <strong>Book Theme:</strong> Identity, Calling, and Formation of Glory<br/>
                            <strong>Element:</strong> Fire (Passion and Purification)<br/>
                            <strong>Direction:</strong> North (Beginning and Foundation)
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChapterForDetail.ch === 6 && (
                      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-blue-300 mb-3">🌊 Book 2 Transition: Moving from Root to Alignment</h3>
                        <p className="text-blue-200/90 mb-4">
                          Congratulations on completing Book 1! You now enter the realm of divine patterns and spiritual alignment. 
                          This chapter reveals Jesus as the cosmic unifier and pattern keeper.
                        </p>
                        <div className="bg-blue-800/20 p-4 rounded-lg">
                          <p className="text-sm text-blue-200/80">
                            <strong>New Direction:</strong> East (Expansion and Growth)<br/>
                            <strong>New Element:</strong> Air (Breath and Spirit)<br/>
                            <strong>Focus Shift:</strong> From Identity to Divine Patterns<br/>
                            <strong>Progress:</strong> Chapters 6-10 of your 27-chapter journey
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChapterForDetail.ch === 11 && (
                      <div className="bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border border-teal-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-teal-300 mb-3">👁️ Book 3 Transition: Vision and Clarity Phase</h3>
                        <p className="text-teal-200/90 mb-4">
                          You've mastered rootedness and alignment! Now comes the development of sacred sight and emotional intelligence. 
                          The water element brings depth and clarity to your leadership journey.
                        </p>
                        <div className="bg-teal-800/20 p-4 rounded-lg">
                          <p className="text-sm text-teal-200/80">
                            <strong>New Direction:</strong> South (Depth and Reflection)<br/>
                            <strong>New Element:</strong> Water (Depth and Emotion)<br/>
                            <strong>Focus Shift:</strong> From Patterns to Vision and Discernment<br/>
                            <strong>Progress:</strong> Chapters 11-15 of your 27-chapter journey
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChapterForDetail.ch === 16 && (
                      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-green-300 mb-3">🌱 Book 4 Transition: Embodiment and Action</h3>
                        <p className="text-green-200/90 mb-4">
                          Vision now becomes reality! Book 4 focuses on embodied leadership - taking all you've learned 
                          and manifesting it in wise action. Your leadership becomes tangible and transformative.
                        </p>
                        <div className="bg-green-800/20 p-4 rounded-lg">
                          <p className="text-sm text-green-200/80">
                            <strong>New Direction:</strong> West (Completion and Manifestation)<br/>
                            <strong>New Element:</strong> Earth (Grounding and Action)<br/>
                            <strong>Focus Shift:</strong> From Vision to Embodied Action<br/>
                            <strong>Progress:</strong> Chapters 16-20 of your 27-chapter journey
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChapterForDetail.ch === 21 && (
                      <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-yellow-300 mb-3">✨ Book 5 Transition: The Pattern Manifesto</h3>
                        <p className="text-yellow-200/90 mb-4">
                          You enter the final phase - the center point where all directions converge in Christ. 
                          These final 7 chapters reveal Jesus as the fractal fulfillment and apostolic flame.
                        </p>
                        <div className="bg-yellow-800/20 p-4 rounded-lg">
                          <p className="text-sm text-yellow-200/80">
                            <strong>Sacred Center:</strong> All directions converge in Christ<br/>
                            <strong>Ultimate Element:</strong> Plasma (Divine Light and Energy)<br/>
                            <strong>Final Focus:</strong> Jesus as the Complete Pattern<br/>
                            <strong>Culmination:</strong> Chapters 21-27 - The Pattern Complete
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedChapterForDetail.ch === 27 && (
                      <div className="bg-gradient-to-br from-white/20 to-silver/20 border border-white/30 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-3">👑 The Final Chapter: Pattern Complete</h3>
                        <p className="text-white/90 mb-4">
                          You've reached the culmination of your 27-chapter journey! This final chapter represents 
                          the complete embodiment of biblical leadership - living as the YESHUA pattern made manifest.
                        </p>
                        <div className="bg-white/10 p-4 rounded-lg">
                          <p className="text-sm text-white/80">
                            <strong>Achievement:</strong> Complete 27-Chapter Journey<br/>
                            <strong>Transformation:</strong> From Altar to Throne<br/>
                            <strong>Result:</strong> Living as YESHUA Pattern Complete<br/>
                            <strong>Next Step:</strong> Leading Others Through the Journey
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 border-t border-cosmic-golden/20 bg-cosmic-void/20">
                  <div className="flex justify-between items-center">
                    {/* Previous Chapter */}
                    <div className="w-32">
                      {selectedChapterForDetail.ch > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={navigateToPreviousChapter}
                          className="border-cosmic-silver/30 text-cosmic-silver hover:border-cosmic-golden hover:text-cosmic-golden"
                          data-testid="button-previous-chapter"
                        >
                          ← Ch. {selectedChapterForDetail.ch - 1}
                        </Button>
                      )}
                    </div>
                    
                    {/* Main Action */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <Button
                        size="lg"
                        onClick={() => startJourney(selectedChapterForDetail)}
                        className="px-8 py-3 bg-gradient-to-r from-cosmic-golden to-cosmic-ethereal hover:from-cosmic-ethereal hover:to-cosmic-golden text-cosmic-deep font-bold transition-all shadow-lg"
                        data-testid="button-start-journey"
                      >
                        {selectedChapterForDetail.ch === 1 ? '🚀 Begin Your 27-Chapter Journey' : 
                         selectedChapterForDetail.ch === 27 ? '👑 Complete Your Journey' :
                         `📖 Study Chapter ${selectedChapterForDetail.ch}`}
                      </Button>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        {selectedChapterForDetail.ch > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const chapter1 = CHAPTERS.find(ch => ch.ch === 1);
                              if (chapter1) {
                                setSelectedChapterForDetail(chapter1);
                              }
                            }}
                            className="border-cosmic-silver/30 text-cosmic-silver hover:border-cosmic-golden hover:text-cosmic-golden text-xs"
                            data-testid="button-restart-journey"
                          >
                            🔄 Restart Journey
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowOnboardingWelcome(true)}
                          className="border-cosmic-silver/30 text-cosmic-silver hover:border-cosmic-golden hover:text-cosmic-golden text-xs"
                          data-testid="button-journey-overview"
                        >
                          🗺️ Journey Map
                        </Button>
                      </div>
                    </div>
                    
                    {/* Next Chapter */}
                    <div className="w-32 flex justify-end">
                      {selectedChapterForDetail.ch < 27 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={navigateToNextChapter}
                          className="border-cosmic-silver/30 text-cosmic-silver hover:border-cosmic-golden hover:text-cosmic-golden"
                          data-testid="button-next-chapter"
                        >
                          Ch. {selectedChapterForDetail.ch + 1} →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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