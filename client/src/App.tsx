import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Subscribe from "@/pages/subscribe";
import Profile from "@/pages/profile";
import Meditation from "@/pages/meditation";
import Organization from "@/pages/organization";
import Settings from "@/pages/settings";
import Assessment from "@/pages/assessment";
import Matrix from "@/pages/matrix";
import Chat from "@/pages/chat";
import DemoLogin from "@/pages/demo-login";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes accessible to everyone */}
      <Route path="/assessment" component={Assessment} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/matrix" component={Matrix} />
      <Route path="/demo-login" component={DemoLogin} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile" component={Profile} />
          <Route path="/meditation" component={Meditation} />
          <Route path="/organization" component={Organization} />
          <Route path="/chat" component={Chat} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
