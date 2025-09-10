import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Handshake, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import TeamManagementModal from "./team-management-modal";

const generationData = [
  {
    key: 'gen_z',
    name: 'Gen Z',
    emoji: '🎮',
    color: 'from-purple-500/20 to-pink-500/20',
    description: 'Gamified learning, quick feedback',
  },
  {
    key: 'millennial',
    name: 'Millennial',
    emoji: '🤝',
    color: 'from-blue-500/20 to-cyan-500/20',
    description: 'Collaborative, peer-driven',
  },
  {
    key: 'gen_x',
    name: 'Gen X',
    emoji: '📊',
    color: 'from-green-500/20 to-emerald-500/20',
    description: 'Practical, KPI-focused',
  },
  {
    key: 'boomer',
    name: 'Boomer',
    emoji: '📋',
    color: 'from-amber-500/20 to-orange-500/20',
    description: 'Structured, milestone-based',
  },
];

export default function TeamFormation() {
  const { user } = useAuth();
  const [showTeamModal, setShowTeamModal] = useState(false);

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!user,
  });

  // Mock generational mix data - in production, this would be calculated from team members
  const mockGenerationalMix = {
    gen_z: 2,
    millennial: 5,
    gen_x: 3,
    boomer: 1,
  };

  const mockTeamPacts = [
    {
      id: '1',
      name: 'Marketing Team Alignment',
      generationCount: 4,
      createdDays: 3,
      status: 'active',
    },
    {
      id: '2',
      name: 'Leadership Council',
      generationCount: 3,
      createdDays: 7,
      status: 'forming',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'forming': return 'text-amber-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'forming': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Card className="bg-card rounded-lg border border-border" data-testid="card-team-formation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Team Dynamics</CardTitle>
            <Button 
              onClick={() => setShowTeamModal(true)}
              className="px-4 py-2"
              data-testid="button-create-pact"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pact
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Generational Mix Visualization */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {generationData.map((gen) => (
              <div 
                key={gen.key}
                className={`text-center p-4 bg-gradient-to-br ${gen.color} rounded-lg`}
                data-testid={`generation-card-${gen.key}`}
              >
                <div className="text-2xl mb-2">{gen.emoji}</div>
                <div className="text-sm font-medium">{gen.name}</div>
                <div className="text-xs text-muted-foreground">
                  {mockGenerationalMix[gen.key as keyof typeof mockGenerationalMix] || 0} members
                </div>
              </div>
            ))}
          </div>

          {/* Active Team Pacts */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">Active Team Pacts</h4>
            
            {mockTeamPacts.map((pact) => (
              <div 
                key={pact.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                data-testid={`team-pact-${pact.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    {pact.status === 'active' ? (
                      <Handshake className="text-primary text-sm" />
                    ) : (
                      <Users className="text-accent text-sm" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{pact.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pact.generationCount} generations • Created {pact.createdDays} days ago
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusIcon(pact.status)}`}></div>
                  <span className={`text-sm capitalize ${getStatusColor(pact.status)}`}>
                    {pact.status}
                  </span>
                </div>
              </div>
            ))}
            
            {mockTeamPacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No team pacts created yet</p>
                <p className="text-sm">Create your first cross-generational team pact</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TeamManagementModal 
        open={showTeamModal} 
        onOpenChange={setShowTeamModal}
      />
    </>
  );
}
