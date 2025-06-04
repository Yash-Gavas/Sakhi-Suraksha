import { Shield, Signal, User, CheckCircle, Mic, PhoneCall, MapPin, Users, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmergencyButton from "@/components/emergency-button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/hooks/use-location";
import { useMemo } from "react";
import { Link } from "wouter";
import type { EmergencyContact, CommunityAlert } from "@shared/schema";

export default function Home() {
  const { location, isLocationSharingActive } = useLocation();
  
  const { data: emergencyContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"]
  });

  const { data: communityAlerts = [] } = useQuery<CommunityAlert[]>({
    queryKey: ["/api/community-alerts"],
    queryFn: async () => {
      if (!location) return [];
      const response = await fetch(`/api/community-alerts?lat=${location.latitude}&lng=${location.longitude}&radius=5000`);
      return response.json();
    },
    enabled: !!location
  });

  const activeContacts = emergencyContacts.filter(contact => contact.isActive);
  const recentCommunityAlert = useMemo(() => 
    communityAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    [communityAlerts]
  );

  const handleVoiceSOS = () => {
    // Voice SOS functionality will be handled by the VoiceIndicator component
    window.dispatchEvent(new CustomEvent('startVoiceRecognition'));
  };

  const handleShakeAlert = () => {
    // Shake detection functionality
    window.dispatchEvent(new CustomEvent('startShakeDetection'));
  };

  const handleFakeCall = () => {
    // Fake call functionality
    window.dispatchEvent(new CustomEvent('startFakeCall'));
  };

  const handleShareLocation = () => {
    if (location) {
      const shareText = `My current location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      if (navigator.share) {
        navigator.share({
          title: 'My Location - Sakhi Suraksha',
          text: shareText
        });
      } else {
        navigator.clipboard.writeText(shareText);
      }
    }
  };

  const callHelpline = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Sakhi Suraksha</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Signal className="h-4 w-4 text-green-300" />
            <User className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className={`px-4 py-2 text-center text-sm font-medium text-white ${
        isLocationSharingActive ? 'bg-orange-500' : 'bg-safe'
      }`}>
        <CheckCircle className="inline h-4 w-4 mr-1" />
        {isLocationSharingActive 
          ? `Live location sharing active • Emergency mode`
          : `You're in a Safe Zone • ${activeContacts.length} trusted contacts active`
        }
      </div>

      {/* Main Content */}
      <main className="p-4 pb-24">
        {/* Emergency Actions Section */}
        <section className="mb-6">
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Emergency Actions</h2>
              
              {/* Primary SOS Button */}
              <div className="flex justify-center mb-6">
                <EmergencyButton />
              </div>

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="ghost"
                  className="bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl p-4 h-auto flex-col space-y-2"
                  onClick={handleVoiceSOS}
                >
                  <Mic className="h-6 w-6 text-orange-600" />
                  <span className="text-xs font-medium">Voice SOS</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl p-4 h-auto flex-col space-y-2"
                  onClick={handleShakeAlert}
                >
                  <div className="h-6 w-6 text-blue-600 flex items-center justify-center">📳</div>
                  <span className="text-xs font-medium">Shake Alert</span>
                </Button>
                
                <Button
                  variant="ghost"
                  className="bg-green-100 hover:bg-green-200 text-green-700 rounded-xl p-4 h-auto flex-col space-y-2"
                  onClick={handleFakeCall}
                >
                  <PhoneCall className="h-6 w-6 text-green-600" />
                  <span className="text-xs font-medium">Fake Call</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Access Section */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-gray-100 hover:bg-gray-50 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium text-gray-800 text-sm">Contacts</div>
                    <div className="text-xs text-gray-500">{activeContacts.length} active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={handleShareLocation}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-safe" />
                  <div className="text-left">
                    <div className="font-medium text-gray-800 text-sm">Location</div>
                    <div className="text-xs text-gray-500">Share Live</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Safety Status Section */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Safety Status</h3>
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-safe" />
                  <span className="font-medium text-gray-800 text-sm">Current Location</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Safe Zone</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}
              </p>
              
              {/* Mini Map Placeholder */}
              <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center mb-3">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
              >
                View Full Map & Safe Routes
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Emergency Helplines Section */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Emergency Helplines</h3>
          <div className="space-y-2">
            <Card className="border-gray-100 hover:bg-red-50 cursor-pointer" onClick={() => callHelpline('100')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      🚔
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800 text-sm">Police Emergency</div>
                      <div className="text-xs text-gray-500">Available 24/7</div>
                    </div>
                  </div>
                  <div className="font-bold text-danger">100</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:bg-red-50 cursor-pointer" onClick={() => callHelpline('1091')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      🆘
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800 text-sm">Women's Helpline</div>
                      <div className="text-xs text-gray-500">24x7 support</div>
                    </div>
                  </div>
                  <div className="font-bold text-danger">1091</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-100 hover:bg-red-50 cursor-pointer" onClick={() => callHelpline('108')}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      🚑
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-800 text-sm">Medical Emergency</div>
                      <div className="text-xs text-gray-500">Ambulance service</div>
                    </div>
                  </div>
                  <div className="font-bold text-danger">108</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Community Alerts Section */}
        {recentCommunityAlert && (
          <section className="mb-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 text-sm mb-1">Community Alert</h4>
                    <p className="text-yellow-700 text-sm mb-2">
                      {recentCommunityAlert.description}
                    </p>
                    <Button variant="ghost" className="text-yellow-800 font-medium text-sm p-0 h-auto">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
