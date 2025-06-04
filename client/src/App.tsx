import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Map from "@/pages/map";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import BottomNavigation from "@/components/bottom-navigation";
import VoiceIndicator from "@/components/voice-indicator";
import FakeCallOverlay from "@/components/fake-call-overlay";

function Router() {
  return (
    <div className="max-w-mobile mx-auto bg-white min-h-screen relative">
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/map" component={Map} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      
      <BottomNavigation />
      <VoiceIndicator />
      <FakeCallOverlay />
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
