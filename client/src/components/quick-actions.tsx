import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, MessageSquare, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { startFrequencyMeditation } from "@/lib/frequency-meditation";
import { adaptContentForGeneration } from "@/lib/generational-adaptation";
import AssessmentModal from "./assessment-modal";

export default function QuickActions() {
  const { user } = useAuth() as any;
  const [showAssessment, setShowAssessment] = useState(false);
  const [meditationActive, setMeditationActive] = useState(false);

  const handleReflection = () => {
    setShowAssessment(true);
  };

  const handleMeditation = async () => {
    setMeditationActive(true);
    try {
      await startFrequencyMeditation(260);
    } catch (error) {
      console.error("Error starting meditation:", error);
    } finally {
      setMeditationActive(false);
    }
  };

  const handleTeamCheckin = () => {
    // Navigate to team check-in interface
    console.log("Navigate to team check-in");
  };

  // Adapt content based on user's generation
  const adaptedContent = adaptContentForGeneration(user?.generation || 'millennial', {
    reflection: {
      title: "Genesis Reflection",
      description: "Day 2: How does separation create clarity in your leadership?",
      duration: "5 min",
      frequency: "260 Hz",
    },
    meditation: {
      title: "Frequency Meditation",
      description: "Align with the universal frequency of transformation",
      duration: "5 min",
      frequency: "260 Hz",
    },
    teamCheckin: {
      title: "Team Check-in",
      description: "Connect with your Marketing Team Alignment pact",
      duration: "10 min",
      type: "Cross-Gen",
    },
  });

  return (
    <>
      <Card className="bg-card rounded-lg border border-border" data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daily Practice</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Genesis Reflection */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{adaptedContent.reflection.title}</h4>
                <Badge className="text-xs bg-primary/20 px-2 py-1 rounded-full text-primary">
                  {adaptedContent.reflection.duration}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {adaptedContent.reflection.description}
              </p>
              <Button 
                onClick={handleReflection}
                className="w-full py-2"
                data-testid="button-begin-reflection"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Begin Reflection
              </Button>
            </div>

            {/* Frequency Meditation */}
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{adaptedContent.meditation.title}</h4>
                <Badge className="text-xs bg-cosmic-golden/20 px-2 py-1 rounded-full text-cosmic-golden">
                  {adaptedContent.meditation.frequency}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {adaptedContent.meditation.description}
              </p>
              <Button 
                variant="secondary"
                onClick={handleMeditation}
                disabled={meditationActive}
                className="w-full py-2"
                data-testid="button-start-meditation"
              >
                <Headphones className="w-4 h-4 mr-2" />
                {meditationActive ? "Meditating..." : "Start Session"}
              </Button>
            </div>

            {/* Team Check-in */}
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{adaptedContent.teamCheckin.title}</h4>
                <Badge className="text-xs bg-accent/20 px-2 py-1 rounded-full text-accent">
                  {adaptedContent.teamCheckin.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {adaptedContent.teamCheckin.description}
              </p>
              <Button 
                variant="secondary"
                onClick={handleTeamCheckin}
                className="w-full py-2"
                data-testid="button-join-circle"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Join Circle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AssessmentModal 
        open={showAssessment}
        onOpenChange={setShowAssessment}
        stage="r2"
      />
    </>
  );
}
