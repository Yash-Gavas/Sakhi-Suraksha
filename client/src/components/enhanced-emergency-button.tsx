import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Camera, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LiveStreaming from "./live-streaming";

interface EmergencyAlert {
  triggerType: string;
  scenario: string;
  location: { lat: number; lng: number; address: string };
  timestamp: Date;
  streamUrl?: string;
}

export default function EnhancedEmergencyButton() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [emergencyActive, setEmergencyActive] = useState(false);
  
  const { toast } = useToast();
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const demoEmergencyContacts = [
    { name: "Mom", phone: "+919876543211", relationship: "Mother", isPrimary: true },
    { name: "Best Friend", phone: "+919876543212", relationship: "Friend", isPrimary: false },
    { name: "Brother", phone: "+919876543213", relationship: "Sibling", isPrimary: false }
  ];

  const triggerEmergencyProtocol = async (triggerType: string) => {
    setIsTriggering(true);
    setEmergencyActive(true);

    try {
      // Get current location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date();
          
          // Create emergency alert with scenario details
          const emergencyData: EmergencyAlert = {
            triggerType,
            scenario: getEmergencyScenario(triggerType),
            location: {
              lat: latitude,
              lng: longitude,
              address: `Emergency Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            },
            timestamp
          };

          // Auto-start live streaming
          setShowLiveStream(true);
          const streamUrl = `${window.location.origin}/emergency-stream/${Date.now()}`;
          emergencyData.streamUrl = streamUrl;

          // Send emergency messages to all contacts
          await sendEmergencyMessages(emergencyData);

          // Show success notification
          toast({
            title: "🚨 Emergency Alert Activated",
            description: "All emergency contacts notified with live location and video stream",
            variant: "default",
          });

          // Auto-call emergency services after delay
          setTimeout(() => {
            toast({
              title: "📞 Calling Emergency Services",
              description: "Connecting to Police (100) and Women's Helpline (1091)",
              variant: "default",
            });
          }, 3000);

        }, (error) => {
          console.error('Geolocation error:', error);
          // Still send emergency without precise location
          const emergencyData: EmergencyAlert = {
            triggerType,
            scenario: getEmergencyScenario(triggerType),
            location: {
              lat: 0,
              lng: 0,
              address: "Location unavailable - GPS disabled"
            },
            timestamp: new Date()
          };
          sendEmergencyMessages(emergencyData);
        });
      }
    } catch (error) {
      toast({
        title: "Emergency Alert Failed",
        description: "Please try again or call emergency services directly",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const getEmergencyScenario = (triggerType: string): string => {
    const scenarios = {
      'manual_button': 'Manual SOS button pressed - User actively requested emergency assistance',
      'voice_activation': 'Voice distress detected - User said emergency keywords indicating need for help',
      'shake_detection': 'Device shake pattern detected - Possible struggle or distress situation',
      'panic_hold': 'Extended button hold detected - User confirmed emergency situation',
      'location_unsafe': 'User in potentially unsafe location - Proactive safety alert triggered'
    };
    
    return scenarios[triggerType as keyof typeof scenarios] || 'Emergency assistance requested through Sakhi Suraksha app';
  };

  const sendEmergencyMessages = async (emergencyData: EmergencyAlert) => {
    const messageTemplate = `🚨 URGENT EMERGENCY ALERT 🚨

${emergencyData.scenario}

📍 LIVE LOCATION: 
${emergencyData.location.address}
Google Maps: https://maps.google.com/?q=${emergencyData.location.lat},${emergencyData.location.lng}

🕒 TIME: ${emergencyData.timestamp.toLocaleString()}

📹 LIVE VIDEO STREAM: 
${emergencyData.streamUrl || 'Starting video stream...'}

⚠️ EMERGENCY DETAILS:
- Trigger: ${emergencyData.triggerType.replace('_', ' ').toUpperCase()}
- App: Sakhi Suraksha Safety App
- Auto-generated alert

🆘 IMMEDIATE ACTION REQUIRED:
1. Contact me immediately
2. Call emergency services if no response
3. Share this location with authorities

Emergency Contacts:
🚔 Police: 100
👩‍⚕️ Women's Helpline: 1091
🏥 Medical: 108

This is an automated safety alert. Please respond urgently.`;

    // Simulate sending SMS to all emergency contacts
    for (const contact of demoEmergencyContacts) {
      try {
        // In production, this would use actual SMS API (Twilio, etc.)
        console.log(`📱 SMS sent to ${contact.name} (${contact.phone}):`);
        console.log(messageTemplate);
        
        // Show individual contact notifications
        setTimeout(() => {
          toast({
            title: `Message sent to ${contact.name}`,
            description: `${contact.relationship} notified with emergency details and live location`,
            variant: "default",
          });
        }, 1000 * (demoEmergencyContacts.indexOf(contact) + 1));
        
      } catch (error) {
        console.error(`Failed to send message to ${contact.name}:`, error);
      }
    }

    // Log emergency record for demo
    console.log('🚨 EMERGENCY RECORD CREATED:', emergencyData);
  };

  const startHold = () => {
    if (holdTimeoutRef.current) return;
    
    setHoldProgress(0);
    
    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
      });
    }, 100);
    
    // Trigger emergency after 3 seconds
    holdTimeoutRef.current = setTimeout(() => {
      triggerEmergencyProtocol('panic_hold');
      setHoldProgress(0);
    }, 3000);
  };

  const endHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const quickEmergencyCall = (number: string, service: string) => {
    window.location.href = `tel:${number}`;
    toast({
      title: `Calling ${service}`,
      description: `Connecting to ${number}`,
    });
  };

  const deactivateEmergency = () => {
    setEmergencyActive(false);
    setShowLiveStream(false);
    toast({
      title: "Emergency Deactivated",
      description: "You can notify contacts that you are safe",
    });
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main Emergency Button */}
      <div className="relative">
        <Button
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          disabled={isTriggering}
          className={`
            w-44 h-44 rounded-full 
            ${emergencyActive 
              ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-800 animate-pulse' 
              : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
            }
            hover:from-red-600 hover:via-red-700 hover:to-red-800
            shadow-2xl hover:shadow-red-500/50
            border-8 border-white
            transition-all duration-300
            relative overflow-hidden
            ${isTriggering ? 'scale-110' : 'hover:scale-105'}
            ${holdProgress > 0 ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
          `}
        >
          {/* Progress Ring */}
          {holdProgress > 0 && (
            <div 
              className="absolute inset-0 rounded-full border-8 border-transparent"
              style={{
                background: `conic-gradient(from 0deg, #fbbf24 ${holdProgress * 3.6}deg, transparent ${holdProgress * 3.6}deg)`,
                borderRadius: '50%'
              }}
            />
          )}
          
          <div className="flex flex-col items-center relative z-10">
            <AlertTriangle className="w-16 h-16 text-white mb-2" />
            <span className="text-white font-bold text-2xl">
              {isTriggering ? "SENDING..." : 
               holdProgress > 0 ? "HOLD..." : 
               emergencyActive ? "ACTIVE" : "SOS"}
            </span>
            {emergencyActive && (
              <span className="text-white text-xs mt-1">Emergency Active</span>
            )}
          </div>
        </Button>
        
        {holdProgress > 0 && (
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-sm font-semibold text-red-600">
              {Math.ceil((100 - holdProgress) / 33)} seconds to activate
            </p>
          </div>
        )}
      </div>
      
      <p className="text-center text-sm text-gray-600 max-w-xs font-medium">
        Hold for 3 seconds to send emergency alert with:
        <br />📍 Live location • 📹 Video stream • 📱 SMS to contacts
      </p>

      {/* Emergency Status */}
      {emergencyActive && (
        <div className="w-full max-w-md p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="text-center">
            <p className="font-bold text-red-700 mb-2">🚨 EMERGENCY ACTIVE 🚨</p>
            <p className="text-sm text-red-600 mb-3">
              All contacts notified • Live stream active • Location shared
            </p>
            <Button 
              onClick={deactivateEmergency}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300"
            >
              Mark as Safe
            </Button>
          </div>
        </div>
      )}

      {/* Quick Emergency Calls */}
      <div className="flex space-x-3">
        <Button
          onClick={() => quickEmergencyCall('100', 'Police')}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Phone className="w-3 h-3" />
          <span className="text-xs">Police 100</span>
        </Button>
        
        <Button
          onClick={() => quickEmergencyCall('1091', "Women's Helpline")}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 border-pink-200 text-pink-600 hover:bg-pink-50"
        >
          <Phone className="w-3 h-3" />
          <span className="text-xs">Women 1091</span>
        </Button>
        
        <Button
          onClick={() => quickEmergencyCall('108', 'Medical Emergency')}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1 border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          <Phone className="w-3 h-3" />
          <span className="text-xs">Medical 108</span>
        </Button>
      </div>

      {/* Emergency Contacts Preview */}
      <div className="w-full max-w-md">
        <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts ({demoEmergencyContacts.length})</p>
        <div className="space-y-2">
          {demoEmergencyContacts.map((contact, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-gray-500">{contact.relationship}</p>
              </div>
              <div className="flex items-center space-x-2">
                {contact.isPrimary && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Primary</span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickEmergencyCall(contact.phone.replace(/[^\d]/g, ''), contact.name)}
                >
                  <Phone className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Streaming Component */}
      {showLiveStream && (
        <div className="w-full max-w-md">
          <LiveStreaming 
            isEmergency={true}
            onStreamStart={(streamUrl) => {
              toast({
                title: "Emergency Stream Active",
                description: "Live video shared with emergency contacts",
              });
            }}
            onStreamEnd={() => setShowLiveStream(false)}
          />
        </div>
      )}
    </div>
  );
}