import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/ui/navigation";
import FractalVisualization from "@/components/fractal-visualization";
import DevelopmentProgress from "@/components/development-progress";
import TeamFormation from "@/components/team-formation";
import QuickActions from "@/components/quick-actions";
import ProgressInsights from "@/components/progress-insights";
import SubscriptionTier from "@/components/subscription-tier";
import BiblicalMatrixExplorer from "@/components/sacred-matrix-explorer";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen cosmic-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="hebrew-letter animate-pulse-slow">פ</div>
          <p className="text-muted-foreground">Loading your biblical patterns...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen cosmic-gradient">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Personal Development */}
          <div className="lg:col-span-2 space-y-6">
            <FractalVisualization />
            <BiblicalMatrixExplorer />
            <DevelopmentProgress />
            <TeamFormation />
          </div>

          {/* Right Column: Insights & Actions */}
          <div className="space-y-6">
            <QuickActions />
            <ProgressInsights />
            <SubscriptionTier />
          </div>
        </div>
      </div>
    </div>
  );
}
