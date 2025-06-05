// Mobile-specific automated messaging for emergency alerts
export class MobileMessaging {
  private static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Automatically send emergency messages via mobile native apps
  static async sendEmergencyMessages(contacts: Array<{name: string; phoneNumber: string}>, emergencyData: any): Promise<void> {
    const locationUrl = `https://www.google.com/maps?q=${emergencyData.location.lat},${emergencyData.location.lng}`;
    
    for (const contact of contacts) {
      const message = `🚨 EMERGENCY ALERT 🚨

I need immediate help!

📍 Location: ${emergencyData.location.address}
🗺️ Live Location: ${locationUrl}
🕒 Time: ${new Date().toLocaleString()}
📹 Live Stream: ${emergencyData.streamUrl || 'Starting soon...'}

Emergency Services:
• Police: 100
• Ambulance: 108
• Women Helpline: 1091

This is an automated safety alert from Sakhi Suraksha app.`;

      // Send via SMS first
      this.openNativeSMS(contact.phoneNumber, message);
      
      // Then WhatsApp after delay
      setTimeout(() => {
        this.openWhatsAppMobile(contact.phoneNumber, message);
      }, 2000);
    }
  }

  // Open native SMS app with pre-filled message
  private static openNativeSMS(phoneNumber: string, message: string): void {
    try {
      // iOS and Android SMS URL scheme
      const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      
      // Create invisible link and click it
      const link = document.createElement('a');
      link.href = smsUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`SMS opened for ${phoneNumber}`);
    } catch (error) {
      console.error('Failed to open SMS app:', error);
    }
  }

  // Open WhatsApp mobile app
  private static openWhatsAppMobile(phoneNumber: string, message: string): void {
    try {
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Mobile WhatsApp URL scheme
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
      
      // Open in new tab/app
      window.open(whatsappUrl, '_blank');
      
      console.log(`WhatsApp opened for ${phoneNumber}`);
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
    }
  }

  // Send live location updates
  static sendLiveLocationUpdate(contacts: Array<{name: string; phoneNumber: string}>, location: any, streamUrl: string): void {
    const locationMessage = `🔴 LIVE LOCATION UPDATE 🔴

Current Location: ${location.address}
Live Map: https://www.google.com/maps?q=${location.lat},${location.lng}
Live Stream: ${streamUrl}

Time: ${new Date().toLocaleString()}

Emergency contact if needed: 100 (Police) | 108 (Ambulance)`;

    contacts.forEach((contact, index) => {
      setTimeout(() => {
        this.openWhatsAppMobile(contact.phoneNumber, locationMessage);
        this.openNativeSMS(contact.phoneNumber, locationMessage);
      }, index * 1000);
    });
  }

  // Show mobile notification
  static showNativeNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { 
            body, 
            icon: '/favicon.ico'
          });
        }
      });
    }
  }

  // Auto-dial emergency numbers
  static dialEmergencyNumber(number: string, serviceName: string): void {
    try {
      // Mobile phone dialer
      const telUrl = `tel:${number}`;
      window.location.href = telUrl;
      
      this.showNativeNotification(
        `Calling ${serviceName}`,
        `Dialing ${number} for emergency assistance`
      );
    } catch (error) {
      console.error('Failed to dial emergency number:', error);
    }
  }
}