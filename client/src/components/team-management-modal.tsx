import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Users, TrendingUp, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamManagementModal({ open, onOpenChange }: TeamManagementModalProps) {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!user && open,
  });

  // Mock team data for demonstration
  const mockTeamMembers = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      generation: 'millennial',
      archetype: 'organizer',
      hebrewInitial: 'ש',
      progress: 78,
      currentStage: 'R2 Active',
    },
    {
      id: '2',
      name: 'Marcus Rodriguez',
      email: 'marcus.r@example.com',
      generation: 'gen_x',
      archetype: 'builder',
      hebrewInitial: 'מ',
      progress: 92,
      currentStage: 'R3 Active',
    },
    {
      id: '3',
      name: 'Zoe Kim',
      email: 'zoe.kim@example.com',
      generation: 'gen_z',
      archetype: 'pioneer',
      hebrewInitial: 'צ',
      progress: 65,
      currentStage: 'R2 Active',
    },
  ];

  const mockTeamAnalytics = {
    crossGenEffectiveness: 28,
    effectivenessChange: 12,
    formationAlignment: {
      r1Complete: 100,
      r2Active: 73,
      r3Ready: 45,
    },
    archetypeDistribution: {
      pioneers: 3,
      organizers: 4,
      builders: 2,
      guardians: 2,
    },
  };

  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const response = await apiRequest("POST", "/api/teams", teamData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Team Created",
        description: "Your new team has been created successfully.",
      });
      setNewTeamName("");
    },
    onError: (error) => {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Team Name Required",
        description: "Please enter a name for your team.",
        variant: "destructive",
      });
      return;
    }

    createTeamMutation.mutate({
      name: newTeamName,
      organizationId: user?.organizationId || 'default-org',
      generationalMix: {},
      pactDetails: {},
    });
  };

  const getGenerationLabel = (generation: string) => {
    switch (generation) {
      case 'gen_z': return 'Gen Z';
      case 'millennial': return 'Millennial';
      case 'gen_x': return 'Gen X';
      case 'boomer': return 'Boomer';
      default: return generation;
    }
  };

  const getArchetypeColor = (archetype: string) => {
    switch (archetype) {
      case 'pioneer': return 'text-cosmic-golden';
      case 'organizer': return 'text-primary';
      case 'builder': return 'text-green-400';
      case 'guardian': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="dialog-team-management">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Team Formation & Management
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Cross-generational leadership dynamics
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="create">Create Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Team Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Dynamics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Cross-Gen Effectiveness</div>
                    <div className="text-2xl font-bold text-primary flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      +{mockTeamAnalytics.crossGenEffectiveness}%
                    </div>
                    <div className="text-xs text-green-400">↑ {mockTeamAnalytics.effectivenessChange}% this month</div>
                  </div>
                  
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Formation Alignment</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>R1 Complete</span>
                        <span className="text-green-400">{mockTeamAnalytics.formationAlignment.r1Complete}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>R2 Active</span>
                        <span className="text-accent">{mockTeamAnalytics.formationAlignment.r2Active}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>R3 Ready</span>
                        <span className="text-muted-foreground">{mockTeamAnalytics.formationAlignment.r3Ready}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Archetype Distribution</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Pioneers</span>
                        <span>{mockTeamAnalytics.archetypeDistribution.pioneers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Organizers</span>
                        <span>{mockTeamAnalytics.archetypeDistribution.organizers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Builders</span>
                        <span>{mockTeamAnalytics.archetypeDistribution.builders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Guardians</span>
                        <span>{mockTeamAnalytics.archetypeDistribution.guardians}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Pact Builder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Pact Builder</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <h4 className="font-medium mb-2">Communication Protocols</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Gen Z: Slack for urgent items</li>
                        <li>• Millennials: Weekly video check-ins</li>
                        <li>• Gen X: Email summaries with action items</li>
                        <li>• Boomers: Phone call backup plan</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-medium mb-2">Feedback Preferences</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Immediate feedback for quick iterations</li>
                        <li>• Milestone-based reviews for major decisions</li>
                        <li>• Collaborative reflection sessions</li>
                      </ul>
                    </div>

                    <Button className="w-full" data-testid="button-create-team-pact">
                      <Target className="w-4 h-4 mr-2" />
                      Create Team Pact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Team Members</CardTitle>
                  <Button size="sm" data-testid="button-add-member">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTeamMembers.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                      data-testid={`team-member-${member.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="hebrew-letter text-sm">{member.hebrewInitial}</span>
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <span>{getGenerationLabel(member.generation)}</span>
                            <span>•</span>
                            <span className={getArchetypeColor(member.archetype)}>
                              {member.archetype}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <Progress value={member.progress} className="w-16 h-1.5 mb-1" />
                          <div className="text-xs text-muted-foreground">{member.currentStage}</div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      data-testid="input-team-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="team-type">Team Type</Label>
                    <Select>
                      <SelectTrigger data-testid="select-team-type">
                        <SelectValue placeholder="Select team type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ministry">Ministry Team</SelectItem>
                        <SelectItem value="leadership">Leadership Council</SelectItem>
                        <SelectItem value="project">Project Team</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="primary-generation">Primary Generation Focus</Label>
                    <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
                      <SelectTrigger data-testid="select-generation">
                        <SelectValue placeholder="Select primary generation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gen_z">Gen Z</SelectItem>
                        <SelectItem value="millennial">Millennial</SelectItem>
                        <SelectItem value="gen_x">Gen X</SelectItem>
                        <SelectItem value="boomer">Boomer</SelectItem>
                        <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <h4 className="font-medium mb-2">Team Formation Guidelines</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Optimal teams include 2-3 different generations</li>
                      <li>• Balance pioneers, organizers, builders, and guardians</li>
                      <li>• Consider Hebrew name compatibility for fractal harmony</li>
                      <li>• Start with R1 assessment for all members</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleCreateTeam}
                    disabled={createTeamMutation.isPending}
                    className="w-full"
                    data-testid="button-create-team"
                  >
                    {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
