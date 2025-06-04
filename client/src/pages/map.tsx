import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Phone, Users, Clock, Activity } from "lucide-react";

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

  const communityAlerts: CommunityAlert[] = [
    {
      id: 1,
      type: "Safety Alert",
      description: "Poor lighting reported in this area",
      location: "MG Road Metro Station",
      time: "2 hours ago",
      severity: "medium",
      verified: true
    },
    {
      id: 2,
      type: "Emergency",
      description: "Suspicious activity reported",
      location: "Brigade Road Junction",
      time: "45 minutes ago",
      severity: "high",
      verified: false
    },
    {
      id: 3,
      type: "Safe Zone",
      description: "Well-lit area with security cameras",
      location: "Commercial Street",
      time: "1 hour ago",
      severity: "low",
      verified: true
    }
  ];

  const safetyPoints = [
    { name: "Police Station", distance: "0.3 km", type: "emergency" },
    { name: "Hospital", distance: "0.8 km", type: "medical" },
    { name: "Metro Station", distance: "0.5 km", type: "transport" },
    { name: "24/7 Store", distance: "0.2 km", type: "safe_zone" }
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Safety Map</h1>
        <p className="text-gray-600">Real-time safety information and navigation</p>
      </div>

      {/* Map Placeholder */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-gray-700">Interactive Safety Map</p>
              <p className="text-sm text-gray-500">Your location and nearby safety points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          className="h-20 flex flex-col space-y-2 bg-gradient-to-r from-blue-500 to-blue-600"
          onClick={() => {}}
        >
          <Navigation className="w-6 h-6" />
          <span className="text-sm">Find Safe Route</span>
        </Button>
        
        <Button 
          className="h-20 flex flex-col space-y-2 bg-gradient-to-r from-green-500 to-green-600"
          onClick={() => {}}
        >
          <Shield className="w-6 h-6" />
          <span className="text-sm">Safe Zones</span>
        </Button>
      </div>

      {/* Community Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Community Alerts
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

      {/* Nearby Safety Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Nearby Safety Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safetyPoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    point.type === 'emergency' ? 'bg-red-100' :
                    point.type === 'medical' ? 'bg-blue-100' :
                    point.type === 'transport' ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {point.type === 'emergency' && <Phone className="w-4 h-4 text-red-600" />}
                    {point.type === 'medical' && <Activity className="w-4 h-4 text-blue-600" />}
                    {point.type === 'transport' && <Navigation className="w-4 h-4 text-green-600" />}
                    {point.type === 'safe_zone' && <Shield className="w-4 h-4 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{point.name}</p>
                    <p className="text-xs text-gray-500">{point.distance}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Navigate
                </Button>
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
      <Card>
        <CardContent className="p-4">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Safety Issue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}