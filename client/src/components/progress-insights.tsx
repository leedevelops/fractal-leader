import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function ProgressInsights() {
  const { user } = useAuth() as any;

  // TEMPORARILY DISABLED: These queries were causing infinite loops and Firefox crashes
  const { data: progress } = useQuery({
    queryKey: ['/api/progress'],
    enabled: false, // DISABLED to stop browser crash
  });

  const { data: practices } = useQuery({
    queryKey: ['/api/practices'],
    enabled: false, // DISABLED to stop browser crash
  });

  // Calculate weekly completion from practices  
  const progressData = progress as any;
  const weeklyCompletion = progressData?.weeklyCompletion || 85;
  const tribalAlignment = progressData?.tribalAlignment || 92;

  // Mock cross-generational effectiveness data
  const crossGenEffectiveness = {
    teamCohesion: 24,
    communication: 31,
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="bg-card rounded-lg border border-border" data-testid="card-progress-insights">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Formation Insights</CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Weekly Streak */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Weekly Completion</span>
            <span className="text-sm font-medium text-cosmic-golden" data-testid="text-weekly-completion">
              {weeklyCompletion}%
            </span>
          </div>
          <Progress 
            value={weeklyCompletion} 
            className="h-2 mb-1"
            data-testid="progress-weekly-completion"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>

        {/* Tribal Alignment */}
        <div className="mb-6">
          <div className="text-sm text-muted-foreground mb-2">Tribal Alignment Score</div>
          <div className="flex items-center space-x-3">
            <div className="hebrew-letter text-xl">א</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Abraham Pattern</span>
                <span className="text-sm text-cosmic-golden" data-testid="text-tribal-alignment">
                  {tribalAlignment}%
                </span>
              </div>
              <Progress 
                value={tribalAlignment} 
                className="h-1.5"
                data-testid="progress-tribal-alignment"
              />
            </div>
          </div>
        </div>

        {/* Cross-Gen Effectiveness */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Cross-Generational Effectiveness
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <div className="text-lg font-semibold text-primary flex items-center justify-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{crossGenEffectiveness.teamCohesion}%
              </div>
              <div className="text-xs text-muted-foreground">Team Cohesion</div>
            </div>
            <div className="text-center p-3 bg-cosmic-golden/10 rounded-lg">
              <div className="text-lg font-semibold text-cosmic-golden flex items-center justify-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{crossGenEffectiveness.communication}%
              </div>
              <div className="text-xs text-muted-foreground">Communication</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
