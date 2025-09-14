import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: string;
}

const assessmentQuestions = {
  r1: [
    {
      id: 1,
      question: "When facing a significant decision, you tend to:",
      options: [
        {
          value: "vision",
          title: "Seek vision and inspiration first",
          description: "You look for the bigger picture and divine guidance",
        },
        {
          value: "analysis",
          title: "Gather all available information",
          description: "You prefer thorough analysis before moving forward",
        },
        {
          value: "relationships",
          title: "Consider impact on relationships",
          description: "You evaluate how it affects your community and team",
        },
      ],
    },
    {
      id: 2,
      question: "Your natural leadership style is:",
      options: [
        {
          value: "pioneering",
          title: "Pioneering new paths",
          description: "You enjoy breaking new ground and exploring possibilities",
        },
        {
          value: "organizing",
          title: "Organizing and coordinating",
          description: "You excel at bringing order and structure to chaos",
        },
        {
          value: "building",
          title: "Building strong foundations",
          description: "You focus on creating stable, lasting systems",
        },
      ],
    },
    {
      id: 3,
      question: "In team settings, you are most energized by:",
      options: [
        {
          value: "innovation",
          title: "Innovation and creativity",
          description: "Generating new ideas and exploring possibilities",
        },
        {
          value: "collaboration",
          title: "Collaboration and harmony",
          description: "Bringing people together and facilitating connection",
        },
        {
          value: "execution",
          title: "Execution and results",
          description: "Getting things done and achieving measurable outcomes",
        },
      ],
    },
  ],
  r2: [
    // Add R2 questions here
    {
      id: 1,
      question: "How do you define boundaries in leadership?",
      options: [
        {
          value: "clear_expectations",
          title: "Clear expectations and roles",
          description: "Define what each person should do and when",
        },
        {
          value: "flexible_guidelines",
          title: "Flexible guidelines",
          description: "Provide direction while allowing adaptation",
        },
        {
          value: "collaborative_agreements",
          title: "Collaborative agreements",
          description: "Co-create boundaries with team input",
        },
      ],
    },
  ],
};

export default function AssessmentModal({ open, onOpenChange, stage }: AssessmentModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const questions = assessmentQuestions[stage as keyof typeof assessmentQuestions] || assessmentQuestions.r1;
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      return response.json();
    },
    onSuccess: (assessment) => {
      // Complete the assessment with results
      completeAssessmentMutation.mutate({
        id: assessment.id,
        results: calculateResults(),
      });
    },
    onError: (error) => {
      console.error("Error creating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to create assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeAssessmentMutation = useMutation({
    mutationFn: async ({ id, results }: { id: string; results: any }) => {
      const response = await apiRequest("PATCH", `/api/assessments/${id}/complete`, { results });
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      const assessmentResults = calculateResults();
      
      toast({
        title: "Assessment Complete",
        description: `You are a ${assessmentResults.archetype} leader. Redirecting to your personalized matrix...`,
      });
      
      onOpenChange(false);
      resetAssessment();
      
      // Redirect to matrix with archetype and starting chapter
      setTimeout(() => {
        setLocation(`/matrix?chapter=1&archetype=${assessmentResults.archetype}&generation=${stage}`);
      }, 1500);
    },
    onError: (error) => {
      console.error("Error completing assessment:", error);
      toast({
        title: "Error",
        description: "Failed to complete assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResponse = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Submit assessment
      submitAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const submitAssessment = () => {
    createAssessmentMutation.mutate({
      stage,
      responses,
    });
  };

  const calculateResults = () => {
    // Simplified archetype calculation based on responses
    const responseValues = Object.values(responses);
    const archetypeScores = {
      pioneer: 0,
      organizer: 0,
      builder: 0,
      guardian: 0,
    };

    responseValues.forEach(response => {
      switch (response) {
        case 'vision':
        case 'pioneering':
        case 'innovation':
          archetypeScores.pioneer++;
          break;
        case 'relationships':
        case 'collaboration':
        case 'collaborative_agreements':
          archetypeScores.organizer++;
          break;
        case 'analysis':
        case 'building':
        case 'execution':
          archetypeScores.builder++;
          break;
        case 'clear_expectations':
        case 'flexible_guidelines':
          archetypeScores.guardian++;
          break;
      }
    });

    const dominantArchetype = Object.entries(archetypeScores).reduce((a, b) => 
      archetypeScores[a[0] as keyof typeof archetypeScores] > archetypeScores[b[0] as keyof typeof archetypeScores] ? a : b
    )[0];

    return {
      archetype: dominantArchetype,
      scores: archetypeScores,
      stage,
      completedAt: new Date().toISOString(),
    };
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setResponses({});
  };

  const currentQuestionData = questions[currentQuestion];
  const selectedValue = responses[currentQuestionData.id];
  const canProceed = !!selectedValue;

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'r1': return 'Identity Foundations Assessment';
      case 'r2': return 'Calling Clarity Assessment';
      case 'r3': return 'Formation Habits Assessment';
      case 'r4': return 'Team Alignment Assessment';
      case 'r5': return 'Role in the Whole Assessment';
      default: return 'Leadership Assessment';
    }
  };

  const getStageDescription = (stage: string) => {
    switch (stage) {
      case 'r1': return 'Discover your leadership archetype';
      case 'r2': return 'Define your calling and boundaries';
      case 'r3': return 'Build sustainable practices';
      case 'r4': return 'Create team alignment';
      case 'r5': return 'Understand your role in the whole';
      default: return 'Explore your leadership journey';
    }
  };

  const getHebrewLetter = (stage: string) => {
    switch (stage) {
      case 'r1': return 'א';
      case 'r2': return 'ב';
      case 'r3': return 'ג';
      case 'r4': return 'ד';
      case 'r5': return 'ה';
      default: return 'א';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-assessment">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {getStageTitle(stage)}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {getStageDescription(stage)}
              </DialogDescription>
            </div>
            <div className="hebrew-letter text-2xl">{getHebrewLetter(stage)}</div>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" data-testid="progress-assessment" />
            <div className="text-sm text-muted-foreground mt-1">
              Question <span data-testid="text-current-question">{currentQuestion + 1}</span> of{" "}
              <span data-testid="text-total-questions">{totalQuestions}</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-6">
          <h3 className="text-lg font-medium mb-6" data-testid="text-question">
            {currentQuestionData.question}
          </h3>
          
          <RadioGroup 
            value={selectedValue || ""} 
            onValueChange={handleResponse}
            className="space-y-3"
          >
            {currentQuestionData.options.map((option, index) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label 
                  htmlFor={option.value}
                  className="flex-1 p-4 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                  data-testid={`option-${option.value}`}
                >
                  <div className="font-medium">{option.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex items-center justify-between">
          <Button 
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            data-testid="button-previous"
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!canProceed || createAssessmentMutation.isPending || completeAssessmentMutation.isPending}
            data-testid="button-next"
          >
            {currentQuestion === totalQuestions - 1 
              ? createAssessmentMutation.isPending || completeAssessmentMutation.isPending 
                ? "Submitting..." 
                : "Complete Assessment"
              : "Next Question"
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
