import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StreamData {
  id: number;
  streamUrl: string;
  shareLink: string;
  isActive: boolean;
  userName: string;
  userEmail: string;
  startedAt: string;
}

export default function WatchStream() {
  const { streamId } = useParams();
  const [viewerCount, setViewerCount] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch stream details
  const { data: stream, isLoading } = useQuery<StreamData>({
    queryKey: [`/api/live-stream/${streamId}`],
    enabled: !!streamId
  });

  useEffect(() => {
    if (stream && videoRef.current) {
      // In a real implementation, this would connect to the actual stream
      // For now, we'll show a placeholder indicating the stream is active
      console.log('Connecting to stream:', stream.streamUrl);
    }
  }, [stream]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Stream Not Found</h2>
            <p className="text-gray-600 mb-4">
              The live stream you're looking for is not available or has ended.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Stream Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Emergency Live Stream</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
              <div className="flex items-center space-x-1 text-gray-600">
                <Eye className="w-4 h-4" />
                <span>{viewerCount} viewer{viewerCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{stream.userName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Started {new Date(stream.startedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                controls
                autoPlay
                muted
                poster="/emergency-stream-placeholder.jpg"
              >
                <source src={stream.streamUrl} type="video/webm" />
                <source src={stream.streamUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Stream Status Overlay */}
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="animate-pulse">
                  🔴 EMERGENCY STREAM
                </Badge>
              </div>
              
              {/* Stream Info Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="bg-black/70 border-red-500">
                  <CardContent className="p-3">
                    <div className="text-white text-sm">
                      <p className="font-semibold mb-1">Emergency Situation Active</p>
                      <p className="text-gray-300">
                        This is a live emergency stream. If you can assist or have information 
                        about this situation, please contact local authorities immediately.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Emergency Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => window.open('tel:100')}
              >
                📞 Call Police (100)
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => window.open('tel:108')}
              >
                🚑 Call Ambulance (108)
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => window.open('tel:1091')}
              >
                👩 Women Helpline (1091)
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Emergency Contact Information:</strong> If you witness this emergency situation, 
                please contact the authorities immediately. Do not attempt to intervene directly unless 
                you are trained to do so.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}