import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X, RotateCcw, QrCode } from "lucide-react";

interface QRScannerProps {
  onScanResult: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanResult, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

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
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScanResult(manualCode.trim());
    }
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

      {!showManualInput ? (
        <div className="relative bg-black rounded-lg overflow-hidden">
          {error ? (
            <div className="h-64 flex items-center justify-center text-center p-6">
              <div>
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-red-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button onClick={startCamera}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualInput(true)}
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Enter Code Manually
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
                autoPlay
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
                    Position QR code in frame
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center p-6">
            <QrCode className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <h4 className="font-medium mb-2">Enter Connection Code</h4>
            <p className="text-sm text-gray-600 mb-4">
              Type the code from your child's QR code
            </p>
          </div>
          
          <Input
            placeholder="Enter connection code (e.g., SK1749115000ABC123)"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="text-center font-mono"
          />
          
          <div className="flex space-x-2">
            <Button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              className="flex-1"
            >
              Connect
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowManualInput(false)}
              className="flex-1"
            >
              Back to Camera
            </Button>
          </div>
        </div>
      )}

      {!showManualInput && !error && (
        <div className="text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowManualInput(true)}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Enter code manually instead
          </Button>
        </div>
      )}

      <div className="text-sm text-gray-600 text-center">
        <p>Scan the QR code from your child's app or enter the code manually</p>
      </div>
    </div>
  );
}