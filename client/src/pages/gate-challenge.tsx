import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Crown, 
  Flame, 
  Network, 
  Building, 
  CheckCircle, 
  Star,
  Trophy,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface GateData {
  id: string;
  name: string;
  theme: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  chapter: number;
  hebrewLetter: string;
  questions: {
    id: string;
    type: 'reflection' | 'choice';
    question: string;
    description?: string;
    options?: { value: string; title: string; description: string; }[];
  }[];
  completionMessage: string;
  spiritualSignificance: string;
}

const gateConfigs: Record<string, GateData> = {
  'identity-mirror': {
    id: 'identity_mirror',
    name: 'Identity Mirror Gate',
    theme: 'Leadership Begins at the Altar',
    description: 'Discover your divine identity as the foundation of biblical leadership',
    icon: <Crown className="w-8 h-8" />,
    color: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-900/20 via-orange-900/10 to-red-900/20',
    chapter: 1,
    hebrewLetter: 'א',
    questions: [
      {
        id: 'calling_recognition',
        type: 'choice',
        question: 'How do you currently understand your calling in God\'s Kingdom?',
        description: 'This reflects your foundation of identity in Christ',
        options: [
          { value: 'unclear', title: 'Still discovering', description: 'I am in the process of understanding my calling' },
          { value: 'emerging', title: 'Beginning to see', description: 'I have some clarity but need more understanding' },
          { value: 'clear', title: 'Clear vision', description: 'I have a strong sense of my divine calling' }
        ]
      },
      {
        id: 'identity_foundation',
        type: 'reflection',
        question: 'What does "leadership begins at the altar" mean to you personally?',
        description: 'Reflect on how surrender and worship form the foundation of biblical leadership'
      },
      {
        id: 'personal_altar',
        type: 'reflection',
        question: 'Describe your own "altar experience" - a moment when you surrendered your will to God\'s purpose.',
        description: 'This helps establish your spiritual foundation for leadership'
      }
    ],
    completionMessage: 'You have passed through the Identity Mirror Gate! Your foundation at the altar is secure.',
    spiritualSignificance: 'The altar represents complete surrender - the starting point of all biblical leadership. Here you discover that true authority comes from submitted authority.'
  },
  'shofar-convergence': {
    id: 'shofar_convergence', 
    name: 'Shofar Convergence Gate',
    theme: 'The Commissioning Pattern',
    description: 'Understand the divine pattern of being sent with authority',
    icon: <Flame className="w-8 h-8" />,
    color: 'from-yellow-500 to-amber-500',
    bgGradient: 'from-yellow-900/20 via-amber-900/10 to-yellow-900/20',
    chapter: 25,
    hebrewLetter: 'ה',
    questions: [
      {
        id: 'commissioning_readiness',
        type: 'choice',
        question: 'How prepared do you feel to be "sent" by God into leadership?',
        description: 'The shofar calls those who are ready to be commissioned',
        options: [
          { value: 'hesitant', title: 'Still preparing', description: 'I need more time to prepare before being sent' },
          { value: 'willing', title: 'Willing but nervous', description: 'I am willing but feel the weight of responsibility' },
          { value: 'ready', title: 'Ready and eager', description: 'I feel prepared and excited to be commissioned' }
        ]
      },
      {
        id: 'authority_understanding',
        type: 'reflection',
        question: 'What does it mean to carry divine authority in your leadership context?',
        description: 'Consider how God\'s authority flows through submitted leaders'
      },
      {
        id: 'commission_vision',
        type: 'reflection',
        question: 'Describe the specific mission or territory God is calling you to influence.',
        description: 'The shofar calls you to a specific assignment - what is yours?'
      }
    ],
    completionMessage: 'The Shofar has sounded! You are commissioned to go forth with divine authority.',
    spiritualSignificance: 'The shofar represents the call to divine commissioning. Like the disciples, you are now prepared to be sent with Kingdom authority and purpose.'
  },
  'network-multiplication': {
    id: 'network_multiplication',
    name: 'Network Multiplication Gate', 
    theme: 'The Apostolic Flame',
    description: 'Master the pattern of Kingdom multiplication through relationships',
    icon: <Network className="w-8 h-8" />,
    color: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-900/20 via-teal-900/10 to-emerald-900/20',
    chapter: 26,
    hebrewLetter: 'ש',
    questions: [
      {
        id: 'multiplication_mindset',
        type: 'choice',
        question: 'How do you currently approach developing other leaders?',
        description: 'Apostolic leaders multiply themselves through others',
        options: [
          { value: 'individual', title: 'Focus on individual growth', description: 'I primarily focus on my own development' },
          { value: 'mentoring', title: 'Actively mentoring others', description: 'I regularly invest in developing other leaders' },
          { value: 'multiplying', title: 'Creating multiplication systems', description: 'I build systems that develop leaders who develop leaders' }
        ]
      },
      {
        id: 'network_strategy',
        type: 'reflection',
        question: 'What is your strategy for building Kingdom networks that expand beyond yourself?',
        description: 'Consider how apostolic leaders create movements, not just ministries'
      },
      {
        id: 'legacy_vision',
        type: 'reflection', 
        question: 'How do you want to see God\'s Kingdom multiplied through your network in the next 5 years?',
        description: 'Envision the multiplication impact of your leadership influence'
      }
    ],
    completionMessage: 'You have mastered the Network Multiplication pattern! Your influence will multiply exponentially.',
    spiritualSignificance: 'This gate represents apostolic multiplication - the ability to create networks that expand the Kingdom beyond your individual capacity. The flame spreads from torch to torch.'
  },
  'twelve-gate-convergence': {
    id: 'twelve_gate_convergence',
    name: 'Twelve Gate Convergence',
    theme: 'The Pattern Sealed', 
    description: 'Complete the full biblical leadership journey with divine wisdom',
    icon: <Building className="w-8 h-8" />,
    color: 'from-purple-500 to-violet-500',
    bgGradient: 'from-purple-900/20 via-violet-900/10 to-purple-900/20',
    chapter: 27,
    hebrewLetter: 'ת',
    questions: [
      {
        id: 'pattern_integration',
        type: 'choice',
        question: 'How well do you understand the complete biblical leadership pattern?',
        description: 'The twelve gates represent complete spiritual maturity and wisdom',
        options: [
          { value: 'partial', title: 'Partial understanding', description: 'I see some pieces but not the whole pattern' },
          { value: 'emerging', title: 'Pattern emerging', description: 'The complete pattern is becoming clear to me' },
          { value: 'integrated', title: 'Fully integrated', description: 'I understand and can teach the complete pattern' }
        ]
      },
      {
        id: 'wisdom_application',
        type: 'reflection',
        question: 'How will you apply the wisdom from all twelve gates in your leadership context?',
        description: 'Consider the integration of all biblical leadership principles'
      },
      {
        id: 'completion_commitment',
        type: 'reflection',
        question: 'What is your commitment to stewarding this complete biblical leadership pattern?',
        description: 'How will you ensure this pattern continues through your influence?'
      }
    ],
    completionMessage: 'Congratulations! You have completed the full biblical leadership pattern. You are equipped to lead with divine wisdom.',
    spiritualSignificance: 'The twelve gates represent completion - like the New Jerusalem with twelve foundations and twelve gates. You now carry the complete pattern of biblical leadership wisdom.'
  }
};

export default function GateChallenge() {
  const [location] = useLocation();
  const navigate = (path: string) => { window.location.href = path; };
  const gateSlug = location.split('/').pop() || '';
  const gateType = gateSlug.replace('-', '_');
  const gateConfig = gateConfigs[gateSlug];
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [showCompletion, setShowCompletion] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Check gate progress
  const { data: gateProgress } = useQuery<{
    completedGates: string[];
    availableGates: string[];
    currentLevel: number;
    totalXP: number;
  }>({
    queryKey: ['/api/gates/progress'],
    enabled: isAuthenticated,
  });

  // Gate completion mutation
  const completeGateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/gates/${gateType}/complete`, {
        responses,
        reflections
      });
      return response.json();
    },
    onSuccess: (data) => {
      setShowCompletion(true);
      queryClient.invalidateQueries({ queryKey: ['/api/gates/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      
      toast({
        title: "Gate Completed! 🎉",
        description: `You earned ${data.xpEarned} XP and reached level ${data.newLevel}!`,
      });
    },
    onError: (error) => {
      console.error('Error completing gate:', error);
      toast({
        title: "Error",
        description: "Failed to complete gate challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!gateConfig) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Gate Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested gate challenge does not exist.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isGateCompleted = gateProgress?.completedGates?.includes(gateConfig.id) || false;
  const isGateAvailable = gateProgress?.availableGates?.includes(gateConfig.id) || false;
  const progress = ((currentQuestion + 1) / gateConfig.questions.length) * 100;
  const currentQuestionData = gateConfig.questions[currentQuestion];

  const handleResponse = (questionId: string, value: string) => {
    if (currentQuestionData.type === 'choice') {
      setResponses(prev => ({ ...prev, [questionId]: value }));
    } else {
      setReflections(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < gateConfig.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeGateMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const canProceed = currentQuestionData.type === 'choice' 
    ? !!responses[currentQuestionData.id]
    : !!reflections[currentQuestionData.id];

  if (showCompletion) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${gateConfig.color} mb-6`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-cosmic-golden mb-4">
              Gate Completed!
            </h1>
            
            <div className="text-6xl mb-4 animate-pulse-slow">
              {gateConfig.hebrewLetter}
            </div>
            
            <h2 className="text-2xl font-semibold mb-6">{gateConfig.name}</h2>
            
            <Card className="max-w-2xl mx-auto mb-8">
              <CardContent className="p-6">
                <p className="text-lg mb-4">{gateConfig.completionMessage}</p>
                <p className="text-muted-foreground">{gateConfig.spiritualSignificance}</p>
              </CardContent>
            </Card>
            
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate('/matrix')}
                className="bg-cosmic-golden hover:bg-cosmic-golden/80 text-black"
                data-testid="button-continue-journey"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Continue Journey
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                data-testid="button-home"
              >
                Return Home
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isGateCompleted) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Gate Already Completed</h2>
              <p className="text-muted-foreground mb-4">
                You have already passed through the {gateConfig.name}.
              </p>
              <Button onClick={() => navigate('/matrix')} data-testid="button-return-matrix">
                Return to Matrix
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isGateAvailable) {
    return (
      <div className="min-h-screen cosmic-gradient">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Gate Locked</h2>
              <p className="text-muted-foreground mb-4">
                You must reach Chapter {gateConfig.chapter} to access the {gateConfig.name}.
              </p>
              <Button onClick={() => navigate('/matrix')} data-testid="button-continue-progress">
                Continue Your Journey
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${gateConfig.color} mb-4`}>
            {gateConfig.icon}
          </div>
          
          <Badge variant="outline" className="mb-4" data-testid="badge-chapter">
            Chapter {gateConfig.chapter}
          </Badge>
          
          <h1 className="text-4xl font-bold text-cosmic-golden mb-2">
            {gateConfig.name}
          </h1>
          
          <h2 className="text-xl text-cosmic-silver mb-4">
            {gateConfig.theme}
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {gateConfig.description}
          </p>
          
          <div className="text-4xl hebrew-letter mt-4 mb-6">
            {gateConfig.hebrewLetter}
          </div>
        </motion.div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground" data-testid="text-progress">
                {currentQuestion + 1} of {gateConfig.questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-gate" />
          </CardContent>
        </Card>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`bg-gradient-to-br ${gateConfig.bgGradient}`}>
              <CardHeader>
                <CardTitle className="text-xl" data-testid="text-question-title">
                  {currentQuestionData.question}
                </CardTitle>
                {currentQuestionData.description && (
                  <p className="text-muted-foreground" data-testid="text-question-description">
                    {currentQuestionData.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {currentQuestionData.type === 'choice' ? (
                  <RadioGroup
                    value={responses[currentQuestionData.id] || ''}
                    onValueChange={(value) => handleResponse(currentQuestionData.id, value)}
                    className="space-y-4"
                  >
                    {currentQuestionData.options?.map((option) => (
                      <div key={option.value} className="flex items-start space-x-3">
                        <RadioGroupItem 
                          value={option.value} 
                          id={option.value} 
                          className="mt-1"
                          data-testid={`radio-${option.value}`}
                        />
                        <Label
                          htmlFor={option.value}
                          className="flex-1 p-4 bg-card/50 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-card/70 transition-colors"
                        >
                          <div className="font-medium">{option.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="Share your thoughts and reflections..."
                    value={reflections[currentQuestionData.id] || ''}
                    onChange={(e) => handleResponse(currentQuestionData.id, e.target.value)}
                    className="min-h-[150px] bg-card/50 backdrop-blur-sm"
                    data-testid="textarea-reflection"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            data-testid="button-previous"
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: gateConfig.questions.length }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentQuestion ? 'bg-cosmic-golden' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed || completeGateMutation.isPending}
            className="bg-cosmic-golden hover:bg-cosmic-golden/80 text-black"
            data-testid="button-next"
          >
            {currentQuestion === gateConfig.questions.length - 1 ? (
              completeGateMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  Complete Gate
                </>
              )
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Spiritual Significance */}
        <Card className="mt-8 bg-card/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 text-cosmic-golden">Spiritual Significance</h3>
            <p className="text-sm text-muted-foreground">
              {gateConfig.spiritualSignificance}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}