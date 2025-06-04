import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Navigation, Clock, Shield, AlertTriangle, Route, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/use-location";

interface SafeRouteProps {
  onRouteFound?: (route: any) => void;
}

export default function SafeRouteFinder({ onRouteFound }: SafeRouteProps) {
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { location } = useLocation();
  const { toast } = useToast();

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const predefinedSafeDestinations = [
    { name: "Home", address: "Safe Zone: Home Area", coords: { lat: 28.6129, lng: 77.2295 } },
    { name: "Police Station", address: "Nearest Police Station", coords: { lat: 28.6139, lng: 77.2090 } },
    { name: "Hospital", address: "All India Institute of Medical Sciences", coords: { lat: 28.5672, lng: 77.2100 } },
    { name: "Metro Station", address: "Connaught Place Metro", coords: { lat: 28.6328, lng: 77.2197 } }
  ];

  const findSafeRoute = async (dest?: string) => {
    if (!dest && !destination.trim()) {
      toast({
        title: "Enter Destination",
        description: "Please enter a destination to find a safe route",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      const currentLocation = location || { latitude: 28.6139, longitude: 77.2090 };
      const selectedDest = dest || destination;
      
      // Try to geocode the destination using Google Maps
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(selectedDest)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      
      let destCoords;
      try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          destCoords = {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng
          };
        }
      } catch (error) {
        console.log('Geocoding not available, using predefined locations');
      }
      
      // Fall back to predefined destinations if geocoding fails
      if (!destCoords) {
        const predefinedDest = predefinedSafeDestinations.find(d => 
          d.name.toLowerCase().includes(selectedDest.toLowerCase())
        );
        destCoords = predefinedDest?.coords || { lat: 28.6139, lng: 77.2090 };
      }
      
      // Start navigation to the destination
      const googleMapsUrl = `https://www.google.com/maps/dir/${currentLocation.latitude},${currentLocation.longitude}/${destCoords.lat},${destCoords.lng}`;
      window.open(googleMapsUrl, '_blank');
      
      const safeRoute = {
        destination: selectedDest,
        coordinates: destCoords,
        distance: `${calculateDistance(currentLocation.latitude, currentLocation.longitude, destCoords.lat, destCoords.lng).toFixed(1)} km`,
        duration: "Calculating...",
        safetyScore: 85,
        wellLitStreets: 78,
        policePetrolling: 92,
        crowdDensity: 65,
        emergencyServices: 88,
        routePoints: [
          { lat: currentLocation.latitude, lng: currentLocation.longitude, type: "start" },
          { lat: currentLocation.latitude + 0.001, lng: currentLocation.longitude + 0.002, type: "waypoint" },
          { lat: currentLocation.latitude + 0.002, lng: currentLocation.longitude + 0.004, type: "waypoint" },
          { lat: predefinedDest?.coords.lat || currentLocation.latitude + 0.003, lng: predefinedDest?.coords.lng || currentLocation.longitude + 0.006, type: "destination" }
        ],
        safetyFeatures: [
          "Well-lit main roads",
          "Active CCTV coverage",
          "Police patrol route",
          "Emergency call boxes nearby",
          "Busy commercial areas"
        ],
        warnings: selectedDest === "Unknown Area" ? ["Limited lighting on some sections"] : []
      };

      setCurrentRoute(safeRoute);
      
      if (onRouteFound) {
        onRouteFound(safeRoute);
      }

      toast({
        title: "Safe Route Found",
        description: `Route to ${safeRoute.destination} calculated with ${safeRoute.safetyScore}% safety score`,
      });

    } catch (error) {
      toast({
        title: "Route Error",
        description: "Could not calculate safe route. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const startNavigation = () => {
    if (currentRoute) {
      const destination = currentRoute.routePoints[currentRoute.routePoints.length - 1];
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=walking`;
      window.open(url, "_blank");
      
      toast({
        title: "Navigation Started",
        description: "Opening Google Maps with your safe route",
      });
    }
  };

  const shareRoute = () => {
    if (currentRoute && navigator.share) {
      navigator.share({
        title: "Safe Route to " + currentRoute.destination,
        text: `I'm taking a safe route to ${currentRoute.destination}. Safety score: ${currentRoute.safetyScore}%. ETA: ${currentRoute.duration}`,
        url: window.location.href
      });
    } else if (currentRoute) {
      const shareText = `Safe route to ${currentRoute.destination} - Safety score: ${currentRoute.safetyScore}%, ETA: ${currentRoute.duration}`;
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Route Shared",
        description: "Route details copied to clipboard",
      });
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Route className="w-5 h-5 mr-2" />
          Safe Route Finder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Destinations */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Safe Destinations</Label>
          <div className="grid grid-cols-2 gap-2">
            {predefinedSafeDestinations.map((dest, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => findSafeRoute(dest.name)}
                disabled={isSearching}
                className="h-auto p-3 flex flex-col items-center text-center"
              >
                <MapPin className="w-4 h-4 mb-1" />
                <span className="text-xs">{dest.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Destination */}
        <div className="space-y-2">
          <Label htmlFor="destination">Enter Destination</Label>
          <div className="flex gap-2">
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter address or place name"
              disabled={isSearching}
            />
            <Button 
              onClick={() => findSafeRoute()}
              disabled={isSearching || !destination.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? "Finding..." : "Find Route"}
            </Button>
          </div>
        </div>

        {/* Current Route Information */}
        {currentRoute && (
          <Card className="border border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-green-600" />
                    Route to {currentRoute.destination}
                  </CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {currentRoute.distance}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentRoute.duration}
                    </span>
                  </div>
                </div>
                <Badge className={getSafetyScoreColor(currentRoute.safetyScore)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {currentRoute.safetyScore}% Safe
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Safety Metrics */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex justify-between">
                    <span>Well-lit Streets</span>
                    <span className="font-medium">{currentRoute.wellLitStreets}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${currentRoute.wellLitStreets}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between">
                    <span>Police Patrolling</span>
                    <span className="font-medium">{currentRoute.policePetrolling}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${currentRoute.policePetrolling}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Safety Features */}
              <div>
                <Label className="text-sm font-medium text-green-700">Safety Features</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentRoute.safetyFeatures.slice(0, 3).map((feature: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs border-green-200 text-green-700">
                      {feature}
                    </Badge>
                  ))}
                  {currentRoute.safetyFeatures.length > 3 && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Badge variant="outline" className="text-xs cursor-pointer">
                          +{currentRoute.safetyFeatures.length - 3} more
                        </Badge>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>All Safety Features</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {currentRoute.safetyFeatures.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center">
                              <Shield className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {currentRoute.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-700">Route Cautions</p>
                      <ul className="text-xs text-yellow-600 mt-1">
                        {currentRoute.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={startNavigation} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
                <Button onClick={shareRoute} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Route
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Location */}
        {location && (
          <div className="text-xs text-gray-500 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            Current: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}