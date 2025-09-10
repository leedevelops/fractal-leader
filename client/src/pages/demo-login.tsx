import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DemoLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const demoAccounts = [
    { 
      username: 'pioneer_demo', 
      name: 'David Pioneer', 
      archetype: 'Pioneer 🚀', 
      generation: 'Millennial', 
      description: 'Forward-thinking leader who breaks new ground',
      stage: 'R2 - Rising Action'
    },
    { 
      username: 'organizer_demo', 
      name: 'Sarah Organizer', 
      archetype: 'Organizer 🤝', 
      generation: 'Gen X', 
      description: 'Collaborative leader who builds strong teams',
      stage: 'R3 - Climax'
    },
    { 
      username: 'builder_demo', 
      name: 'Michael Builder', 
      archetype: 'Builder 🔨', 
      generation: 'Gen Z', 
      description: 'Practical leader who creates lasting structures',
      stage: 'R1 - Beginning'
    },
    { 
      username: 'guardian_demo', 
      name: 'Ruth Guardian', 
      archetype: 'Guardian 🛡️', 
      generation: 'Boomer', 
      description: 'Protective leader who preserves what matters',
      stage: 'R4 - Integration'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/demo-login", { username, password });
      
      // Invalidate auth cache to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Login Successful",
        description: "Welcome to Fractal Leader!",
      });
      
      // Redirect immediately after cache invalidation
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoUsername: string) => {
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/demo-login", { 
        username: demoUsername, 
        password: 'demo123' 
      });
      
      // Invalidate auth cache to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Demo Login Successful",
        description: `Logged in as ${demoUsername}`,
      });
      
      // Redirect immediately after cache invalidation
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Demo login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-cosmic-navy to-cosmic-deep flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="hebrew-letter text-6xl animate-hebrew-glow mb-4">פ</div>
          <h1 className="text-4xl font-bold text-cosmic-silver mb-2">Fractal Leader</h1>
          <p className="text-xl text-cosmic-silver/70">Biblical Leadership Development Platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Manual Login Form */}
          <Card className="bg-cosmic-navy/50 border-cosmic-golden/30">
            <CardHeader>
              <CardTitle className="text-cosmic-golden">Demo Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-cosmic-silver">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter demo username"
                    className="bg-cosmic-deep/50 border-cosmic-golden/20 text-cosmic-silver"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-cosmic-silver">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="demo123"
                    className="bg-cosmic-deep/50 border-cosmic-golden/20 text-cosmic-silver"
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-cosmic-golden text-cosmic-deep hover:bg-cosmic-golden/80"
                  data-testid="button-login"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <div className="mt-4 pt-4 border-t border-cosmic-golden/20">
                <p className="text-sm text-cosmic-silver/60 text-center">
                  All demo accounts use password: <code className="bg-cosmic-deep/50 px-2 py-1 rounded">demo123</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Demo Access */}
          <Card className="bg-cosmic-navy/50 border-cosmic-golden/30">
            <CardHeader>
              <CardTitle className="text-cosmic-golden">Try Different Biblical Archetypes</CardTitle>
              <p className="text-sm text-cosmic-silver/70">Experience the platform from different leadership perspectives</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoAccounts.map((account) => (
                  <div 
                    key={account.username}
                    className="p-4 rounded-lg bg-cosmic-deep/30 border border-cosmic-golden/20 hover:border-cosmic-golden/40 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-cosmic-silver">{account.name}</h3>
                        <p className="text-sm text-cosmic-golden">{account.archetype} • {account.generation}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDemoLogin(account.username)}
                        disabled={isLoading}
                        className="bg-cosmic-golden/20 text-cosmic-golden hover:bg-cosmic-golden/30"
                        data-testid={`button-demo-${account.username}`}
                      >
                        Login as {account.archetype.split(' ')[0]}
                      </Button>
                    </div>
                    <p className="text-xs text-cosmic-silver/60 mb-1">{account.description}</p>
                    <p className="text-xs text-cosmic-ethereal">Development Stage: {account.stage}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="text-cosmic-silver border-cosmic-silver/30 hover:bg-cosmic-silver/10"
            data-testid="button-back-home"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}