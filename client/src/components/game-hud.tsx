import { motion } from "framer-motion";
import { User, Trophy, Star, Zap, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { GameProgressResponse } from "@shared/schema";

interface GameHUDProps {
  gameProgress: GameProgressResponse;
  isLoading?: boolean;
}

export function GameHUD({ gameProgress, isLoading }: GameHUDProps) {
  if (isLoading) {
    return (
      <motion.div 
        className="w-full mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30">
          <CardContent className="p-4">
            <div className="animate-pulse flex items-center justify-between">
              <div className="h-4 bg-gray-600 rounded w-1/4"></div>
              <div className="h-4 bg-gray-600 rounded w-1/6"></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const { user, progress, nextMilestone } = gameProgress;
  const currentLevel = user.level;
  const currentXP = user.experiencePoints;
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = ((currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  const xpNeeded = xpForNextLevel - currentXP;

  // Calculate completion percentage
  const totalChapters = 27;
  const completionPercentage = Math.round((progress.totalChaptersCompleted / totalChapters) * 100);
  
  // Determine current chapter number and title
  const getCurrentChapterInfo = () => {
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
    
    // Find the next available chapter (first unlocked but not completed)
    const availableChapters = progress.unlockedChapters || [1];
    const completedChapters = progress.completedChapters || [];
    
    // Current chapter is the lowest unlocked chapter that's not completed
    const currentChapter = availableChapters.find(ch => !completedChapters.includes(ch)) || 
                           Math.max(...completedChapters) + 1 || 1;
    
    return {
      number: currentChapter,
      title: chapterTitles[currentChapter] || `Chapter ${currentChapter}`
    };
  };
  
  const currentChapter = getCurrentChapterInfo();

  return (
    <motion.div 
      className="w-full mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="game-hud"
    >
      <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30 shadow-lg">
        <CardContent className="p-6">
          {/* Top Row - Level and XP */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
              >
                <Crown className="w-6 h-6 text-yellow-400" />
                <span className="text-2xl font-bold text-white" data-testid="user-level">
                  Level {currentLevel}
                </span>
              </motion.div>
              
              <Badge variant="secondary" className="bg-purple-600/80 text-white">
                <Trophy className="w-4 h-4 mr-1" />
                {progress.totalChaptersCompleted}/{totalChapters} Chapters
              </Badge>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-300">Experience Points</div>
              <div className="text-xl font-bold text-yellow-400" data-testid="user-xp">
                {currentXP.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Progress to Level {currentLevel + 1}</span>
              <span>{xpNeeded} XP to go</span>
            </div>
            <div className="relative">
              <Progress 
                value={xpProgress} 
                className="h-3 bg-gray-700"
                data-testid="xp-progress-bar"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Bottom Row - Current Chapter and Next Milestone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {currentChapter && (
                <Badge variant="outline" className="border-blue-400 text-blue-300" data-testid="current-chapter-badge">
                  <Star className="w-4 h-4 mr-1" />
                  Chapter {currentChapter.number}: {currentChapter.title.length > 30 
                    ? currentChapter.title.substring(0, 30) + "..." 
                    : currentChapter.title}
                </Badge>
              )}
              
              <Badge variant="outline" className="border-green-400 text-green-300" data-testid="completion-percentage-badge">
                {completionPercentage}% Complete
              </Badge>
            </div>

            {nextMilestone && (
              <motion.div 
                className="flex items-center space-x-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400" data-testid="next-milestone">
                  Next: {nextMilestone.title}
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}