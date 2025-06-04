import { Shield, CheckCircle, Clock, User, Signal, MapPin, PhoneCall, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmergencyButton from "@/components/emergency-button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@/hooks/use-location";
import { useMemo } from "react";
import { Link } from "wouter";
import type { EmergencyContact, HomeLocation } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { location, isLocationSharingActive } = useLocation();
  
  const { data: emergencyContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"]
  });

  const { data: homeLocation } = useQuery<HomeLocation>({
    queryKey: ["/api/user/home-location"]
  });

  const lastUpdated = useMemo(() => {
    if (homeLocation?.updatedAt) {
      return formatDistanceToNow(homeLocation.updatedAt || new Date());
    }
    return "2 minutes";
  }, [homeLocation?.updatedAt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      {/* Header with Shield Icon */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sakhi Suraksha</h1>
        <p className="text-gray-600 text-lg">Your safety companion</p>
        
        {/* All Systems Active Badge */}
        <div className="flex items-center mt-4 px-4 py-2 bg-green-100 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-green-700 font-medium">All Systems Active</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 max-w-lg mx-auto">
        {/* Safety Status Card */}
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Safety Status</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Location Status</span>
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  Safe Zone: Home
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Emergency Contacts</span>
                <span className="text-gray-600 font-medium">{emergencyContacts.length} contacts</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Voice Activation</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">Active</Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mt-4">
                <Clock className="w-4 h-4 mr-2" />
                <span>Last updated {lastUpdated} ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency SOS Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-red-600 mb-6">Emergency SOS</h2>
          <div className="flex justify-center">
            <EmergencyButton />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 mb-8">
          <Link href="/map">
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3">
              View Full Map & Safe Routes
            </Button>
          </Link>
          
          <Link href="/contacts">
            <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50 py-3">
              Manage Emergency Contacts
            </Button>
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/profile-setup">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-purple-200 hover:bg-purple-50">
              <User className="w-6 h-6 text-purple-600" />
              <span className="text-sm text-purple-600">Profile</span>
            </Button>
          </Link>
          
          <Link href="/iot-devices">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-purple-200 hover:bg-purple-50">
              <Signal className="w-6 h-6 text-purple-600" />
              <span className="text-sm text-purple-600">IoT Devices</span>
            </Button>
          </Link>
          
          <Link href="/destinations">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-purple-200 hover:bg-purple-50">
              <MapPin className="w-6 h-6 text-purple-600" />
              <span className="text-sm text-purple-600">Destinations</span>
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2 border-purple-200 hover:bg-purple-50"
            onClick={() => window.open('/fake-call', '_blank')}
          >
            <PhoneCall className="w-6 h-6 text-purple-600" />
            <span className="text-sm text-purple-600">Fake Call</span>
          </Button>
        </div>

        {/* Emergency Contacts Quick View */}
        {emergencyContacts.length > 0 && (
          <Card className="mb-8 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Quick Contacts</h3>
                <Link href="/contacts">
                  <Button variant="ghost" size="sm" className="text-purple-600">
                    View All
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                {emergencyContacts.slice(0, 3).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-800">{contact.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-600"
                      onClick={() => window.open(`tel:${contact.phoneNumber}`, '_self')}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* App Information */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About Sakhi Suraksha</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-start space-x-2">
                <span className="text-purple-600 font-medium">•</span>
                <span>AI-powered women's safety app with real-time protection</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="text-purple-600 font-medium">•</span>
                <span>Voice activation for hands-free emergency alerts</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="text-purple-600 font-medium">•</span>
                <span>Smart route planning with safety zone detection</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="text-purple-600 font-medium">•</span>
                <span>IoT device integration for health monitoring</span>
              </p>
              <p className="flex items-start space-x-2">
                <span className="text-purple-600 font-medium">•</span>
                <span>Community safety alerts and real-time notifications</span>
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                Your safety is our priority. Stay connected, stay safe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}