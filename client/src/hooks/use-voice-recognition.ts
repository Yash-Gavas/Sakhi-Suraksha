import { useState, useEffect, useCallback } from "react";
import { triggerEmergencyProtocol } from "@/lib/emergency";
import { useLocation } from "./use-location";
import { useToast } from "./use-toast";

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { location } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase();
        setTranscript(transcript);

        // Check for emergency keywords
        const emergencyKeywords = ["help me", "help", "emergency", "sos"];
        const isEmergency = emergencyKeywords.some(keyword => 
          transcript.includes(keyword)
        );

        if (isEmergency && event.results[current].isFinal) {
          handleEmergencyDetected(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Unable to access microphone. Please check permissions.",
          variant: "destructive",
        });
      };

      setRecognition(recognitionInstance);
    }
  }, [location, toast]);

  const handleEmergencyDetected = useCallback(async (detectedPhrase: string) => {
    try {
      toast({
        title: "Emergency Command Detected",
        description: `Heard: "${detectedPhrase}" - Triggering emergency protocol`,
        variant: "default",
      });

      if (location) {
        await triggerEmergencyProtocol({
          userId: 1, // Demo user ID
          triggerType: 'voice',
          latitude: location.latitude,
          longitude: location.longitude,
          address: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
        });
      }

      stopListening();
    } catch (error) {
      toast({
        title: "Emergency Alert Failed",
        description: "Failed to send emergency alert. Please try manual SOS.",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript("");
      try {
        recognition.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
    }
  }, [recognition, isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: !!recognition,
  };
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
