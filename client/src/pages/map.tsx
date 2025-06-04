import { MapPin, Shield, AlertTriangle, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Map() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Safety Map</h1>
        </div>
      </header>

      {/* Map Placeholder */}
      <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center relative">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-primary mx-auto mb-2" />
          <p className="text-gray-700 font-medium">Interactive Map</p>
          <p className="text-sm text-gray-500">Real-time safety zones & alerts</p>
        </div>
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button size="sm" className="bg-white text-primary hover:bg-gray-50">
            <Navigation className="h-4 w-4" />
          </Button>
          <Button size="sm" className="bg-white text-primary hover:bg-gray-50">
            📍
          </Button>
        </div>
      </div>

      {/* Map Features */}
      <main className="p-4 pb-24">
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Map Features</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Safe Zones</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Alert Areas</span>
                </div>
              </CardContent>
            </Card>
          </div>
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
