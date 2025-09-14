import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const genesisStages = [
  {
    id: 'r1',
    title: 'R1: Identity Foundations',
    description: 'Day 1: Let there be light - Discover your core calling',
    hebrew: 'א',
    day: 1,
  },
  {
    id: 'r2',
    title: 'R2: Calling Clarity',
    description: 'Day 2: Separate waters - Define your leadership boundaries',
    hebrew: 'ב',
    day: 2,
  },
  {
    id: 'r3',
    title: 'R3: Formation Habits',
    description: 'Day 3: Gather dry land - Build sustainable practices',
    hebrew: 'ג',
    day: 3,
  },
  {
    id: 'r4',
    title: 'R4: Team Alignment',
    description: 'Day 4: Create lights - Illuminate relationships',
    hebrew: 'ד',
    day: 4,
  },
  {
    id: 'r5',
    title: 'R5: Role in the Whole',
    description: 'Day 5: Fill waters and skies - Expand influence',
    hebrew: 'ה',
    day: 5,
  },
];

export default function DevelopmentProgress() {
  const { user } = useAuth() as any;
  
  // TEMPORARILY DISABLED: These queries were causing infinite loops and Firefox crashes
  const { data: progress } = useQuery({
    queryKey: ['/api/progress'],
    enabled: false, // DISABLED to stop browser crash
  });

  const { data: assessments } = useQuery({
    queryKey: ['/api/assessments'],
    enabled: false, // DISABLED to stop browser crash
  });

  const getStageStatus = (stageId: string) => {
    if (!progress) return { status: 'locked', progress: 0 };
    
    const completed = (progress as any)?.completedStages || [];
    const current = (progress as any)?.currentStage;
    
    if (completed.includes(stageId)) {
      return { status: 'complete', progress: 100 };
    } else if (current === stageId) {
      return { status: 'active', progress: 65 };
    } else {
      return { status: 'locked', progress: 0 };
    }
  };

  const getStageStyles = (status: string) => {
    switch (status) {
      case 'complete':
        return {
          container: 'bg-primary/20 border-primary/30',
          badge: 'bg-primary text-primary-foreground',
          text: 'text-primary',
        };
      case 'active':
        return {
          container: 'bg-accent/10 border border-accent/30',
          badge: 'bg-accent text-accent-foreground',
          text: 'text-accent',
        };
      default:
        return {
          container: 'bg-secondary/20 opacity-50',
          badge: 'bg-secondary text-secondary-foreground',
          text: 'text-muted-foreground',
        };
    }
  };

  return (
    <Card className="bg-card rounded-lg border border-border" data-testid="card-development-progress">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Formation Journey</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {genesisStages.map((stage) => {
            const { status, progress: stageProgress } = getStageStatus(stage.id);
            const styles = getStageStyles(status);
            
            return (
              <div 
                key={stage.id}
                className={`flex items-center space-x-4 p-4 rounded-lg ${styles.container}`}
                data-testid={`stage-${stage.id}`}
              >
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="hebrew-letter text-lg">{stage.hebrew}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{stage.title}</h4>
                    <Badge 
                      className={styles.badge}
                      data-testid={`badge-${stage.id}-status`}
                    >
                      {status === 'complete' ? 'Complete' : 
                       status === 'active' ? 'In Progress' : 'Locked'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {stage.description}
                  </p>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={stageProgress} 
                      className="h-2"
                      data-testid={`progress-${stage.id}`}
                    />
                    <div className="text-xs text-muted-foreground">
                      {stageProgress}% complete
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Hidden Track */}
          {((progress as any)?.completedStages?.length >= 5) && (
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-cosmic-golden/10 to-cosmic-silver/10 rounded-lg border border-cosmic-golden/30">
              <div className="w-10 h-10 bg-cosmic-golden/20 rounded-full flex items-center justify-center">
                <span className="hebrew-letter text-lg">ו</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-cosmic-golden">Hidden Track: Quiet Flame</h4>
                  <Badge className="bg-cosmic-golden/20 text-cosmic-golden">
                    Unlocked
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  Day 6: Rest and reflect - Deep wisdom practices
                </p>
                
                <Progress 
                  value={0} 
                  className="h-2"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
