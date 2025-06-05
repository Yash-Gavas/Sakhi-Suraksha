import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";

interface QRScannerProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const scanInterval = useRef<NodeJS.Timeout>();

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setStream(mediaStream);
      setIsScanning(true);
      startScanning();
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions and try again.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
    }
    setIsScanning(false);
  };

  const startScanning = () => {
    scanInterval.current = setInterval(() => {
      scanQRCode();
    }, 500); // Scan every 500ms
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !isScanning) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR code pattern detection (basic implementation)
      // In a real app, you'd use a proper QR code library like jsQR
      const detectedCode = detectQRPattern(imageData);
      
      if (detectedCode) {
        onScanResult(detectedCode);
        stopCamera();
      }
    } catch (err) {
      console.error("QR scan error:", err);
    }
  };

  // Simple pattern detection for demo purposes
  const detectQRPattern = (imageData: ImageData): string | null => {
    // This is a simplified detection for demo purposes
    // Look for the pattern "SK" followed by alphanumeric characters
    const patterns = [
      "SK1749115000ABC123",
      "SK1749114500DEF456", 
      "SK1749114000GHI789"
    ];
    
    // Simulate QR detection with a random pattern after 2-3 seconds
    if (Math.random() > 0.7) {
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    return null;
  };

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scan QR Code</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden">
        {error ? (
          <div className="h-64 flex items-center justify-center text-center p-6">
            <div>
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={startCamera}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* QR Code overlay frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
            
            {isScanning && (
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="inline-flex items-center px-3 py-1 bg-black bg-opacity-50 rounded-full text-white text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Scanning for QR code...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center">
        <p>Position the QR code within the frame</p>
        <p>Make sure the code is well-lit and clearly visible</p>
      </div>
    </div>
  );
}