import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Map from "@/pages/map";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import BottomNavigation from "@/components/bottom-navigation";
import VoiceIndicator from "@/components/voice-indicator";
import FakeCallOverlay from "@/components/fake-call-overlay";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="max-w-mobile mx-auto bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen relative">
      <Switch>
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/map" component={Map} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && (
        <>
          <BottomNavigation />
          <VoiceIndicator />
          <FakeCallOverlay />
        </>
      )}
    </div>
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
