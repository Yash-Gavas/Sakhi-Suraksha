import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, Mic, MicOff, StopCircle, Users, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface LiveStreamingProps {
  isEmergency?: boolean;
  onStreamStart?: (streamUrl: string) => void;
  onStreamEnd?: () => void;
}

export default function LiveStreaming({ 
  isEmergency = false, 
  onStreamStart, 
  onStreamEnd 
}: LiveStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamUrl, setStreamUrl] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const startStreaming = async () => {
    try {
      // Get user media for video/audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Connect to WebSocket for live streaming
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for streaming');
        
        // Create live stream record
        fetch('/api/live-streams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            streamUrl: wsUrl,
            shareLink: `${window.location.origin}/stream/${Date.now()}`,
            isActive: true,
            emergencyAlertId: isEmergency ? Date.now() : null
          })
        }).then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to create stream');
        }).then(streamData => {
          setStreamUrl(streamData.shareLink);
          setIsStreaming(true);
          
          toast({
            title: isEmergency ? "Emergency Stream Started" : "Live Stream Started",
            description: "Your video stream is now active",
          });

          if (onStreamStart) {
            onStreamStart(streamData.shareLink);
          }
        }).catch(error => {
          console.error('Failed to create stream:', error);
          toast({
            title: "Stream Error",
            description: "Failed to start live stream",
            variant: "destructive"
          });
        });
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'viewer_count') {
          setViewerCount(data.count);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Lost connection to streaming server",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      toast({
        title: "Camera Access Error",
        description: "Could not access camera/microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setViewerCount(0);
    setStreamUrl("");

    if (onStreamEnd) {
      onStreamEnd();
    }

    toast({
      title: "Stream Ended",
      description: "Live stream has been stopped",
    });
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const shareStream = () => {
    if (streamUrl && navigator.share) {
      navigator.share({
        title: isEmergency ? 'Emergency Live Stream' : 'Live Stream',
        text: isEmergency ? 'I need help - watch my emergency stream' : 'Join my live stream',
        url: streamUrl
      });
    } else if (streamUrl) {
      navigator.clipboard.writeText(streamUrl);
      toast({
        title: "Link Copied",
        description: "Stream link copied to clipboard",
      });
    }
  };

  return (
    <Card className={`${isEmergency ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            {isEmergency ? 'Emergency Live Stream' : 'Live Streaming'}
          </CardTitle>
          {isStreaming && (
            <div className="flex items-center space-x-2">
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                {viewerCount}
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Video Preview */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <CameraOff className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Stream Controls */}
        <div className="space-y-3">
          {!isStreaming ? (
            <Button
              onClick={startStreaming}
              className={`w-full ${
                isEmergency 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isEmergency ? 'Start Emergency Stream' : 'Start Live Stream'}
            </Button>
          ) : (
            <>
              <div className="flex space-x-2">
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "destructive"}
                  className="flex-1"
                >
                  {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  className="flex-1"
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  onClick={shareStream}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                onClick={stopStreaming}
                variant="destructive"
                className="w-full"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Stream
              </Button>
            </>
          )}
        </div>

        {isEmergency && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Emergency Mode:</strong> This stream will be automatically shared with your emergency contacts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}