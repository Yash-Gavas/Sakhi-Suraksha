import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Phone, Users, Clock, Activity } from "lucide-react";
import InteractiveMap from "@/components/interactive-map";

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



  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Safety Map</h1>
        <p className="text-gray-600">Real-time safety information and navigation</p>
      </div>

      {/* Interactive Map */}
      <InteractiveMap />



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

      {/* Nearest Safety Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Nearest Safety Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Real-time nearby safety locations from Google Places API
          </p>
          <div className="text-center text-gray-500 p-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">Loading real nearby safety points...</p>
            <p className="text-xs mt-2">Google Places API requires billing to be enabled</p>
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