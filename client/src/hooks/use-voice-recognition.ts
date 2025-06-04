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
        description: `Voice command: "${detectedPhrase}" - Activating emergency protocol`,
        variant: "default",
      });

      // Get current location for emergency alert
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const response = await fetch('/api/emergency-alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                triggerType: 'voice_activation',
                latitude,
                longitude,
                address: `Emergency location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                audioRecordingUrl: null,
                videoRecordingUrl: null
              })
            });

            if (response.ok) {
              toast({
                title: "Emergency Alert Sent",
                description: "Your emergency contacts have been notified with your location",
                variant: "default",
              });
            } else {
              throw new Error('Failed to send emergency alert');
            }
          } catch (error) {
            console.error('Failed to send emergency alert:', error);
            toast({
              title: "Alert Failed",
              description: "Emergency alert could not be sent. Please try manual SOS.",
              variant: "destructive",
            });
          }
        }, (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location Error",
            description: "Could not get location for emergency alert",
            variant: "destructive",
          });
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
