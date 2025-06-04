import { Settings as SettingsIcon, Shield, Volume2, Smartphone, MapPin, Users, Bell, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export default function Settings() {
  const [voiceActivation, setVoiceActivation] = useState(true);
  const [shakeDetection, setShakeDetection] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [communityAlerts, setCommunityAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      {/* Settings Content */}
      <main className="p-4 pb-24">
        {/* Emergency Settings */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Emergency Settings</h3>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>SOS Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Voice Activation</p>
                  <p className="text-xs text-gray-500">Trigger SOS with "Help me!" command</p>
                </div>
                <Switch 
                  checked={voiceActivation} 
                  onCheckedChange={setVoiceActivation}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Shake Detection</p>
                  <p className="text-xs text-gray-500">Shake phone 3 times to trigger alert</p>
                </div>
                <Switch 
                  checked={shakeDetection} 
                  onCheckedChange={setShakeDetection}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Auto Location Sharing</p>
                  <p className="text-xs text-gray-500">Share live location during emergency</p>
                </div>
                <Switch 
                  checked={locationSharing} 
                  onCheckedChange={setLocationSharing}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Notification Settings */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Notifications</h3>
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Community Alerts</p>
                    <p className="text-xs text-gray-500">Receive nearby safety alerts</p>
                  </div>
                </div>
                <Switch 
                  checked={communityAlerts} 
                  onCheckedChange={setCommunityAlerts}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Sound Alerts</p>
                    <p className="text-xs text-gray-500">Audio notifications for alerts</p>
                  </div>
                </div>
                <Switch 
                  checked={soundAlerts} 
                  onCheckedChange={setSoundAlerts}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h3>
          
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="h-4 w-4 mr-3" />
              Manage Emergency Contacts
            </Button>
            
            <Button variant="ghost" className="w-full justify-start">
              <MapPin className="h-4 w-4 mr-3" />
              Set Safe Zones
            </Button>
            
            <Button variant="ghost" className="w-full justify-start">
              <Smartphone className="h-4 w-4 mr-3" />
              Test Emergency Features
            </Button>
          </div>
        </section>

        {/* App Info */}
        <section className="mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Support</h3>
          
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-3" />
                Help & FAQ
              </Button>
              
              <Separator />
              
              <div className="text-center text-sm text-gray-500">
                <p>Sakhi Suraksha v1.0.0</p>
                <p>Women's Safety App</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Emergency Test */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h4 className="font-medium text-orange-800 mb-2">Test Emergency System</h4>
            <p className="text-sm text-orange-700 mb-3">
              Verify that your emergency contacts receive test alerts
            </p>
            <Button variant="outline" className="border-orange-300 text-orange-700">
              Send Test Alert
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
