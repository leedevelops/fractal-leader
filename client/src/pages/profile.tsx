import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/ui/navigation';
import { isUnauthorizedError } from '@/lib/authUtils';
import { User, Settings, Crown, Zap } from 'lucide-react';

const archetypeColors = {
  Pioneer: 'bg-red-500/20 text-red-700 dark:text-red-300',
  Organizer: 'bg-blue-500/20 text-blue-700 dark:text-blue-300', 
  Builder: 'bg-green-500/20 text-green-700 dark:text-green-300',
  Guardian: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
};

const stageColors = {
  'R1': 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'R2': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'R3': 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
  'R4': 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  'R5': 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
  'Hidden': 'bg-gradient-to-r from-cosmic-golden/20 to-cosmic-purple/20 text-cosmic-golden dark:text-cosmic-golden',
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');

  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  }) as { data: any };

  const hebrewNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest('POST', '/api/hebrew-name', { name });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Hebrew Name Updated',
        description: `Your Hebrew name is now: ${data.hebrewName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/api/login';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to convert Hebrew name. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleHebrewNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      hebrewNameMutation.mutate(name.trim());
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="hebrew-letter animate-pulse-slow">פ</div>
          <p className="text-muted-foreground">Loading your biblical identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Biblical Identity Profile</h1>
          <p className="text-muted-foreground">
            Your unique patterns within God's design for leadership
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Personal Identity */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <User className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Personal Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">English Name</h3>
                <p className="text-lg text-foreground">
                  {userProfile.firstName} {userProfile.lastName}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Hebrew Name</h3>
                <div className="flex items-center space-x-4">
                  <div className="hebrew-letter text-2xl">
                    {userProfile.hebrewName || '???'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {userProfile.hebrewName ? 'Your name in biblical letters' : 'Convert your name to Hebrew'}
                  </div>
                </div>
                
                <form onSubmit={handleHebrewNameSubmit} className="mt-4 flex space-x-2">
                  <Input
                    placeholder="Enter your name to convert"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                    data-testid="input-hebrew-name"
                  />
                  <Button 
                    type="submit" 
                    disabled={hebrewNameMutation.isPending}
                    data-testid="button-convert-hebrew"
                  >
                    {hebrewNameMutation.isPending ? 'Converting...' : 'Convert'}
                  </Button>
                </form>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Biblical Archetype */}
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Crown className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Biblical Archetype</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Leadership Pattern</h3>
                {userProfile.biblicalArchetype ? (
                  <Badge 
                    className={`text-lg px-4 py-2 ${archetypeColors[userProfile.biblicalArchetype as keyof typeof archetypeColors]}`}
                    data-testid="badge-archetype"
                  >
                    {userProfile.biblicalArchetype}
                  </Badge>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">Take the assessment to discover your archetype</p>
                    <Button size="sm" data-testid="button-take-assessment">
                      Start Assessment
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-semibold mb-3">Development Stage</h3>
                {userProfile.currentStage ? (
                  <Badge 
                    className={`text-lg px-4 py-2 ${stageColors[userProfile.currentStage as keyof typeof stageColors]}`}
                    data-testid="badge-stage"
                  >
                    {userProfile.currentStage === 'Hidden' ? 'Hidden Track' : `Stage ${userProfile.currentStage}`}
                  </Badge>
                ) : (
                  <Badge className="text-lg px-4 py-2 bg-muted text-muted-foreground">
                    Not Started
                  </Badge>
                )}
              </div>

              <Separator />
              
              <div>
                <h3 className="font-semibold mb-2">Generation</h3>
                <p className="text-lg">
                  {userProfile.generation || 'Not specified'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your generational cohort for team formation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="bg-card/80 backdrop-blur-sm border-border md:col-span-2">
            <CardHeader className="flex flex-row items-center space-y-0 pb-4">
              <Zap className="h-5 w-5 text-primary mr-2" />
              <CardTitle>Development Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.progress?.assessmentsCompleted || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Assessments Completed</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.progress?.practicesLogged || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Daily Practices Logged</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {userProfile.teams?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Teams Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}