import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MessageCircle, Phone, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MobileEmergencyInterfaceProps {
  contacts: Array<{name: string; phoneNumber: string}>;
  emergencyMessage: string;
  onClose: () => void;
}

export default function MobileEmergencyInterface({ 
  contacts, 
  emergencyMessage, 
  onClose 
}: MobileEmergencyInterfaceProps) {
  const [sentContacts, setSentContacts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const openSMS = (phoneNumber: string, contactName: string) => {
    try {
      // Multiple attempts for different Android SMS handlers
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(emergencyMessage)}`;
      
      // Method 1: Direct window.open with _self
      window.open(smsUrl, '_self');
      
      // Method 2: Create and click invisible link (for better mobile support)
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = smsUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, 100);
      
      setSentContacts(prev => new Set(prev).add(phoneNumber));
      console.log(`SMS opened for ${contactName} at ${phoneNumber}`);
      
      toast({
        title: "SMS App Opening",
        description: `Opening SMS for ${contactName}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to open SMS:', error);
      toast({
        title: "SMS Error",
        description: "Could not open SMS app",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = (phoneNumber: string, contactName: string) => {
    try {
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Method 1: WhatsApp app scheme
      const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(emergencyMessage)}`;
      window.open(whatsappUrl, '_self');
      
      // Method 2: WhatsApp web fallback
      setTimeout(() => {
        const webUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(emergencyMessage)}`;
        window.open(webUrl, '_blank');
      }, 1000);
      
      setSentContacts(prev => new Set(prev).add(phoneNumber));
      console.log(`WhatsApp opened for ${contactName} at ${phoneNumber}`);
      
      toast({
        title: "WhatsApp Opening",
        description: `Opening WhatsApp for ${contactName}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
      toast({
        title: "WhatsApp Error",
        description: "Could not open WhatsApp app",
        variant: "destructive",
      });
    }
  };

  const callContact = (phoneNumber: string) => {
    try {
      // Method 1: Direct tel: protocol
      window.location.href = `tel:${phoneNumber}`;
      
      // Method 2: window.open for better mobile support
      setTimeout(() => {
        window.open(`tel:${phoneNumber}`, '_self');
      }, 100);
      
      console.log(`Calling ${phoneNumber}`);
      
      toast({
        title: "Calling",
        description: `Dialing ${phoneNumber}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast({
        title: "Call Error",
        description: "Could not initiate call",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-red-50 border-red-200">
        <CardHeader className="bg-red-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">🚨 Emergency Alert Active</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-red-700 mb-4">
            Tap the buttons below to send emergency messages to your contacts:
          </p>
          
          <div className="space-y-3">
            {contacts.map((contact) => {
              const isSent = sentContacts.has(contact.phoneNumber);
              return (
                <div key={contact.phoneNumber} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{contact.name}</h4>
                      <p className="text-xs text-gray-600">{contact.phoneNumber}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => callContact(contact.phoneNumber)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "default"}
                      onClick={() => openSMS(contact.phoneNumber, contact.name)}
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      SMS
                    </Button>
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "default"}
                      onClick={() => openWhatsApp(contact.phoneNumber, contact.name)}
                      className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 text-sm mb-1">Emergency Services:</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                onClick={() => window.location.href = 'tel:100'}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                Police 100
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.href = 'tel:108'}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                Medical 108
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.href = 'tel:1091'}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
              >
                Women 1091
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-3 text-center">
            Tap each button to open your phone's native apps
          </p>
        </CardContent>
      </Card>
    </div>
  );
}