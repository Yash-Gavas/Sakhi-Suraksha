import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { WebSocketServer } from 'ws';
import { 
  insertEmergencyContactSchema, 
  insertEmergencyAlertSchema,
  insertCommunityAlertSchema,
  insertSafeZoneSchema,
  insertLiveStreamSchema,
  insertDestinationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Emergency contacts routes
  app.get("/api/emergency-contacts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emergency contacts" });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const validatedData = insertEmergencyContactSchema.parse(req.body);
      const contact = await storage.createEmergencyContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  app.patch("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const contact = await storage.updateEmergencyContact(id, updates);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteEmergencyContact(id);
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Emergency alerts routes
  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const validatedData = insertEmergencyAlertSchema.parse(req.body);
      const alert = await storage.createEmergencyAlert(validatedData);
      
      // Trigger emergency protocol
      await triggerEmergencyProtocol(alert);
      
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Failed to create emergency alert" });
    }
  });

  app.get("/api/emergency-alerts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const alerts = await storage.getEmergencyAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emergency alerts" });
    }
  });

  app.patch("/api/emergency-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const alert = await storage.updateEmergencyAlert(id, updates);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Community alerts routes
  app.get("/api/community-alerts", async (req, res) => {
    try {
      const { lat, lng, radius = 5000 } = req.query;
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = parseInt(radius as string);
      
      const alerts = await storage.getCommunityAlerts(latitude, longitude, searchRadius);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get community alerts" });
    }
  });

  app.post("/api/community-alerts", async (req, res) => {
    try {
      const validatedData = insertCommunityAlertSchema.parse(req.body);
      const alert = await storage.createCommunityAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ message: "Failed to create community alert" });
    }
  });

  // Safe zones routes
  app.get("/api/safe-zones/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const zones = await storage.getSafeZones(userId);
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to get safe zones" });
    }
  });

  app.post("/api/safe-zones", async (req, res) => {
    try {
      const validatedData = insertSafeZoneSchema.parse(req.body);
      const zone = await storage.createSafeZone(validatedData);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ message: "Failed to create safe zone" });
    }
  });

  // SMS and emergency services simulation
  app.post("/api/send-sms", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      // In production, integrate with Twilio or similar SMS service
      // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      // await twilioClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // });
      
      console.log(`SMS sent to ${phoneNumber}: ${message}`);
      res.json({ success: true, message: "SMS sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  // Emergency protocol trigger
  async function triggerEmergencyProtocol(alert: any) {
    try {
      // Get user and emergency contacts
      const user = await storage.getUser(alert.userId);
      if (!user) return;

      const contacts = await storage.getEmergencyContacts(alert.userId);
      
      // Prepare emergency message
      const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\n${user.emergencyMessage}\n\nLocation: ${alert.address || 'Location unavailable'}\nTime: ${new Date().toLocaleString()}\n\nThis message was sent automatically by Sakhi Suraksha app.`;
      
      // Send SMS to all emergency contacts
      for (const contact of contacts) {
        if (contact.isActive) {
          // Simulate SMS sending (replace with actual Twilio integration)
          console.log(`Emergency SMS sent to ${contact.name} (${contact.phoneNumber}): ${emergencyMessage}`);
        }
      }

      // Update user location sharing status
      await storage.updateUser(alert.userId, { isLocationSharingActive: true });
      
    } catch (error) {
      console.error("Failed to trigger emergency protocol:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
