import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Phone, Users, Clock, Activity, Route } from "lucide-react";
import InteractiveMap from "@/components/interactive-map";
import SafeRouteFinder from "@/components/safe-route-finder";
import SafetyIssueReporter from "@/components/safety-issue-reporter";
import { useLocation } from "@/hooks/use-location";

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
  const [selectedAlert, setSelectedAlert] = useState<CommunityAlert | null>(null);
  const { location: userLocation } = useLocation();

  // Fetch real community alerts from the database with minimal polling
  const { data: communityAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/community-alerts"],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const response = await fetch(
        `/api/community-alerts?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=10000`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch community alerts');
      }
      
      const alerts = await response.json();
      
      // Transform database alerts to match interface
      return alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.type || 'Safety Alert',
        description: alert.description,
        location: `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`,
        time: new Date(alert.createdAt).toLocaleString(),
        severity: alert.severity,
        verified: alert.verified
      }));
    },
    enabled: !!userLocation,
    staleTime: 300000, // 5 minutes before data is considered stale
    refetchInterval: false, // Disable automatic refetching
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount
  });



  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Safety Map</h1>
        <p className="text-gray-600">Real-time safety information and navigation</p>
      </div>

      {/* Interactive Map */}
      <InteractiveMap />

      {/* Safe Route Finder */}
      <SafeRouteFinder />

      {/* Community Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Community Alerts
            </div>
            <SafetyIssueReporter />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {communityAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge 
                        variant={alert.severity === 'high' ? 'destructive' : 
                                alert.severity === 'medium' ? 'default' : 'secondary'}
                      >
                        {alert.type}
                      </Badge>
                      {alert.verified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{alert.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {alert.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {alert.time}
                      </span>
                    </div>
                  </div>
                  <AlertTriangle 
                    className={`w-5 h-5 ${
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col space-y-1"
              onClick={() => window.location.href = "tel:100"}
            >
              <Phone className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium">Police</span>
              <span className="text-xs text-gray-500">100</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex flex-col space-y-1"
              onClick={() => window.location.href = "tel:1091"}
            >
              <Phone className="w-4 h-4 text-pink-600" />
              <span className="text-xs font-medium">Women Help</span>
              <span className="text-xs text-gray-500">1091</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 flex flex-col space-y-1"
              onClick={() => window.location.href = "tel:108"}
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium">Medical</span>
              <span className="text-xs text-gray-500">108</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Safety Issue */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Report Safety Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">
            Help keep your community safe by reporting safety concerns
          </p>
          <SafetyIssueReporter />
        </CardContent>
      </Card>
    </div>
  );
}