import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Phone, MapPin, Video, Camera, MessageCircle, Users, Shield, Clock, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import FixedVoiceDetector from './fixed-voice-detector';
import LiveStreaming from './live-streaming';
import PhotoCapture from './photo-capture';

interface EmergencyContact {
  id: number;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship?: string;
  isActive: boolean;
  whatsappNumber?: string;
}

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
  const [showDirectMessaging, setShowDirectMessaging] = useState(false);
  const [emergencyMessageText, setEmergencyMessageText] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState<number | null>(null);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  
  const { toast } = useToast();
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch emergency contacts
  const { data: emergencyContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"]
  });

  // WebSocket connection for emergency resolution
  useEffect(() => {
    if (emergencyActive && !wsRef.current) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for emergency monitoring');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'emergencyResolved' && data.alertId === currentAlertId) {
          handleEmergencyResolution();
        }
      };
      
      wsRef.current = ws;
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [emergencyActive, currentAlertId]);

  const startVideoRecording = async (): Promise<MediaRecorder | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        setRecordedVideoBlob(videoBlob);
        
        // Stop all tracks to release camera
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setVideoRecorder(recorder);
      
      console.log('Video recording started for emergency');
      return recorder;
    } catch (error) {
      console.error('Failed to start video recording:', error);
      return null;
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && videoRecorder.state === 'recording') {
      videoRecorder.stop();
      setVideoRecorder(null);
    }
  };

  const uploadVideoRecording = async (alertId: number, videoBlob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `emergency_${alertId}_${Date.now()}.webm`);
      formData.append('alertId', alertId.toString());

      const response = await fetch('/api/upload/emergency-video', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload video recording');
      }

      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      return null;
    }
  };

  const handleVoiceSOSDetected = async (triggerType: string, scenario: string, detectedText: string) => {
    console.log('Voice SOS detected, starting emergency protocol with video recording');
    
    // Start video recording immediately
    const recorder = await startVideoRecording();
    
    // Show emergency notification immediately
    toast({
      title: "Voice SOS Detected",
      description: "Recording video and alerting contacts...",
      variant: "destructive",
    });
    
    // Trigger emergency protocol with video recording
    await triggerEmergencyProtocol(triggerType, {
      scenario,
      detectedText,
      autoVideoRecording: true,
      videoRecorder: recorder
    });
  };

  const triggerEmergencyProtocol = async (triggerType: string, additionalData?: any) => {
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

          // Send emergency alert to backend
          try {
            const alertResponse = await fetch('/api/emergency-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                triggerType,
                latitude,
                longitude,
                deviceInfo: JSON.stringify(additionalData || {}),
                timestamp: timestamp.toISOString()
              })
            });

            if (alertResponse.ok) {
              const alert = await alertResponse.json();
              setCurrentAlertId(alert.id);
              console.log('Emergency alert created:', alert.id);

              // Handle video recording for voice-triggered emergencies
              if (additionalData?.autoVideoRecording && additionalData?.videoRecorder) {
                console.log('Voice-triggered emergency - continuous video recording started');
                setEmergencyActive(true);
                setShowLiveStream(true);
                
                // Show immediate feedback that recording has started
                toast({
                  title: "Video Recording Started",
                  description: "Continuous recording until emergency is resolved",
                  variant: "default",
                });
              }
            }
          } catch (error) {
            console.error('Failed to create emergency alert:', error);
          }

          await sendEmergencyMessages(emergencyData);
          setIsTriggering(false);
        });
      }
    } catch (error) {
      console.error('Emergency protocol failed:', error);
      setIsTriggering(false);
    }
  };

  const sendEmergencyMessages = async (emergencyData: EmergencyAlert) => {
    const activeContacts = emergencyContacts.filter(contact => contact.isActive);

    for (const contact of activeContacts) {
      try {
        // Send SMS alert
        await fetch('/api/send-emergency-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: contact.phoneNumber,
            location: emergencyData.location.address,
            whatsappNumber: contact.whatsappNumber || '+917892937490'
          })
        });

        // Send WhatsApp message if WhatsApp number available
        if (contact.whatsappNumber) {
          await fetch('/api/send-whatsapp-emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: contact.whatsappNumber,
              message: `🚨 EMERGENCY ALERT 🚨\n\nSakhi Suraksha emergency detected!\n\nLocation: ${emergencyData.location.address}\nTime: ${emergencyData.timestamp.toLocaleString()}\nTrigger: ${emergencyData.triggerType}\n\nPlease check immediately!`
            })
          });
        }
      } catch (error) {
        console.error(`Failed to send emergency message to ${contact.name}:`, error);
      }
    }
  };

  const handleEmergencyResolution = () => {
    console.log('Emergency resolved, stopping all activities');
    
    // Stop video recording and upload if active
    if (videoRecorder && videoRecorder.state === 'recording' && currentAlertId) {
      videoRecorder.stop();
      
      // Upload video after recording stops
      videoRecorder.onstop = async () => {
        if (recordedVideoBlob && currentAlertId) {
          const videoUrl = await uploadVideoRecording(currentAlertId, recordedVideoBlob);
          console.log('Emergency video uploaded:', videoUrl);
        }
      };
    }
    
    setEmergencyActive(false);
    setShowLiveStream(false);
    setCurrentAlertId(null);
    
    toast({
      title: "Emergency Resolved",
      description: "All emergency activities have been stopped",
      variant: "default",
    });
  };

  const sendLiveLocationAlert = async (phoneNumber: string, streamUrl: string, location: any, whatsappNumber?: string) => {
    try {
      await fetch('/api/send-live-location-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          locationUrl: `https://maps.google.com/maps?q=${location.lat},${location.lng}`,
          streamUrl,
          whatsappNumber
        })
      });
    } catch (error) {
      console.error('Failed to send live location alert:', error);
    }
  };

  const getEmergencyScenario = (triggerType: string): string => {
    const scenarios: Record<string, string> = {
      'voice-distress': 'Voice distress detected - potential threat situation',
      'button-hold': 'Manual emergency button activation',
      'smartwatch-panic': 'Smartwatch panic button pressed',
      'automatic-fall': 'Automatic fall detection triggered',
      'location-unsafe': 'Unsafe location detected'
    };
    return scenarios[triggerType] || 'Emergency situation detected';
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Emergency Status Display */}
      {emergencyActive && (
        <Card className="w-full max-w-md border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Emergency Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Alert ID: {currentAlertId}</span>
              <Button 
                onClick={handleEmergencyResolution}
                variant="outline" 
                size="sm"
                className="border-red-500 text-red-700 hover:bg-red-100"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Emergency Button */}
      <div className="relative">
        <Button
          className={`
            w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-red-700 
            hover:from-red-600 hover:to-red-800 text-white font-bold text-xl
            shadow-2xl transition-all duration-300 border-4 border-red-400
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

      {/* Emergency Contacts Display */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Emergency Contacts ({emergencyContacts.filter(c => c.isActive).length})
          </h3>
          {emergencyContacts.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No emergency contacts configured</p>
          ) : (
            emergencyContacts.filter(contact => contact.isActive).map((contact) => (
              <div key={contact.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{contact.name}</p>
                  <p className="text-xs text-gray-500">{contact.phoneNumber}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(`tel:${contact.phoneNumber}`)}
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Streaming Component */}
      {showLiveStream && (
        <div className="w-full max-w-md">
          <LiveStreaming 
            onStreamStart={(streamUrl: string) => {
              // Send live location alerts via device messaging
              if (emergencyContacts.length > 0) {
                const contacts = emergencyContacts.filter(contact => contact.isActive).map(contact => ({
                  name: contact.name,
                  phoneNumber: contact.phoneNumber,
                  email: contact.email
                }));

                // Send live location alerts through device apps
                for (const contact of contacts) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const location = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                      address: `Live Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
                    };
                    
                    sendLiveLocationAlert(
                      contact.phoneNumber,
                      streamUrl,
                      location,
                      '+917892937490' // Your WhatsApp number
                    );
                  });
                }
              }

              toast({
                title: "Emergency Stream Active",
                description: "Live video and location shared with emergency contacts via SMS and WhatsApp",
              });
            }}
            onStreamEnd={async () => {
              // Stop video recording and upload when stream ends
              if (videoRecorder && videoRecorder.state === 'recording') {
                stopVideoRecording();
                
                // Upload recorded video
                if (recordedVideoBlob && currentAlertId) {
                  const videoUrl = await uploadVideoRecording(currentAlertId, recordedVideoBlob);
                  console.log('Emergency video uploaded:', videoUrl);
                  
                  toast({
                    title: "Video Uploaded",
                    description: "Emergency recording saved successfully",
                  });
                }
              }
              
              setShowLiveStream(false);
            }}
          />
        </div>
      )}

      {/* Voice Detection Component */}
      <div className="w-full max-w-md">
        <FixedVoiceDetector 
          onDistressDetected={(confidence, keywords) => {
            console.log(`Distress detected with ${confidence}% confidence. Keywords: ${keywords.join(', ')}`);
          }}
          onVoiceSOSDetected={handleVoiceSOSDetected}
          onEmergencyTriggered={() => {
            console.log('Emergency triggered by voice detection');
          }}
          emergencyMode={emergencyActive}
        />
      </div>
    </div>
  );
}