import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Shield, AlertTriangle, Target, Route, Phone, Activity } from "lucide-react";
import { useLocation } from "@/hooks/use-location";
import { useToast } from "@/hooks/use-toast";

interface SafetyPoint {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'safe_zone' | 'transport';
  lat: number;
  lng: number;
  distance?: number;
}

interface CommunityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  lat: number;
  lng: number;
  description: string;
  time: string;
}

export default function InteractiveMap() {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SafetyPoint | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [nearestPoints, setNearestPoints] = useState<SafetyPoint[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const [safetyPoints, setSafetyPoints] = useState<SafetyPoint[]>([]);

  const fetchNearbyPlaces = async (userLat: number, userLng: number): Promise<SafetyPoint[]> => {
    const points: SafetyPoint[] = [];
    
    const placeTypes = [
      { type: 'police' as const, query: 'police station' },
      { type: 'hospital' as const, query: 'hospital' },
      { type: 'transport' as const, query: 'metro station' },
      { type: 'safe_zone' as const, query: 'shopping mall' }
    ];

    try {
      for (const placeType of placeTypes) {
        const response = await fetch(`/api/places/nearby?lat=${userLat}&lng=${userLng}&type=${placeType.query}&radius=5000`);
        
        if (response.ok) {
          const data = await response.json();
          const places = data.results || [];
          
          places.slice(0, 3).forEach((place: any, index: number) => {
            const distance = calculateDistance(userLat, userLng, place.geometry.location.lat, place.geometry.location.lng);
            
            points.push({
              id: `${placeType.type}-${index}`,
              name: place.name,
              type: placeType.type,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              distance: distance
            });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      toast({
        title: "Places API Error",
        description: "Unable to fetch real nearby places. Using fallback data.",
        variant: "destructive",
      });
      
      // Fallback to basic nearby points if API fails
      return generateFallbackPoints(userLat, userLng);
    }

    return points.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const generateFallbackPoints = (userLat: number, userLng: number): SafetyPoint[] => {
    const points: SafetyPoint[] = [];
    const fallbackPoints = [
      { name: 'Nearest Police Station', type: 'police' as const, distance: 0.8 },
      { name: 'Emergency Hospital', type: 'hospital' as const, distance: 1.2 },
      { name: 'Public Transport Hub', type: 'transport' as const, distance: 0.5 },
      { name: 'Safe Public Area', type: 'safe_zone' as const, distance: 0.3 }
    ];

    fallbackPoints.forEach((point, index) => {
      const angle = (index * Math.PI / 2);
      const distanceDeg = point.distance / 111;
      const offsetLat = distanceDeg * Math.cos(angle);
      const offsetLng = distanceDeg * Math.sin(angle);
      
      points.push({
        id: `fallback-${index}`,
        name: point.name,
        type: point.type,
        lat: userLat + offsetLat,
        lng: userLng + offsetLng,
        distance: point.distance
      });
    });

    return points;
  };

  const communityAlerts: CommunityAlert[] = [
    {
      id: '1',
      type: 'Safety Alert',
      severity: 'medium',
      lat: 12.9705,
      lng: 77.5935,
      description: 'Poor lighting reported',
      time: '2 hours ago'
    },
    {
      id: '2',
      type: 'Emergency',
      severity: 'high',
      lat: 12.9730,
      lng: 77.5960,
      description: 'Suspicious activity',
      time: '45 minutes ago'
    }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      toast({
        title: "Requesting Location",
        description: "Please allow location access for accurate positioning",
      });
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Fetch real nearby places using Google Places API
          const realNearbyPlaces = await fetchNearbyPlaces(latitude, longitude);
          setSafetyPoints(realNearbyPlaces);
          
          // Get 4 nearest points (already sorted by distance from API)
          setNearestPoints(realNearbyPlaces.slice(0, 4));
          
          toast({
            title: "Location Found",
            description: `Accuracy: ${Math.round(accuracy)}m. Found ${realNearbyPlaces.length} nearby safety points`,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = "Location access denied";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Please enable location permissions in your browser settings";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Use default location and fetch real places for demo
          const defaultLat = 12.9716;
          const defaultLng = 77.5946;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          
          // Fetch real nearby places for default location
          fetchNearbyPlaces(defaultLat, defaultLng).then(realNearbyPlaces => {
            setSafetyPoints(realNearbyPlaces);
            setNearestPoints(realNearbyPlaces.slice(0, 4));
          }).catch(error => {
            console.error('Error fetching places for default location:', error);
            // Only use fallback if API completely fails
            const fallbackPoints = generateFallbackPoints(defaultLat, defaultLng);
            setSafetyPoints(fallbackPoints);
            setNearestPoints(fallbackPoints.slice(0, 4));
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      (async () => {
        toast({
          title: "Geolocation Not Supported",
          description: "Your browser doesn't support location services. Using Bangalore as demo location.",
          variant: "destructive",
        });
        
        const demoLat = 12.9716;
        const demoLng = 77.5946;
        setUserLocation({ lat: demoLat, lng: demoLng });
        
        // Fetch real nearby places for demo location
        fetchNearbyPlaces(demoLat, demoLng).then(realNearbyPlaces => {
          setSafetyPoints(realNearbyPlaces);
          setNearestPoints(realNearbyPlaces.slice(0, 4));
        }).catch(error => {
          console.error('Error fetching places for demo location:', error);
          const fallbackPoints = generateFallbackPoints(demoLat, demoLng);
          setSafetyPoints(fallbackPoints);
          setNearestPoints(fallbackPoints.slice(0, 4));
        });
      })();
    }
  };

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

  const getPointIcon = (type: string) => {
    switch (type) {
      case 'police': return '🚓';
      case 'hospital': return '🏥';
      case 'transport': return '🚇';
      case 'safe_zone': return '🛡️';
      default: return '📍';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '📍';
    }
  };

  const startNavigation = (point: SafetyPoint) => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location services to navigate",
        variant: "destructive",
      });
      return;
    }

    setSelectedPoint(point);
    setShowRoute(true);
    
    // Open Google Maps for navigation
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${point.lat},${point.lng}`;
    window.open(url, '_blank');
    
    toast({
      title: "Navigation Started",
      description: `Navigating to ${point.name}`,
    });
  };

  const mapStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  return (
    <div className="space-y-4">
      {/* Interactive Map */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="h-80 rounded-lg relative"
            style={mapStyle}
          >
            {/* Map Grid Overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="text-white">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* User Location */}
            {userLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse">
                  <div className="w-full h-full bg-blue-600 rounded-full animate-ping"></div>
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  You are here
                </div>
              </div>
            )}

            {/* Safety Points */}
            {safetyPoints.map((point, index) => (
              <div
                key={point.id}
                className="absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                style={{
                  top: `${30 + (index * 15)}%`,
                  left: `${25 + (index * 20)}%`
                }}
                onClick={() => setSelectedPoint(point)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white ${
                  point.type === 'police' ? 'bg-red-500' :
                  point.type === 'hospital' ? 'bg-blue-500' :
                  point.type === 'transport' ? 'bg-green-500' : 'bg-yellow-500'
                }`}>
                  {getPointIcon(point.type)}
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  {point.name}
                </div>
              </div>
            ))}

            {/* Community Alerts */}
            {communityAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className="absolute z-15 transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
                style={{
                  top: `${60 + (index * 10)}%`,
                  left: `${70 - (index * 15)}%`
                }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shadow-lg border-2 border-white ${
                  alert.severity === 'high' ? 'bg-red-600' :
                  alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                  {getAlertIcon(alert.severity)}
                </div>
              </div>
            ))}

            {/* Route Line */}
            {showRoute && selectedPoint && userLocation && (
              <svg className="absolute inset-0 w-full h-full z-5">
                <line
                  x1="50%"
                  y1="50%"
                  x2={`${25 + (safetyPoints.findIndex(p => p.id === selectedPoint.id) * 20)}%`}
                  y2={`${30 + (safetyPoints.findIndex(p => p.id === selectedPoint.id) * 15)}%`}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              </svg>
            )}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button
                size="sm"
                onClick={getCurrentLocation}
                className="bg-white text-gray-700 hover:bg-gray-100"
              >
                <Target className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowRoute(!showRoute)}
                className="bg-white text-gray-700 hover:bg-gray-100"
              >
                <Route className="w-4 h-4" />
              </Button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs">
              <div className="font-semibold mb-2">Legend</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Your Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Emergency Services</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Safe Zones</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Point Details */}
      {selectedPoint && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedPoint.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{selectedPoint.type.replace('_', ' ')}</p>
                {userLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    Distance: {calculateDistance(
                      userLocation.lat, userLocation.lng,
                      selectedPoint.lat, selectedPoint.lng
                    ).toFixed(1)} km
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  onClick={() => startNavigation(selectedPoint)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Navigate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPoint(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Nearest Safety Points */}
      {nearestPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Nearest Safety Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nearestPoints.map((point) => (
                <div key={point.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      point.type === 'police' ? 'bg-red-100' :
                      point.type === 'hospital' ? 'bg-blue-100' :
                      point.type === 'transport' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {point.type === 'police' && <Phone className="w-4 h-4 text-red-600" />}
                      {point.type === 'hospital' && <Activity className="w-4 h-4 text-blue-600" />}
                      {point.type === 'transport' && <Navigation className="w-4 h-4 text-green-600" />}
                      {point.type === 'safe_zone' && <Shield className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{point.name}</p>
                      <p className="text-xs text-gray-500">
                        {point.distance ? `${point.distance.toFixed(1)} km away` : 'Calculating distance...'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startNavigation(point)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Navigate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safe Route Finder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="w-5 h-5 mr-2" />
            Safe Route Finder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-16 flex flex-col space-y-1 bg-gradient-to-r from-green-500 to-green-600"
              onClick={() => {
                const nearestPolice = safetyPoints.find(p => p.type === 'police');
                if (nearestPolice && userLocation) {
                  const mapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${nearestPolice.lat},${nearestPolice.lng}`;
                  window.open(mapsUrl, '_blank');
                  toast({
                    title: "Safe Route to Police",
                    description: "Opening directions in Google Maps",
                  });
                } else {
                  toast({
                    title: "Location Required",
                    description: "Please enable location access for navigation",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm">Route to Police</span>
            </Button>
            
            <Button 
              className="h-16 flex flex-col space-y-1 bg-gradient-to-r from-blue-500 to-blue-600"
              onClick={() => {
                const nearestHospital = safetyPoints.find(p => p.type === 'hospital');
                if (nearestHospital && userLocation) {
                  const mapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${nearestHospital.lat},${nearestHospital.lng}`;
                  window.open(mapsUrl, '_blank');
                  toast({
                    title: "Safe Route to Hospital",
                    description: "Opening directions in Google Maps",
                  });
                } else {
                  toast({
                    title: "Location Required",
                    description: "Please enable location access for navigation",
                    variant: "destructive",
                  });
                }
              }}
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Route to Hospital</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}