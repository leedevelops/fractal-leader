import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Settings, LogOut, User, Waves, Building2, Compass, Home, Bot, LogIn } from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth() as any;
  const [, setLocation] = useLocation();

  const getGenerationLabel = (generation: string | null) => {
    switch (generation) {
      case 'gen_z': return 'Gen Z';
      case 'millennial': return 'Millennial';
      case 'gen_x': return 'Gen X';
      case 'boomer': return 'Boomer';
      default: return 'Unknown';
    }
  };

  const getArchetypeEmoji = (archetype: string | null) => {
    switch (archetype) {
      case 'pioneer': return '🚀';
      case 'organizer': return '🤝';
      case 'builder': return '🔨';
      case 'guardian': return '🛡️';
      default: return '🔮';
    }
  };

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setLocation('/')}>
            <div className="hebrew-letter text-2xl animate-hebrew-glow" style={{filter: 'brightness(1.5) contrast(1.2)'}}>פ</div>
            <div>
              <span className="text-xl font-bold text-primary" style={{filter: 'brightness(1.4)'}}>Fractal Leader</span>
              <span className="text-sm text-muted-foreground ml-2">Biblical Leadership Platform</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {user?.generation && (
              <Badge 
                variant="secondary" 
                className="generation-badge px-3 py-1 rounded-full text-sm bg-accent/20 text-accent-foreground"
                data-testid="badge-generation"
              >
                <Users className="w-4 h-4 mr-2" />
                {getGenerationLabel(user.generation)}
              </Badge>
            )}
            
            {user?.archetype && (
              <div className="text-sm">
                <span className="text-muted-foreground">Archetype:</span>
                <span className="text-cosmic-golden font-medium ml-1" data-testid="text-archetype">
                  {getArchetypeEmoji(user.archetype)} {user.archetype}
                </span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || 'User'} />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/')} data-testid="menu-item-home">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/profile')} data-testid="menu-item-profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/assessment')} data-testid="menu-item-assessment">
                  <Compass className="mr-2 h-4 w-4" />
                  <span>Assessment</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/matrix')} data-testid="menu-item-matrix">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Matrix Map</span>
                </DropdownMenuItem>
                {isAuthenticated && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation('/chat')} data-testid="menu-item-chat">
                      <Bot className="mr-2 h-4 w-4" />
                      <span>AI Coach</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/meditation')} data-testid="menu-item-meditation">
                      <Waves className="mr-2 h-4 w-4" />
                      <span>Meditation</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/organization')} data-testid="menu-item-organization">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>Organization</span>
                    </DropdownMenuItem>
                  </>
                )}
                {isAuthenticated && (
                  <>
                    <DropdownMenuItem onClick={() => setLocation('/settings')} data-testid="menu-item-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        if (user?.isDemo) {
                          // Demo account logout
                          fetch('/api/auth/demo-logout', { method: 'POST' })
                            .then(() => window.location.reload());
                        } else {
                          // Replit auth logout
                          window.location.href = '/api/logout';
                        }
                      }}
                      data-testid="menu-item-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </>
                )}
                {!isAuthenticated && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setLocation('/demo-login')}
                      data-testid="menu-item-demo-login"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Demo Login</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => window.location.href = '/api/login'}
                      data-testid="menu-item-replit-login"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Replit Login</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
