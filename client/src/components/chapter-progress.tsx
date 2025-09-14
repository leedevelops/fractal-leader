import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle, Play, BookOpen, Star, Crown, Zap, Sparkles, Shield, Trophy, Navigation, Compass } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GameHUD } from "@/components/game-hud";
import { GameProgressResponse, SacredMatrixEntry } from "@shared/schema";

interface ChapterProgressProps {
  userId: string;
  userGeneration?: string;
  userArchetype?: string;
}

// Golden Path milestones and gate chapters
const GOLDEN_PATH_MILESTONES = [1, 5, 10, 15, 20, 25, 26, 27];
const SPECIAL_GATES = {
  1: { type: 'identity_mirror', icon: '⬜', name: 'Identity Gate' },
  25: { type: 'shofar_convergence', icon: '🎺', name: 'Shofar Gate' },
  26: { type: 'network_multiplication', icon: '🕸️', name: 'Network Gate' },
  27: { type: 'twelve_gate_convergence', icon: '🏛️', name: 'Convergence Gate' }
};

// YHWH Directional Quadrants Structure
const yhwhQuadrants = [
  { 
    letter: "י", 
    name: "Yod - Becoming Rooted", 
    direction: "North", 
    element: "Fire", 
    color: "red", 
    chapters: [1, 2, 3, 4, 5],
    theme: "Identity, Calling, and the Formation of Glory",
    position: "top-0 left-1/2 transform -translate-x-1/2 -translate-y-4"
  },
  { 
    letter: "ה", 
    name: "Heh - Becoming Aligned", 
    direction: "East", 
    element: "Air", 
    color: "blue", 
    chapters: [6, 7, 8, 9, 10],
    theme: "Patterns and the Spiritual Core of Leadership",
    position: "top-1/2 right-0 transform translate-x-4 -translate-y-1/2"
  },
  { 
    letter: "ו", 
    name: "Vav - Becoming Clear", 
    direction: "South", 
    element: "Water", 
    color: "teal", 
    chapters: [11, 12, 13, 14, 15],
    theme: "Vision, Emotional Intelligence, and the Inner Compass",
    position: "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4"
  },
  { 
    letter: "ה", 
    name: "Final Heh - Becoming Embodied", 
    direction: "West", 
    element: "Earth", 
    color: "green", 
    chapters: [16, 17, 18, 19, 20],
    theme: "Walking in Wisdom, Spirit, and Glory",
    position: "top-1/2 left-0 transform -translate-x-4 -translate-y-1/2"
  },
  {
    letter: "ש", 
    name: "YESHUA - The Pattern Manifesto", 
    direction: "Center", 
    element: "Plasma", 
    color: "yellow", 
    chapters: [21, 22, 23, 24, 25, 26, 27],
    theme: "Jesus, the Fractal Fulfillment, and the Apostolic Flame",
    position: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
  }
];

const chapterTitles: Record<number, string> = {
  1: "Leadership Begins at the Altar",
  2: "The Tripartite Leader: Spirit, Soul, and Body",
  3: "Why We Had to Leave Eden",
  4: "Formation in Exile: The Purpose of the Fall",
  5: "The Seed Hidden in the Dust",
  6: "Jesus as the Tree of Life, the Flaming Sword, and the Cosmic Unifier",
  7: "The Divine Pattern: YHWH Structure and the Wings of Wisdom",
  8: "The Pattern Keeper: Heaven's Interface and Leadership Design",
  9: "The Fractal Pattern of Leadership",
  10: "The Invisible Root System of Authority",
  11: "Vision of God: The First Call of Every Leader",
  12: "Vision of Self: Emotional Tools and Soul Awareness",
  13: "Vision of Mission: Discovering Your Divine Measure",
  14: "The Wounded Visionary: Leading Through Inner Conflict",
  15: "Sacred Sight: From Revelation to Discernment",
  16: "Emotional Intelligence and Passion",
  17: "Intelligent Action: Decision-Making in Alignment with the Spirit",
  18: "Embodied Leadership: Why Your Body Matters",
  19: "Mentors and Mirrors: Leading Like Jesus in a Fractured World",
  20: "The Body of Christ: Flesh Made Flame",
  21: "Yeshua: The Embodiment of YHWH",
  22: "The Spiral and the Sword: Jesus as Pattern and Portal",
  23: "The Name and the Nations: Fractal Mission in the Latter Days",
  24: "Pentecost, Fire, and the Echo of Eden",
  25: "The Commissioning Pattern: Jesus and the Sending of the Flame",
  26: "The Apostolic Flame: Paul and the Global Replication Pattern",
  27: "The Pattern Complete: Living as YESHUA"
};

export default function ChapterProgress({ userId, userGeneration, userArchetype }: ChapterProgressProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);

  // Fetch complete sacred matrix data for directional layout
  const { data: sacredMatrixData } = useQuery<SacredMatrixEntry[]>({
    queryKey: ['/api/biblical-matrix'],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/biblical-matrix`);
      return response.json();
    }
  });

  // Sacred Geometry Icon mapping
  const getGeometryIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      'Square': '⬜',
      'Equilateral Triangle': '🔺', 
      '2D Spiral': '🌀',
      'Isometric Cube': '🎲',
      'Monad Unity Point': '⚫',
      'Tetrahedron + Rays': '💎',
      'Hexagonal Mandala': '⬡',
      'Octahedron': '💠',
      'Fibonacci Spiral': '🌀',
      'Fractal Tree': '🌳',
      'Icosahedron': '⚡',
      'Hexagonal Prism': '⬣',
      'Golden Ratio Spiral': '🌪️',
      'Mobius Strip': '∞',
      'Metatron Cube': '🔮',
      '3D Pentagon': '⭐',
      'Tetrahedron': '🔺',
      'Isometric Grid': '▦',
      'Reflection Diagram': '🪞',
      'Flower of Life': '🌸',
      'Star of David': '✡️',
      'Fibonacci Circle': '○',
      'Torus (3D)': '🍩',
      '64 Star Tetrahedron': '✨',
      'Nested Fib Circles': '⊙',
      'Fractal Network': '🕸️',
      'Infinity': '∞'
    };
    return iconMap[iconName] || '◯';
  };

  // Organize chapters by direction using sacred matrix data
  const organizeChaptersByDirection = () => {
    if (!sacredMatrixData) return {};
    
    const directionMap: Record<string, SacredMatrixEntry[]> = {
      'North': [],
      'East': [], 
      'South': [],
      'West': [],
      'Center': [],
      'Global': []
    };

    sacredMatrixData.forEach(chapter => {
      const direction = chapter.directionalMapping || 'Center';
      if (directionMap[direction]) {
        directionMap[direction].push(chapter);
      } else {
        // For chapters without explicit directional mapping, assign based on book number
        if (chapter.chapterNumber >= 1 && chapter.chapterNumber <= 5) directionMap.North.push(chapter);
        else if (chapter.chapterNumber >= 6 && chapter.chapterNumber <= 10) directionMap.East.push(chapter);
        else if (chapter.chapterNumber >= 11 && chapter.chapterNumber <= 15) directionMap.South.push(chapter);
        else if (chapter.chapterNumber >= 16 && chapter.chapterNumber <= 20) directionMap.West.push(chapter);
        else directionMap.Center.push(chapter);
      }
    });

    return directionMap;
  };
  
  const directionMap = organizeChaptersByDirection();

  // Fetch game progress data
  const { data: gameProgress, isLoading } = useQuery<GameProgressResponse>({
    queryKey: ['/api/user', userId, 'game-progress'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/user/${userId}/game-progress`);
        return response.json();
      } catch (error: any) {
        // If unauthenticated, return demo game progress
        if (error.status === 401 || error.status === 403) {
          return {
            user: {
              id: 'demo',
              experiencePoints: 0,
              level: 1,
              currentChapterId: '1'
            },
            progress: {
              currentBook: 1,
              currentChapterId: '1',
              completedChapters: [],
              unlockedChapters: [1],
              totalChaptersCompleted: 0
            },
            gates: [],
            availableChapters: [],
            nextMilestone: {
              chapterNumber: 1,
              isGate: true,
              title: "Identity Mirror Gate"
            }
          };
        }
        throw error;
      }
    },
    enabled: !!userId,
  });

  // Chapter completion mutation with XP rewards
  const completeChapterMutation = useMutation({
    mutationFn: async (chapterNumber: number) => {
      const response = await apiRequest("POST", `/api/chapters/${chapterNumber}/complete`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'game-progress'] });
      
      // Show level up animation if user leveled up
      if (data.levelUp) {
        setShowLevelUpAnimation(true);
        toast({
          title: "🎉 Level Up!",
          description: `Congratulations! You've reached level ${data.user.level}!`,
        });
      } else {
        toast({
          title: "Chapter Completed!",
          description: `+${data.xpGained} XP earned. Great progress!`,
        });
      }
    },
  });

  // Helper functions for chapter states
  const getChapterStatus = (chapterNumber: number) => {
    if (!gameProgress) return 'locked';
    
    const { progress } = gameProgress;
    const completedChapters = progress.completedChapters || [];
    const unlockedChapters = progress.unlockedChapters || [1];
    
    if (completedChapters.includes(chapterNumber)) return 'completed';
    if (unlockedChapters.includes(chapterNumber)) return 'available';
    return 'locked';
  };
  
  const isGoldenPathMilestone = (chapterNumber: number) => {
    return GOLDEN_PATH_MILESTONES.includes(chapterNumber);
  };
  
  const isSpecialGate = (chapterNumber: number) => {
    return chapterNumber in SPECIAL_GATES;
  };
  
  const getChapterReward = (chapterNumber: number) => {
    let baseXP = 50;
    if (isSpecialGate(chapterNumber)) baseXP += 50; // Gates give bonus XP
    if (isGoldenPathMilestone(chapterNumber)) baseXP += 25; // Milestones give bonus XP
    return baseXP;
  };
  
  // Start chapter function
  const startChapter = (chapterNumber: number) => {
    const chapterData = sacredMatrixData?.find(ch => ch.chapterNumber === chapterNumber);
    const quadrant = yhwhQuadrants.find(q => q.chapters.includes(chapterNumber));
    
    toast({
      title: `Starting ${chapterData?.chapterTitle || `Chapter ${chapterNumber}`}`,
      description: `${quadrant?.name || 'Sacred Chapter'} - ${chapterData?.element} Element`,
    });
    
    // Navigate to chapter content or open chapter modal
    setSelectedChapter(chapterNumber);
  };
  
  // Complete chapter function
  const completeChapter = (chapterNumber: number) => {
    completeChapterMutation.mutate(chapterNumber);
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'North': return 'bg-red-500/20 border-red-500/40 text-red-300';
      case 'East': return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'South': return 'bg-teal-500/20 border-teal-500/40 text-teal-300';
      case 'West': return 'bg-green-500/20 border-green-500/40 text-green-300';
      case 'Center': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
      case 'Global': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    }
  };
  
  const getElementGlow = (element: string) => {
    switch (element) {
      case 'Fire': return 'shadow-red-500/50';
      case 'Air': return 'shadow-blue-500/50';
      case 'Water': return 'shadow-teal-500/50';
      case 'Earth': return 'shadow-green-500/50';
      case 'Plasma': return 'shadow-yellow-500/50';
      default: return 'shadow-gray-500/50';
    }
  };

  // Level up animation effect
  useEffect(() => {
    if (showLevelUpAnimation) {
      const timer = setTimeout(() => setShowLevelUpAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUpAnimation]);

  const renderChapter = (chapter: SacredMatrixEntry, direction: string) => {
    const chapterNumber = chapter.chapterNumber;
    const status = getChapterStatus(chapterNumber);
    const title = chapter.chapterTitle || `Chapter ${chapterNumber}`;
    const isMilestone = isGoldenPathMilestone(chapterNumber);
    const isGate = isSpecialGate(chapterNumber);
    const expectedXP = getChapterReward(chapterNumber);
    const geometryIcon = getGeometryIcon(chapter.geometryIcon);
    const directionColor = getDirectionColor(direction);
    const elementGlow = getElementGlow(chapter.element);
    
    const getChapterClassName = () => {
      let baseClass = "cursor-pointer transition-all duration-300 relative overflow-hidden ";
      
      if (status === 'locked') {
        baseClass += "bg-gray-800/50 border-gray-600/50 ";
      } else if (status === 'completed') {
        baseClass += "bg-green-900/30 border-green-500/50 ";
        if (isMilestone) baseClass += "ring-2 ring-yellow-400/50 ";
      } else if (status === 'available') {
        baseClass += "bg-blue-900/30 border-blue-500/50 hover:bg-blue-800/40 ";
        if (isMilestone) baseClass += "ring-2 ring-yellow-400/70 ";
      }
      
      return baseClass;
    };
    
    return (
      <motion.div
        key={chapterNumber}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: chapterNumber * 0.05 }}
        whileHover={{ scale: status !== 'locked' ? 1.02 : 1 }}
        className="relative"
      >
        <Card 
          className={`${getChapterClassName()} ${directionColor} ${elementGlow}`}
          onClick={() => {
            if (status === 'available') startChapter(chapterNumber);
            else if (status === 'completed') {
              toast({
                title: "Chapter Completed",
                description: `You earned ${expectedXP} XP from this chapter.`,
              });
            }
          }}
          data-testid={`chapter-${chapterNumber}-${status}`}
        >
          {/* Golden Path Sparkle Effect */}
          {isMilestone && status !== 'locked' && (
            <motion.div
              className="absolute top-2 right-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </motion.div>
          )}
          
          {/* Gate Icon */}
          {isGate && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="border-purple-400 text-purple-300 text-xs">
                <Shield className="w-3 h-3 mr-1" />
                Gate
              </Badge>
            </div>
          )}
          
          <CardContent className="p-4">
            {/* Sacred Geometry Icon */}
            <div className="text-center mb-3">
              <div className="text-3xl mb-2" title={chapter.geometryIcon}>
                {geometryIcon}
              </div>
              <Badge variant="outline" className="text-xs border-opacity-50">
                {chapter.element}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">Ch. {chapterNumber}</span>
                {status === 'completed' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </motion.div>
                )}
                {status === 'locked' && <Lock className="w-4 h-4 text-gray-500" />}
              </div>
              
              {/* Chapter Status Badge */}
              <Badge 
                variant={status === 'completed' ? 'default' : status === 'available' ? 'secondary' : 'outline'}
                className={`
                  ${status === 'completed' ? 'bg-green-600 text-white' : ''}
                  ${status === 'available' ? 'bg-blue-600 text-white' : ''}
                  ${status === 'locked' ? 'bg-gray-600 text-gray-300' : ''}
                `}
              >
                {status === 'completed' && <><CheckCircle className="w-3 h-3 mr-1" />Completed</>}
                {status === 'available' && <><Play className="w-3 h-3 mr-1" />Start</>}
                {status === 'locked' && <><Lock className="w-3 h-3 mr-1" />Locked</>}
              </Badge>
            </div>
            
            <h3 className="font-semibold mb-2 text-sm leading-tight">{title}</h3>
            
            {/* Sacred Details */}
            <div className="text-xs text-gray-400 mb-2">
              <div>Stone: {chapter.stone}</div>
              <div>Dimension: {chapter.dimension}</div>
            </div>
            
            {/* XP Reward Display */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Reward: {expectedXP} XP</span>
              {isMilestone && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-400 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Milestone
                </Badge>
              )}
            </div>
            
            {/* Progress Indicator for Available Chapters */}
            {status === 'available' && (
              <motion.div 
                className="mt-3 h-1 bg-blue-600/50 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <GameHUD gameProgress={{} as GameProgressResponse} isLoading={true} />
        <div className="animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gameProgress) {
    return (
      <div className="space-y-6">
        <GameHUD gameProgress={{} as GameProgressResponse} isLoading={true} />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Loading your leadership journey...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progress } = gameProgress;
  const totalChapters = 27;
  const completedChapters = progress.totalChaptersCompleted || 0;
  const overallProgress = Math.round((completedChapters / totalChapters) * 100);
  
  // Render directional quadrant with chapters
  const renderDirectionalQuadrant = (quadrant: typeof yhwhQuadrants[0]) => {
    const chaptersInDirection = directionMap[quadrant.direction] || [];
    const quadrantCompletedChapters = chaptersInDirection.filter(ch => progress.completedChapters.includes(ch.chapterNumber)).length;
    const quadrantProgress = Math.round((quadrantCompletedChapters / chaptersInDirection.length) * 100);
    
    return (
      <motion.div
        key={quadrant.direction}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`relative bg-cosmic-void/30 border-2 ${getDirectionColor(quadrant.direction)} rounded-xl p-4 min-h-[300px]`}
      >
        {/* Quadrant Header */}
        <div className="text-center mb-4">
          <motion.div 
            className="text-6xl mb-2"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {quadrant.letter}
          </motion.div>
          <h3 className="font-bold text-lg mb-1">{quadrant.name}</h3>
          <p className="text-sm opacity-80 mb-2">{quadrant.theme}</p>
          <Badge className={`${getDirectionColor(quadrant.direction)} text-xs`}>
            {quadrant.element} • {quadrant.direction}
          </Badge>
          <div className="mt-2">
            <Progress value={quadrantProgress} className="h-2" />
            <div className="text-xs text-gray-400 mt-1">
              {quadrantCompletedChapters} / {chaptersInDirection.length} • {quadrantProgress}%
            </div>
          </div>
        </div>
        
        {/* Chapters in this direction */}
        <div className="grid gap-3">
          {chaptersInDirection
            .sort((a, b) => a.chapterNumber - b.chapterNumber)
            .map(chapter => renderChapter(chapter, quadrant.direction))
          }
        </div>
        
        {/* Direction Indicator */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="border-opacity-50 text-xs">
            <Compass className="w-3 h-3 mr-1" />
            {quadrant.direction}
          </Badge>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUpAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-6 rounded-2xl shadow-2xl text-center"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">🎉 LEVEL UP! 🎉</h2>
              <p className="text-lg">You've reached Level {gameProgress.user.level}!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game HUD */}
      <GameHUD gameProgress={gameProgress} />

      {/* YHWH Directional Compass Layout */}
      <div className="space-y-8">
        {/* Overall Progress Summary */}
        <Card className="bg-cosmic-void/20 border-cosmic-golden/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-3">
              <Navigation className="w-6 h-6 text-cosmic-golden" />
              <span>YHWH → YESHUA Compass Journey</span>
              <Compass className="w-6 h-6 text-cosmic-golden" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <Progress value={overallProgress} className="h-4 mb-2" />
              <p className="text-sm text-gray-400">
                {completedChapters} of {totalChapters} chapters completed ({overallProgress}%)
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Sacred Directional Compass Grid */}
        <div className="relative">
          {/* Compass Container */}
          <div className="grid grid-cols-3 grid-rows-3 gap-6 min-h-[800px]">
            
            {/* NORTH (Top Center) - Yod (Fire) */}
            <div></div>
            <div className="flex flex-col justify-start">
              {renderDirectionalQuadrant(yhwhQuadrants.find(q => q.direction === 'North')!)}
            </div>
            <div></div>
            
            {/* WEST (Left Center) - Final Heh (Earth) */}
            <div className="flex flex-col justify-center">
              {renderDirectionalQuadrant(yhwhQuadrants.find(q => q.direction === 'West')!)}
            </div>
            
            {/* CENTER - YESHUA (Plasma) */}
            <div className="flex flex-col justify-center relative">
              {renderDirectionalQuadrant(yhwhQuadrants.find(q => q.direction === 'Center')!)}
              
              {/* Sacred Center Indicator */}
              <motion.div
                className="absolute inset-0 border-4 border-yellow-400/30 rounded-xl pointer-events-none"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            
            {/* EAST (Right Center) - Heh (Air) */}
            <div className="flex flex-col justify-center">
              {renderDirectionalQuadrant(yhwhQuadrants.find(q => q.direction === 'East')!)}
            </div>
            
            {/* SOUTH (Bottom Center) - Vav (Water) */}
            <div></div>
            <div className="flex flex-col justify-end">
              {renderDirectionalQuadrant(yhwhQuadrants.find(q => q.direction === 'South')!)}
            </div>
            <div></div>
          </div>
          
          {/* Compass Rose Center */}
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-500/20 rounded-full border-2 border-yellow-400/50 flex items-center justify-center pointer-events-none z-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Compass className="w-8 h-8 text-yellow-400" />
          </motion.div>
          
          {/* Directional Labels */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-red-400 font-bold text-sm">NORTH • י</div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-teal-400 font-bold text-sm">SOUTH • ו</div>
          <div className="absolute top-1/2 left-2 transform -translate-y-1/2 -rotate-90 text-green-400 font-bold text-sm">WEST • ה</div>
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 rotate-90 text-blue-400 font-bold text-sm">EAST • ה</div>
        </div>
      </div>
    </div>
  );
}