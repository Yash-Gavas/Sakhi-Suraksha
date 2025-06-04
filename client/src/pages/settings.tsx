import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, Phone, Save, Palette, Moon, Sun, LogOut, Mic, Camera, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [voiceActivation, setVoiceActivation] = useState(true);
  const [autoLiveStream, setAutoLiveStream] = useState(true);
  const [emergencyMessage, setEmergencyMessage] = useState(
    "🚨 EMERGENCY ALERT 🚨\nI need immediate help! This is an automated SOS from Sakhi Suraksha app.\n\nLocation: [LIVE_LOCATION]\nTime: [TIMESTAMP]\nLive Stream: [STREAM_LINK]\n\nPlease contact me immediately or call emergency services."
  );
  const [firstName, setFirstName] = useState("Demo");
  const [lastName, setLastName] = useState("User");
  const [email, setEmail] = useState("demo@sakhisuraksha.com");
  const [phoneNumber, setPhoneNumber] = useState("+919876543210");
  
  const { toast } = useToast();
  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your safety preferences have been updated successfully",
    });
  };

  const applyTheme = (selectedTheme: string) => {
    setTheme(selectedTheme);
    const root = document.documentElement;
    
    if (selectedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    switch (selectedTheme) {
      case "dark":
        root.style.setProperty("--background", "222.2 84% 4.9%");
        root.style.setProperty("--foreground", "210 40% 98%");
        break;
      case "pink":
        root.style.setProperty("--background", "330 100% 98%");
        root.style.setProperty("--foreground", "330 30% 10%");
        break;
      case "purple":
        root.style.setProperty("--background", "270 100% 98%");
        root.style.setProperty("--foreground", "270 30% 10%");
        break;
      default:
        root.style.setProperty("--background", "0 0% 100%");
        root.style.setProperty("--foreground", "222.2 84% 4.9%");
    }
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${selectedTheme} theme`,
    });
  };

  const testVoiceRecognition = () => {
    if (isListening) {
      stopListening();
      toast({
        title: "Voice Recognition Stopped",
        description: "Voice monitoring has been disabled",
      });
    } else {
      startListening();
      toast({
        title: "Voice Recognition Started",
        description: "Say 'help me' or 'emergency' to test voice SOS",
      });
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your safety preferences and profile</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-2xl">
                {firstName[0]}{lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-xl">{firstName} {lastName}</CardTitle>
          <CardDescription>{email}</CardDescription>
          <Badge className="bg-green-100 text-green-700 mx-auto mt-2">
            Safety Profile Active
          </Badge>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and emergency details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="emergency-message">Emergency Message Template</Label>
            <Textarea
              id="emergency-message"
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              placeholder="Custom message sent during emergencies"
              rows={5}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use [LIVE_LOCATION], [TIMESTAMP], and [STREAM_LINK] for dynamic content
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the app's look and feel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">App Theme</Label>
            <Select value={theme} onValueChange={applyTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="pink">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-pink-500 rounded"></div>
                    Pink
                  </div>
                </SelectItem>
                <SelectItem value="purple">
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 bg-purple-500 rounded"></div>
                    Purple
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Safety Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Safety Features
          </CardTitle>
          <CardDescription>
            Configure emergency response and safety features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="voice-activation">Voice SOS Activation</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activate SOS by saying "help me" or "emergency"
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="voice-activation"
                checked={voiceActivation}
                onCheckedChange={setVoiceActivation}
              />
              {isSupported && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testVoiceRecognition}
                  className={isListening ? "bg-red-50 text-red-600" : ""}
                >
                  <Mic className="w-3 h-3 mr-1" />
                  {isListening ? "Stop Test" : "Test Voice"}
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-livestream">Auto Live Streaming</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically start live streaming during emergencies
              </p>
            </div>
            <Switch
              id="auto-livestream"
              checked={autoLiveStream}
              onCheckedChange={setAutoLiveStream}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="location-sharing">Live Location Sharing</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share real-time location during emergencies
              </p>
            </div>
            <Switch
              id="location-sharing"
              checked={locationSharing}
              onCheckedChange={setLocationSharing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive emergency and safety alerts
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sound-alerts">Sound Alerts</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Play sound for emergency notifications
              </p>
            </div>
            <Switch
              id="sound-alerts"
              checked={soundAlerts}
              onCheckedChange={setSoundAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Emergency Services
          </CardTitle>
          <CardDescription>
            Quick access to emergency helplines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col hover:bg-red-50"
              onClick={() => window.location.href = "tel:100"}
            >
              <span className="font-bold text-lg text-red-600">100</span>
              <span className="text-xs">Police</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col hover:bg-pink-50"
              onClick={() => window.location.href = "tel:1091"}
            >
              <span className="font-bold text-lg text-pink-600">1091</span>
              <span className="text-xs">Women's Helpline</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col hover:bg-blue-50"
              onClick={() => window.location.href = "tel:108"}
            >
              <span className="font-bold text-lg text-blue-600">108</span>
              <span className="text-xs">Medical Emergency</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Voice Recognition Status */}
      {isSupported && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <div>
                  <p className="font-medium">Voice Recognition Status</p>
                  <p className="text-sm text-gray-600">
                    {isListening ? "Listening for emergency commands..." : "Voice monitoring inactive"}
                  </p>
                </div>
              </div>
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={handleSave} 
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600"
        >
          <Save className="w-4 h-4 mr-2" />
          Save All Settings
        </Button>
        
        <Button 
          onClick={() => window.location.href = "/auth"}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Authentication Settings
        </Button>
      </div>
    </div>
  );
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
