import { useState, useEffect } from "react";
import { MapPin, Shield, AlertTriangle, Navigation, RefreshCw, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";
import SafeRouteFinder from "@/components/safe-route-finder";

interface CommunityAlert {
  id: number;
  type: string;
  description: string;
  location: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
  verified: boolean;
}

export default function Map() {
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const { location } = useLocation();
  const { toast } = useToast();

  const demoAlerts: CommunityAlert[] = [
    {
      id: 1,
      type: "suspicious_activity",
      description: "Suspicious individual reported near Metro Station",
      location: "Connaught Place Metro Station",
      time: "2 hours ago",
      severity: 'medium',
      verified: true
    },
    {
      id: 2,
      type: "poor_lighting",
      description: "Street lights not working in this area",
      location: "Khan Market Street",
      time: "5 hours ago",
      severity: 'low',
      verified: false
    },
    {
      id: 3,
      type: "harassment",
      description: "Verbal harassment reported",
      location: "India Gate Area",
      time: "1 day ago",
      severity: 'high',
      verified: true
    }
  ];

  useEffect(() => {
    loadCommunityAlerts();
  }, []);

  const loadCommunityAlerts = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts(demoAlerts);
    } catch (error) {
      toast({
        title: "Error Loading Alerts",
        description: "Could not load community alerts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'suspicious_activity': return <AlertTriangle className="w-4 h-4" />;
      case 'harassment': return <AlertTriangle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const openInGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps/@${location.latitude},${location.longitude},15z`;
      window.open(url, '_blank');
    } else {
      toast({
        title: "Location Required",
        description: "Please enable location services to view map.",
        variant: "destructive",
      });
    }
  };

  const handleRouteFound = (route: any) => {
    setActiveRoute(route);
    toast({
      title: "Safe Route Calculated",
      description: `Route to ${route.destination} with ${route.safetyScore}% safety score`,
    });
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Safety Map & Navigation</h1>
        <p className="text-gray-600">Find safe routes and view community alerts</p>
      </div>

      {/* Safe Route Finder */}
      <SafeRouteFinder onRouteFound={handleRouteFound} />

      {/* Current Location Card */}
      {location && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <MapPin className="w-5 h-5 mr-2" />
              Your Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              <p className="text-sm">
                <strong>Accuracy:</strong> ±{location.accuracy.toFixed(0)} meters
              </p>
              <div className="flex gap-2 mt-3">
                <Button onClick={openInGoogleMaps} className="flex-1">
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
                {activeRoute && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const destination = activeRoute.routePoints[activeRoute.routePoints.length - 1];
                      const url = `https://www.google.com/maps/dir/${location.latitude},${location.longitude}/${destination.lat},${destination.lng}`;
                      window.open(url, "_blank");
                    }}
                    className="flex-1"
                  >
                    <Route className="w-4 h-4 mr-2" />
                    Navigate Route
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Alerts */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Community Safety Alerts
            </CardTitle>
            <Button 
              onClick={loadCommunityAlerts} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(alert.type)}
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.verified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {alert.description}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {alert.location}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const searchQuery = encodeURIComponent(alert.location);
                        window.open(`https://www.google.com/maps/search/${searchQuery}`, "_blank");
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-700">Safety Navigation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-600">
            <li>• Use safe routes with good lighting and police presence</li>
            <li>• Share your live location with trusted contacts during travel</li>
            <li>• Avoid areas with recent safety alerts when possible</li>
            <li>• Trust your instincts and change routes if you feel unsafe</li>
            <li>• Keep emergency numbers easily accessible while traveling</li>
            <li>• Report any incidents to help improve community safety</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
        </section>

        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Nearby Safety Points</h3>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      🚔
                    </div>
                    <div>
                      <p className="font-medium text-sm">Police Station</p>
                      <p className="text-xs text-gray-500">0.5 km away</p>
                    </div>
                  </div>
                  <Badge variant="outline">Safe</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      🏥
                    </div>
                    <div>
                      <p className="font-medium text-sm">Hospital</p>
                      <p className="text-xs text-gray-500">1.2 km away</p>
                    </div>
                  </div>
                  <Badge variant="outline">Safe</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Safe Route Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                Get the safest route to your destination based on real-time data and community reports.
              </p>
              <Button className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Find Safe Route
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
