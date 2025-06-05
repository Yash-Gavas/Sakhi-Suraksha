import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PersistentVoiceDetectorProps {
  onEmergencyDetected: () => void;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export default function PersistentVoiceDetector({ 
  onEmergencyDetected, 
  isActive, 
  onToggle 
}: PersistentVoiceDetectorProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [bufferSize, setBufferSize] = useState(0);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const distressKeywords = [
    'help', 'emergency', 'danger', 'fire', 'police', 'ambulance',
    'bachao', 'madad', 'aag', 'chor', 'save me', 'help me',
    'call police', 'call 911', 'call 100', 'attack', 'assault'
  ];

  useEffect(() => {
    if (isActive) {
      startPersistentListening();
    } else {
      stopPersistentListening();
    }

    return () => {
      stopPersistentListening();
    };
  }, [isActive]);

  const startPersistentListening = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup speech recognition
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            console.log('Voice input:', finalTranscript);
            setTranscription(prev => prev + ' ' + finalTranscript);
            checkForDistressKeywords(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please allow microphone access for voice detection",
              variant: "destructive"
            });
          }
        };

        recognition.onend = () => {
          if (isActive) {
            // Restart recognition if still active
            setTimeout(() => {
              if (recognitionRef.current && isActive) {
                recognition.start();
              }
            }, 100);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      // Setup media recorder for audio buffering
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          setBufferSize(prev => prev + event.data.size);
          console.log('Recording chunk available:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsListening(true);

      // Setup automatic cleanup every 30 seconds
      cleanupIntervalRef.current = setInterval(() => {
        cleanupOldData();
      }, 30000);

      toast({
        title: "Voice Detection Active",
        description: "Listening for emergency keywords. Say 'help' or 'bachao' to trigger alert."
      });

    } catch (error) {
      console.error('Failed to start voice detection:', error);
      toast({
        title: "Voice Detection Failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopPersistentListening = () => {
    setIsListening(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }

    // Clean up audio chunks
    audioChunksRef.current = [];
    setBufferSize(0);
    setTranscription("");
  };

  const checkForDistressKeywords = (text: string) => {
    const lowercaseText = text.toLowerCase();
    
    for (const keyword of distressKeywords) {
      if (lowercaseText.includes(keyword.toLowerCase())) {
        console.log(`Distress keyword detected: "${keyword}"`);
        
        toast({
          title: "Emergency Keyword Detected",
          description: `Detected: "${keyword}" - Triggering emergency alert`,
          variant: "destructive"
        });

        onEmergencyDetected();
        break;
      }
    }
  };

  const cleanupOldData = () => {
    const maxBufferSize = 50 * 1024 * 1024; // 50MB limit
    
    if (bufferSize > maxBufferSize) {
      // Remove oldest audio chunks
      const chunksToRemove = Math.floor(audioChunksRef.current.length / 2);
      const removedChunks = audioChunksRef.current.splice(0, chunksToRemove);
      
      const removedSize = removedChunks.reduce((total, chunk) => total + chunk.size, 0);
      setBufferSize(prev => prev - removedSize);
      
      console.log(`Cleaned up ${removedSize} bytes of audio data`);
    }

    // Limit transcription length
    if (transcription.length > 1000) {
      setTranscription(prev => prev.slice(-500)); // Keep last 500 characters
    }
  };

  const manualCleanup = () => {
    audioChunksRef.current = [];
    setBufferSize(0);
    setTranscription("");
    
    toast({
      title: "Data Cleared",
      description: "Audio buffer and transcription cleared"
    });
  };

  const formatBufferSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Voice Detection</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            onClick={() => onToggle(!isActive)}
            className="flex items-center gap-2"
          >
            {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {isActive ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      {isActive && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">
              {isListening ? 'Listening for emergency keywords...' : 'Not listening'}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            Buffer: {formatBufferSize(bufferSize)} | 
            Transcription: {transcription.length} chars
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={manualCleanup}
              className="flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear Buffer
            </Button>
          </div>

          {transcription && (
            <div className="text-xs bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
              <strong>Recent:</strong> {transcription.slice(-200)}...
            </div>
          )}

          <div className="text-xs text-gray-500">
            Keywords: help, emergency, bachao, madad, save me, call police
          </div>
        </div>
      )}
    </div>
  );
}