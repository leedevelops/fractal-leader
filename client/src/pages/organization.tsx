import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import Navigation from '@/components/ui/navigation';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Building2, Users, Settings, Plus, Crown, Target, TrendingUp, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const organizationTypes = {
  church: {
    label: 'Church',
    icon: '⛪',
    description: 'Multi-generational congregation leadership',
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    features: ['Pastoral teams', 'Ministry coordination', 'Cross-generational unity']
  },
  remote_team: {
    label: 'Remote Team',
    icon: '💻',
    description: 'Distributed team leadership and culture',
    color: 'bg-green-500/20 text-green-700 dark:text-green-300',
    features: ['Virtual collaboration', 'Culture building', 'Performance tracking']
  },
  smb: {
    label: 'Small Business',
    icon: '🏢',
    description: 'Small to medium business leadership',
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    features: ['Team development', 'Leadership pipeline', 'Growth planning']
  }
};

const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  type: z.enum(['church', 'remote_team', 'smb']),
  description: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']),
  location: z.string().optional(),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['member', 'leader', 'admin']),
  message: z.string().optional(),
});

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export default function Organization() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  }) as { data: any };

  const createForm = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      type: 'church',
      description: '',
      size: 'small',
      location: '',
    },
  });

  const inviteForm = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'member',
      message: '',
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: CreateOrgForm) => {
      return await apiRequest('POST', '/api/organizations', data);
    },
    onSuccess: () => {
      toast({
        title: 'Organization Created',
        description: 'Your organization has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
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
        description: 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberForm) => {
      return await apiRequest('POST', '/api/organizations/invite', data);
    },
    onSuccess: () => {
      toast({
        title: 'Invitation Sent',
        description: 'Team member invitation has been sent via email.',
      });
      setIsInviteDialogOpen(false);
      inviteForm.reset();
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
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onCreateSubmit = (data: CreateOrgForm) => {
    createOrgMutation.mutate(data);
  };

  const onInviteSubmit = (data: InviteMemberForm) => {
    inviteMemberMutation.mutate(data);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="hebrew-letter animate-pulse-slow">פ</div>
          <p className="text-muted-foreground">Loading your organization...</p>
        </div>
      </div>
    );
  }

  const hasOrganization = userProfile.organization;
  const organization = userProfile.organization;

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Organization Management</h1>
          <p className="text-muted-foreground">
            Build and lead multi-generational teams with biblical leadership principles
          </p>
        </div>

        {!hasOrganization ? (
          // No Organization - Show Creation Options
          <div className="space-y-8">
            <Card className="bg-card/80 backdrop-blur-sm border-border text-center py-12">
              <CardContent className="space-y-6">
                <div className="hebrew-letter text-4xl">ה</div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Create Your Organization</h2>
                  <p className="text-muted-foreground mb-6">
                    Start building your multi-generational leadership team with biblical foundations
                  </p>
                </div>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="px-8 py-3" data-testid="button-create-organization">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Organization</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter organization name" {...field} data-testid="input-org-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-org-type">
                                    <SelectValue placeholder="Select organization type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(organizationTypes).map(([key, type]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center space-x-2">
                                        <span>{type.icon}</span>
                                        <div>
                                          <div className="font-medium">{type.label}</div>
                                          <div className="text-sm text-muted-foreground">{type.description}</div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your organization's mission and vision" 
                                  {...field} 
                                  data-testid="textarea-org-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="size"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Size</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-org-size">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="small">Small (2-20 members)</SelectItem>
                                    <SelectItem value="medium">Medium (21-100 members)</SelectItem>
                                    <SelectItem value="large">Large (100+ members)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={createForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="City, State" {...field} data-testid="input-org-location" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createOrgMutation.isPending}
                            data-testid="button-submit-create-org"
                          >
                            {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Organization Type Options */}
            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(organizationTypes).map(([key, type]) => (
                <Card key={key} className="bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{type.icon}</div>
                    <CardTitle className="text-xl">{type.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">{type.description}</p>
                    <div className="space-y-2">
                      {type.features.map((feature, index) => (
                        <div key={index} className="text-sm text-foreground">
                          ✓ {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Has Organization - Show Management Dashboard
          <div className="space-y-8">
            {/* Organization Header */}
            <Card className={`bg-card/80 backdrop-blur-sm border-border ${organizationTypes[organization.type as keyof typeof organizationTypes].color.replace('text-', 'border-').replace('dark:text-', 'dark:border-')}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">{organizationTypes[organization.type as keyof typeof organizationTypes].icon}</div>
                    <div>
                      <CardTitle className="text-2xl">{organization.name}</CardTitle>
                      <p className="text-muted-foreground">{organizationTypes[organization.type as keyof typeof organizationTypes].label}</p>
                    </div>
                  </div>
                  <Badge className={organizationTypes[organization.type as keyof typeof organizationTypes].color}>
                    {organizationTypes[organization.type as keyof typeof organizationTypes].label}
                  </Badge>
                </div>
                {organization.description && (
                  <p className="text-muted-foreground mt-4">{organization.description}</p>
                )}
              </CardHeader>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="text-center py-6">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">{userProfile.teams?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Active Teams</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="text-center py-6">
                  <Crown className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">3</div>
                  <p className="text-sm text-muted-foreground">Leaders Developed</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="text-center py-6">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">87%</div>
                  <p className="text-sm text-muted-foreground">Goal Completion</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardContent className="text-center py-6">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">+12%</div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Management Actions */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                  <Users className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Team Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Build and manage cross-generational teams</p>
                  <div className="space-y-3">
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" data-testid="button-invite-member">
                          <Mail className="mr-2 h-4 w-4" />
                          Invite Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                        </DialogHeader>
                        <Form {...inviteForm}>
                          <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                            <FormField
                              control={inviteForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter email address" {...field} data-testid="input-invite-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={inviteForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-invite-role">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="member">Member - Basic access</SelectItem>
                                      <SelectItem value="leader">Leader - Team leadership</SelectItem>
                                      <SelectItem value="admin">Admin - Full management</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={inviteForm.control}
                              name="message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Personal Message (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Add a personal message to the invitation"
                                      {...field} 
                                      data-testid="textarea-invite-message"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end space-x-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsInviteDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={inviteMemberMutation.isPending}
                                data-testid="button-send-invite"
                              >
                                {inviteMemberMutation.isPending ? 'Sending...' : 'Send Invitation'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      View All Teams
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border">
                <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                  <Settings className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Configure your organization preferences</p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full">
                      <Building2 className="mr-2 h-4 w-4" />
                      Edit Organization Details
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}