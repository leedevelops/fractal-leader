import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/ui/navigation';
import { isUnauthorizedError } from '@/lib/authUtils';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download, 
  Trash2, 
  Crown, 
  CreditCard, 
  Moon, 
  Sun 
} from 'lucide-react';

const generationOptions = {
  gen_z: 'Gen Z (1997-2012)',
  millennial: 'Millennial (1981-1996)',
  gen_x: 'Gen X (1965-1980)',
  boomer: 'Baby Boomer (1946-1964)'
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  }) as { data: any };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    generation: '',
    notifications: {
      email: true,
      practice: true,
      teams: true,
      assessments: true,
    },
    privacy: {
      profileVisible: true,
      progressVisible: false,
    }
  });

  // Update form data when user profile loads
  useState(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        generation: userProfile.generation || '',
      }));
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', '/api/auth/user', data);
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
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
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('GET', '/api/export/data');
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fractal-leader-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Data Exported',
        description: 'Your data has been downloaded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    toast({
      title: 'Theme Updated',
      description: `Switched to ${newDarkMode ? 'dark' : 'light'} mode.`,
    });
  };

  const handleProfileSave = () => {
    updateProfileMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      generation: formData.generation,
    });
  };

  const handleExportData = () => {
    exportDataMutation.mutate();
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="hebrew-letter animate-pulse-slow">פ</div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and platform settings
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance" data-testid="tab-appearance">Appearance</TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <User className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={userProfile.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update your email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generation">Generation</Label>
                  <Select 
                    value={formData.generation} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, generation: value }))}
                  >
                    <SelectTrigger data-testid="select-generation">
                      <SelectValue placeholder="Select your generation" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(generationOptions).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileSave}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Bell className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch 
                      id="email-notifications"
                      checked={formData.notifications.email}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, email: checked } 
                        }))
                      }
                      data-testid="switch-email-notifications"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="practice-reminders">Daily Practice Reminders</Label>
                      <p className="text-sm text-muted-foreground">Reminders for meditation and assessments</p>
                    </div>
                    <Switch 
                      id="practice-reminders"
                      checked={formData.notifications.practice}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, practice: checked } 
                        }))
                      }
                      data-testid="switch-practice-reminders"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="team-updates">Team Updates</Label>
                      <p className="text-sm text-muted-foreground">Notifications about your teams and organizations</p>
                    </div>
                    <Switch 
                      id="team-updates"
                      checked={formData.notifications.teams}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, teams: checked } 
                        }))
                      }
                      data-testid="switch-team-updates"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="assessment-results">Assessment Results</Label>
                      <p className="text-sm text-muted-foreground">Updates on archetype assessments and progress</p>
                    </div>
                    <Switch 
                      id="assessment-results"
                      checked={formData.notifications.assessments}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, assessments: checked } 
                        }))
                      }
                      data-testid="switch-assessment-results"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Palette className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Appearance & Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <Switch 
                      checked={isDarkMode}
                      onCheckedChange={toggleTheme}
                      data-testid="switch-dark-mode"
                    />
                    <Moon className="h-4 w-4" />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Hebrew Font Display</Label>
                  <p className="text-sm text-muted-foreground mb-4">Preview of Hebrew letter styling in your theme</p>
                  <div className="border border-border rounded-lg p-6 text-center bg-background/50">
                    <div className="hebrew-letter text-4xl mb-2">פ</div>
                    <p className="text-sm text-muted-foreground">Peh - The mouth that speaks divine truth</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Shield className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Privacy & Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visible">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your profile information</p>
                    </div>
                    <Switch 
                      id="profile-visible"
                      checked={formData.privacy.profileVisible}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          privacy: { ...prev.privacy, profileVisible: checked } 
                        }))
                      }
                      data-testid="switch-profile-visible"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="progress-visible">Show Progress to Team</Label>
                      <p className="text-sm text-muted-foreground">Share your development progress with team members</p>
                    </div>
                    <Switch 
                      id="progress-visible"
                      checked={formData.privacy.progressVisible}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          privacy: { ...prev.privacy, progressVisible: checked } 
                        }))
                      }
                      data-testid="switch-progress-visible"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Data Management</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={handleExportData}
                      disabled={exportDataMutation.isPending}
                      data-testid="button-export-data"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {exportDataMutation.isPending ? 'Exporting...' : 'Export My Data'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Download all your personal data in JSON format
                    </p>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your data is encrypted and stored securely. We never share personal information without your explicit consent.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription">
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <Crown className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Subscription & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">Your current subscription tier</p>
                  </div>
                  <Badge className="bg-primary/20 text-primary px-4 py-2 text-lg">
                    Seeker (Free)
                  </Badge>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-2 border-primary/20">
                    <CardHeader className="text-center">
                      <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <CardTitle>Pioneer</CardTitle>
                      <div className="text-2xl font-bold">$45<span className="text-lg font-normal">/month</span></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div>✓ Full Biblical Matrix access</div>
                        <div>✓ Advanced frequency meditations</div>
                        <div>✓ Team leadership tools</div>
                        <div>✓ Priority support</div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => setLocation('/subscribe')}>
                        Upgrade to Pioneer
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-500/20">
                    <CardHeader className="text-center">
                      <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <CardTitle>Visionary</CardTitle>
                      <div className="text-2xl font-bold">$99<span className="text-lg font-normal">/month</span></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm space-y-1">
                        <div>✓ Everything in Pioneer</div>
                        <div>✓ Multi-organization management</div>
                        <div>✓ Advanced analytics</div>
                        <div>✓ White-label options</div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => setLocation('/subscribe')}>
                        Upgrade to Visionary
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Subscriptions include a 7-day free trial. Cancel anytime with no questions asked.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}