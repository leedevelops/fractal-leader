import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/ui/navigation';
import { isUnauthorizedError } from '@/lib/authUtils';
import { CheckCircle2, ArrowLeft, ArrowRight, Compass, Crown, Target, Book } from 'lucide-react';
import archetypesImage from '../assets/images/Biblical_leadership_four_pillars_23f8d9a2.png';
import scrollImage from '@assets/generated_images/Hebrew_assessment_scroll_archetypes_d287c3a4.png';
import pioneerImage from '@assets/generated_images/Pioneer_Archetype_Leader_8cc8df32.png';
import organizerImage from '@assets/generated_images/Organizer_Archetype_Leader_ef6b4873.png';
import builderImage from '@assets/generated_images/Builder_Archetype_Leader_70f28fd0.png';
import guardianImage from '@assets/generated_images/Guardian_Archetype_Leader_041191ad.png';
import { adaptContentForGeneration, getUIAdaptationSettings, type Generation } from '@/lib/generational-adaptation';

interface Question {
  id: string;
  stage: number;
  text: string;
  options: {
    value: string;
    label: string;
    archetype?: string;
    weight?: number;
  }[];
  category: 'leadership' | 'decision_making' | 'relationships' | 'spirituality';
}

const assessmentQuestions: Question[] = [
  // Stage 1: Core Leadership Style (R1 Level)
  {
    id: 'q1',
    stage: 1,
    category: 'leadership',
    text: 'When leading a new initiative, what is your natural first step?',
    options: [
      { value: 'pioneer_1', label: 'Vision the future possibilities and inspire others to see them', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_1', label: 'Gather the team and establish clear communication channels', archetype: 'organizer', weight: 3 },
      { value: 'builder_1', label: 'Create a detailed action plan with concrete steps', archetype: 'builder', weight: 3 },
      { value: 'guardian_1', label: 'Assess risks and ensure we have proper foundations', archetype: 'guardian', weight: 3 }
    ]
  },
  {
    id: 'q2',
    stage: 1,
    category: 'decision_making',
    text: 'How do you prefer to make important decisions?',
    options: [
      { value: 'pioneer_2', label: 'Follow divine inspiration and breakthrough thinking', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_2', label: 'Consult with team members and build consensus', archetype: 'organizer', weight: 3 },
      { value: 'builder_2', label: 'Analyze data and create systematic approaches', archetype: 'builder', weight: 3 },
      { value: 'guardian_2', label: 'Consider precedent and ensure stability', archetype: 'guardian', weight: 3 }
    ]
  },
  // Stage 2: Interpersonal Dynamics (R2 Level)
  {
    id: 'q3',
    stage: 2,
    category: 'relationships',
    text: 'In team conflicts, you naturally tend to:',
    options: [
      { value: 'pioneer_3', label: 'Redirect focus to the bigger vision and purpose', archetype: 'pioneer', weight: 2 },
      { value: 'organizer_3', label: 'Facilitate dialogue and find common ground', archetype: 'organizer', weight: 3 },
      { value: 'builder_3', label: 'Focus on practical solutions that work for everyone', archetype: 'builder', weight: 2 },
      { value: 'guardian_3', label: 'Protect relationships and maintain team unity', archetype: 'guardian', weight: 3 }
    ]
  },
  {
    id: 'q4',
    stage: 2,
    category: 'leadership',
    text: 'What energizes you most in leadership?',
    options: [
      { value: 'pioneer_4', label: 'Breaking new ground and pioneering innovations', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_4', label: 'Building strong, connected teams and communities', archetype: 'organizer', weight: 3 },
      { value: 'builder_4', label: 'Seeing tangible results and completed projects', archetype: 'builder', weight: 3 },
      { value: 'guardian_4', label: 'Preserving values and nurturing long-term growth', archetype: 'guardian', weight: 3 }
    ]
  },
  // Stage 3: Spiritual Integration (R3 Level)
  {
    id: 'q5',
    stage: 3,
    category: 'spirituality',
    text: 'How do you sense God\'s calling in your leadership?',
    options: [
      { value: 'pioneer_5', label: 'Through prophetic vision and breakthrough revelations', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_5', label: 'Through building unity and fostering community', archetype: 'organizer', weight: 3 },
      { value: 'builder_5', label: 'Through faithful service and practical ministry', archetype: 'builder', weight: 3 },
      { value: 'guardian_5', label: 'Through protecting and shepherding God\'s people', archetype: 'guardian', weight: 3 }
    ]
  },
  {
    id: 'q6',
    stage: 3,
    category: 'spirituality',
    text: 'In prayer and meditation, you most often seek:',
    options: [
      { value: 'pioneer_6', label: 'Divine direction for new territories and possibilities', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_6', label: 'Wisdom for harmonizing relationships and teams', archetype: 'organizer', weight: 3 },
      { value: 'builder_6', label: 'Guidance for practical steps and faithful execution', archetype: 'builder', weight: 3 },
      { value: 'guardian_6', label: 'Strength to protect and nurture those you serve', archetype: 'guardian', weight: 3 }
    ]
  },
  // Stage 4: Generational Impact (R4 Level)
  {
    id: 'q7',
    stage: 4,
    category: 'leadership',
    text: 'How do you approach working with different generations?',
    options: [
      { value: 'pioneer_7', label: 'Show them new possibilities beyond current limitations', archetype: 'pioneer', weight: 2 },
      { value: 'organizer_7', label: 'Create bridges between generational perspectives', archetype: 'organizer', weight: 3 },
      { value: 'builder_7', label: 'Mentor through practical skills and proven methods', archetype: 'builder', weight: 2 },
      { value: 'guardian_7', label: 'Pass down wisdom and preserve important traditions', archetype: 'guardian', weight: 3 }
    ]
  },
  {
    id: 'q8',
    stage: 4,
    category: 'leadership',
    text: 'What legacy do you most want to leave?',
    options: [
      { value: 'pioneer_8', label: 'Breakthrough innovations that transform the future', archetype: 'pioneer', weight: 3 },
      { value: 'organizer_8', label: 'Strong communities and lasting relationships', archetype: 'organizer', weight: 3 },
      { value: 'builder_8', label: 'Systems and structures that serve generations', archetype: 'builder', weight: 3 },
      { value: 'guardian_8', label: 'Protected values and nurtured spiritual growth', archetype: 'guardian', weight: 3 }
    ]
  }
];

const archetypeInfo = {
  pioneer: {
    name: 'Pioneer',
    icon: '🚀',
    hebrewLetter: 'א',
    description: 'Visionary leaders who break new ground and open new territories for God\'s kingdom',
    strengths: ['Visionary thinking', 'Risk-taking faith', 'Prophetic insight', 'Breakthrough innovation'],
    biblicalExample: 'Abraham - Called to leave the known and pioneer new territory',
    color: 'bg-red-500/20 text-red-700 dark:text-red-300'
  },
  organizer: {
    name: 'Organizer',
    icon: '🤝',
    hebrewLetter: 'ה',
    description: 'Relationship-centered leaders who build unity and coordinate teams effectively',
    strengths: ['Team building', 'Communication', 'Harmony creation', 'Collaborative leadership'],
    biblicalExample: 'Barnabas - The encourager who organized and connected people',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
  },
  builder: {
    name: 'Builder',
    icon: '🔨',
    hebrewLetter: 'י',
    description: 'Implementation-focused leaders who create lasting structures and systems',
    strengths: ['Strategic planning', 'Project management', 'Systems thinking', 'Faithful execution'],
    biblicalExample: 'Nehemiah - Rebuilt Jerusalem\'s walls through organized action',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300'
  },
  guardian: {
    name: 'Guardian',
    icon: '🛡️',
    hebrewLetter: 'ו',
    description: 'Protective leaders who preserve values and nurture long-term growth',
    strengths: ['Wisdom', 'Protection', 'Nurturing', 'Value preservation'],
    biblicalExample: 'Moses - Shepherded and protected God\'s people through the wilderness',
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
  }
};

export default function Assessment() {
  const { user, isLoading: authLoading } = useAuth();
  
  // Generational adaptation
  const currentGeneration = ((user as any)?.generation as Generation) || 'millennial';
  const uiSettings = getUIAdaptationSettings(currentGeneration);
  
  // Get archetype image based on type
  const getArchetypeImage = (archetype: string) => {
    const images = {
      pioneer: pioneerImage,
      organizer: organizerImage,
      builder: builderImage,
      guardian: guardianImage
    };
    return images[archetype as keyof typeof images] || pioneerImage;
  };
  
  // Generational theming for results
  const getGenerationalTheme = (generation: Generation) => {
    const themes = {
      gen_z: {
        cardBg: 'bg-gradient-to-br from-purple-900/40 to-pink-900/40',
        textStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400',
        borderColor: 'border-purple-500/50',
        buttonStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
      },
      millennial: {
        cardBg: 'bg-gradient-to-br from-blue-900/40 to-teal-900/40',
        textStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400',
        borderColor: 'border-blue-500/50',
        buttonStyle: 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700'
      },
      gen_x: {
        cardBg: 'bg-gradient-to-br from-gray-800/40 to-slate-800/40',
        textStyle: 'text-gray-200',
        borderColor: 'border-gray-500/50',
        buttonStyle: 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700'
      },
      boomer: {
        cardBg: 'bg-gradient-to-br from-amber-900/40 to-orange-900/40',
        textStyle: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400',
        borderColor: 'border-amber-500/50',
        buttonStyle: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
      }
    };
    return themes[generation];
  };
  
  const generationalTheme = getGenerationalTheme(currentGeneration);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStage, setCurrentStage] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);

  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
    retry: false,
  }) as { data: any };

  const submitAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      // If user is not logged in, just process locally
      if (!user) {
        return assessmentData;
      }
      return await apiRequest('POST', '/api/assessment/submit', assessmentData);
    },
    onSuccess: (data: any) => {
      setResults(data);
      setIsCompleted(true);
      toast({
        title: 'Assessment Complete!',
        description: `Your Biblical archetype is ${data.archetype}. ${!user ? 'Sign up to save your results!' : 'View your full results below.'}`,
      });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Want to save your results?',
          description: 'Sign up to save your assessment and unlock personalized features!',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 2000);
        return;
      }
      toast({
        title: 'Assessment Failed',
        description: 'Could not submit assessment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const currentStageQuestions = assessmentQuestions.filter(q => q.stage === currentStage);
  const currentQuestion = currentStageQuestions[currentQuestionIndex];
  const totalStages = 4;
  const stageProgress = ((currentQuestionIndex + 1) / currentStageQuestions.length) * 100;
  const overallProgress = (((currentStage - 1) * 25) + (stageProgress * 0.25));

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentStageQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentStage < totalStages) {
      setCurrentStage(currentStage + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Assessment complete - calculate results
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
      const prevStageQuestions = assessmentQuestions.filter(q => q.stage === currentStage - 1);
      setCurrentQuestionIndex(prevStageQuestions.length - 1);
    }
  };

  const calculateResults = () => {
    const scores = { pioneer: 0, organizer: 0, builder: 0, guardian: 0 };
    
    // Calculate weighted scores based on answers
    Object.values(answers).forEach(answer => {
      const question = assessmentQuestions.find(q => 
        q.options.some(opt => opt.value === answer)
      );
      const option = question?.options.find(opt => opt.value === answer);
      if (option?.archetype && option?.weight) {
        scores[option.archetype as keyof typeof scores] += option.weight;
      }
    });

    // Find the highest scoring archetype
    const topArchetype = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as keyof typeof scores] > scores[b[0] as keyof typeof scores] ? a : b
    )[0] as keyof typeof archetypeInfo;

    const results = {
      archetype: topArchetype,
      scores,
      answers,
      completedAt: new Date().toISOString(),
      stage: 'R1' // Initial stage after first assessment
    };

    submitAssessmentMutation.mutate(results);
  };

  const getStageTitle = (stage: number) => {
    switch (stage) {
      case 1: return 'R1: Foundation - Core Leadership Style';
      case 2: return 'R2: Relationships - Interpersonal Dynamics';
      case 3: return 'R3: Spiritual Integration - Divine Alignment';
      case 4: return 'R4: Generational Impact - Legacy & Influence';
      default: return `Stage ${stage}`;
    }
  };

  const canProceed = answers[currentQuestion?.id];
  const isLastStage = currentStage === totalStages;
  const isLastQuestionInStage = currentQuestionIndex === currentStageQuestions.length - 1;

  if (isCompleted && results) {
    const archetype = archetypeInfo[results.archetype as keyof typeof archetypeInfo];
    
    return (
      <div className="min-h-screen cosmic-gradient">
        <Navigation />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Assessment Complete!</h1>
            <p className="text-muted-foreground">Your Biblical leadership archetype has been revealed</p>
          </div>

          <Card className={`${generationalTheme.cardBg} backdrop-blur-sm ${generationalTheme.borderColor} border-2 mb-8 shadow-2xl`}>
            <CardHeader className="text-center pb-6">
              {/* Archetype Image */}
              <div className="mb-6">
                <img 
                  src={getArchetypeImage(results.archetype)}
                  alt={`${archetype.name} Archetype`}
                  className="w-32 h-32 mx-auto rounded-full border-4 border-cosmic-golden shadow-lg object-cover"
                />
              </div>
              
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="hebrew-letter text-4xl text-cosmic-golden">{archetype.hebrewLetter}</div>
                <div className="text-6xl">{archetype.icon}</div>
              </div>
              <CardTitle className={`text-3xl mb-2 ${generationalTheme.textStyle} font-bold`}>The {archetype.name}</CardTitle>
              <p className="text-lg text-cosmic-silver">{archetype.description}</p>
              
              {/* Generational Badge */}
              <div className="mt-4">
                <Badge className={`${generationalTheme.buttonStyle} text-white px-4 py-1`}>
                  {currentGeneration.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Leadership Style
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Your Core Strengths:</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {archetype.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Biblical Example:</h3>
                <p className="text-muted-foreground">{archetype.biblicalExample}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Your Archetype Scores:</h3>
                <div className="space-y-3">
                  {Object.entries(results.scores).map(([type, score]) => {
                    const info = archetypeInfo[type as keyof typeof archetypeInfo];
                    const percentage = ((score as number) / Math.max(...Object.values(results.scores).map(s => s as number))) * 100;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center space-x-2">
                            <span>{info.icon}</span>
                            <span className="font-medium">{info.name}</span>
                          </span>
                          <span className="text-sm text-muted-foreground">{score as number} points</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center space-x-4 pt-4">
                {user ? (
                  <>
                    <Button onClick={() => setLocation('/profile')} className={`${generationalTheme.buttonStyle} text-white font-semibold`} data-testid="button-view-profile">
                      <Target className="mr-2 h-4 w-4" />
                      View Full Profile
                    </Button>
                    <Button variant="outline" onClick={() => setLocation('/meditation')} className={`border-cosmic-golden text-cosmic-golden hover:bg-cosmic-golden hover:text-cosmic-deep`} data-testid="button-start-meditation">
                      <Crown className="mr-2 h-4 w-4" />
                      Begin Meditation Practice
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => window.location.href = '/api/login'} className={`${generationalTheme.buttonStyle} text-white font-semibold`} data-testid="button-sign-up">
                      <Target className="mr-2 h-4 w-4" />
                      Sign Up to Save Results
                    </Button>
                    <Button variant="outline" onClick={() => setLocation('/')} className="border-cosmic-golden text-cosmic-golden hover:bg-cosmic-golden hover:text-cosmic-deep" data-testid="button-explore-more">
                      <Crown className="mr-2 h-4 w-4" />
                      Explore More
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading only if we're still checking authentication for logged-in users
  if (user && !userProfile && !authLoading) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="hebrew-letter animate-pulse-slow">פ</div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />
      
      <Navigation />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            {/* Four Archetypes Hero Image */}
            <div className="mb-12">
              <img 
                src={archetypesImage}
                alt="Biblical Leadership Spiritual Illustration"
                className="w-full max-w-4xl mx-auto rounded-lg shadow-2xl"
                style={{minHeight: '400px', objectFit: 'contain'}}
              />
            </div>
          </div>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Compass className="h-8 w-8 text-amber-400" />
              <h1 className="text-4xl font-bold text-white">
                Biblical Leadership Assessment
              </h1>
            </div>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Discover your divine archetype and leadership calling through ancient wisdom patterns
            </p>
          </div>
          
          {/* Progress Indicators */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1">
                {getStageTitle(currentStage)}
              </Badge>
              <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                Question {currentQuestionIndex + 1} of {currentStageQuestions.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}% Complete</span>
              </div>
              <Progress value={overallProgress} className="h-3 bg-gray-800">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-300" 
                     style={{ width: `${overallProgress}%` }} />
              </Progress>
            </div>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="text-2xl text-amber-400 font-bold">פ</div>
              <CardTitle className="text-xl text-white">{currentQuestion?.text}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={answers[currentQuestion?.id] || ''}
              onValueChange={handleAnswer}
            >
              {currentQuestion?.options.map((option, index) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-700 hover:border-amber-500/50 hover:bg-gray-700/50 transition-colors">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="mt-1 border-gray-600 text-amber-400"
                    data-testid={`radio-option-${index}`}
                  />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer text-base leading-relaxed text-gray-100 hover:text-white"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStage === 1 && currentQuestionIndex === 0}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                data-testid="button-previous"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed || submitAssessmentMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-black font-semibold"
                data-testid="button-next"
              >
                {submitAssessmentMutation.isPending ? (
                  'Calculating...'
                ) : isLastStage && isLastQuestionInStage ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Assessment
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stage Overview */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Book className="h-5 w-5 text-amber-400" />
              <span>Assessment Stages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(stage => {
                const isActive = stage === currentStage;
                const isCompleted = stage < currentStage;
                return (
                  <div 
                    key={stage} 
                    className={`p-3 rounded-lg border text-center ${
                      isActive 
                        ? 'border-amber-500 bg-amber-500/20' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500/20' 
                          : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <div className={`font-semibold ${
                      isActive 
                        ? 'text-amber-400' 
                        : isCompleted 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                    }`}>
                      R{stage}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {getStageTitle(stage).split(': ')[1]}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}