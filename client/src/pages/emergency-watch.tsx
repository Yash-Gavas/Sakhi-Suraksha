import { useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Video, MapPin, Clock } from "lucide-react";

export default function EmergencyWatchPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const [emergencyAlertId, setEmergencyAlertId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (streamId) {
      // Extract emergency alert ID from stream ID (format: emergency_123 or emergency_123_timestamp)
      const match = streamId.match(/emergency_(\d+)/);
      if (match) {
        setEmergencyAlertId(match[1]);
      }
    }
  }, [streamId]);

  // Start camera stream when component mounts
  useEffect(() => {
    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (error) {
        console.error('Failed to access camera:', error);
      }
    };

    startStream();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const { data: emergencyAlert, isLoading } = useQuery({
    queryKey: ["/api/emergency-alerts", emergencyAlertId],
    enabled: !!emergencyAlertId,
    queryFn: async () => {
      const response = await fetch(`/api/emergency-alerts/${emergencyAlertId}`);
      if (!response.ok) throw new Error("Failed to fetch emergency alert");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
              <p>Loading emergency stream...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!streamId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
              <p>Invalid stream ID</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto p-4">
        {/* Emergency Alert Header */}
        <Card className="mb-4 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Emergency Live Stream
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyAlert && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>{new Date(emergencyAlert.createdAt).toLocaleString('en-IN', { 
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span>{emergencyAlert.location?.address || 'Location tracking active'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-gray-600" />
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    isStreaming ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isStreaming ? 'Live Stream Active' : 'Connecting...'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Video Stream */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                  <div className="text-center text-white">
                    <Video className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <p className="text-lg font-semibold">Starting Emergency Stream...</p>
                    <p className="text-sm text-gray-300 mt-2">Accessing camera for live monitoring</p>
                  </div>
                </div>
              )}

              {/* Live indicator */}
              {isStreaming && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Information */}
        {emergencyAlert && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Emergency Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Trigger Type:</span>
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    {emergencyAlert.triggerType?.replace('_', ' ').toUpperCase() || 'EMERGENCY ALERT'}
                  </span>
                </div>
                
                {emergencyAlert.voiceDetectionText && (
                  <div>
                    <span className="font-semibold text-gray-700">Voice Detection:</span>
                    <span className="ml-2 italic text-gray-600">"{emergencyAlert.voiceDetectionText}"</span>
                  </div>
                )}
                
                {emergencyAlert.location && (
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <div className="ml-2 mt-1">
                      <p className="text-sm text-gray-600">{emergencyAlert.location.address}</p>
                      <a 
                        href={`https://www.google.com/maps?q=${emergencyAlert.location.lat},${emergencyAlert.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}