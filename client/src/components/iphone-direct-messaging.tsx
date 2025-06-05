import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface iPhoneDirectMessagingProps {
  contacts: Array<{name: string; phoneNumber: string}>;
  emergencyMessage: string;
  onComplete: () => void;
}

export default function iPhoneDirectMessaging({ 
  contacts, 
  emergencyMessage, 
  onComplete 
}: iPhoneDirectMessagingProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Direct Messages app opening for iPhone 13 Pro Max
    const sendDirectMessages = async () => {
      if (contacts.length === 0) {
        onComplete();
        return;
      }

      // Send to first contact immediately
      const firstContact = contacts[0];
      const cleanNumber = firstContact.phoneNumber.replace(/\D/g, '');
      const messageBody = encodeURIComponent(emergencyMessage);
      const messagesUrl = `sms:${cleanNumber}?body=${messageBody}`;
      
      // Direct navigation to Messages app
      window.location.href = messagesUrl;
      
      toast({
        title: "Messages App Opening",
        description: `Opening for ${firstContact.name}`,
        duration: 2000,
      });

      // If multiple contacts, show instructions
      if (contacts.length > 1) {
        setTimeout(() => {
          toast({
            title: "Multiple Contacts",
            description: `${contacts.length - 1} more contacts to message`,
            duration: 3000,
          });
        }, 2000);
      }

      // Auto-complete after 5 seconds
      setTimeout(() => {
        onComplete();
      }, 5000);
    };

    sendDirectMessages();
  }, [contacts, emergencyMessage, onComplete, toast]);

  // Show minimal loading state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 text-center">
        <div className="text-lg font-semibold text-red-600 mb-2">
          Opening Messages App
        </div>
        <div className="text-sm text-gray-600">
          Sending emergency message to {contacts[0]?.name}
        </div>
      </div>
    </div>
  );
}