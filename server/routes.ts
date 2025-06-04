import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateOTP, sendSMSOTP, sendEmailOTP, sendWhatsAppMessage } from "./otpService";
import { WebSocketServer } from 'ws';
import { 
  insertEmergencyContactSchema, 
  insertEmergencyAlertSchema,
  insertCommunityAlertSchema,
  insertSafeZoneSchema,
  insertLiveStreamSchema,
  insertDestinationSchema,
  insertIotDeviceSchema,
  insertHealthMetricSchema,
  insertStressAnalysisSchema,
  insertOtpVerificationSchema,
  upsertUserSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile management routes
  app.post('/api/user/profile', async (req, res) => {
    try {
      // Get userId from query parameter to match GET endpoint
      const userId = req.query.userId || 'demo-user';
      const profileData = { ...req.body, id: userId };
      const validatedData = upsertUserSchema.parse(profileData);
      
      const user = await storage.upsertUser(validatedData);
      
      // Return the user's actual ID in case it switched to an existing user
      res.json({ 
        message: "Profile saved successfully", 
        user,
        actualUserId: user.id // Include the actual user ID for frontend session management
      });
    } catch (error) {
      console.error('Profile save error:', error);
      res.status(400).json({ message: "Failed to save profile" });
    }
  });

  app.get('/api/user/profile', async (req, res) => {
    try {
      // Extract userId from query parameter (set by frontend)
      const userId = req.query.userId || 'demo-user';
      
      const user = await storage.getUser(userId as string);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "Profile not found" });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Google Places API endpoint for nearby safety points
  app.get("/api/places/nearby", async (req, res) => {
    try {
      const { lat, lng, type, radius = 5000 } = req.query;
      
      if (!lat || !lng || !type) {
        return res.status(400).json({ error: "Missing required parameters: lat, lng, type" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      // Use Google Places Nearby Search API with type filter for better accuracy
      let placesUrl;
      
      // Map keywords to Google Places types for better results
      const typeMapping: { [key: string]: string } = {
        'police station': 'police',
        'hospital': 'hospital',
        'metro station': 'subway_station',
        'shopping mall': 'shopping_mall'
      };
      
      const placeType = typeMapping[type as string];
      
      if (placeType) {
        placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${placeType}&key=${apiKey}`;
      } else {
        placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(type as string)}&key=${apiKey}`;
      }
      
      const response = await fetch(placesUrl);
      const data = await response.json();

      if (data.status === 'OK') {
        res.json(data);
      } else {
        console.error('Places API error:', data.status, data.error_message);
        res.status(500).json({ error: `Places API error: ${data.status}` });
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      res.status(500).json({ error: "Failed to fetch nearby places" });
    }
  });

  // Google Places Text Search API endpoint for specific locations
  app.get("/api/places/search", async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: "Missing required parameter: query" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      // Use Google Places Text Search API for finding specific locations
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query as string)}&key=${apiKey}`;
      
      const response = await fetch(placesUrl);
      const data = await response.json();

      if (data.status === 'OK') {
        res.json(data);
      } else {
        console.error('Places Text Search API error:', data.status, data.error_message);
        res.status(500).json({ error: `Places API error: ${data.status}` });
      }
    } catch (error) {
      console.error('Error searching places:', error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

  // User routes
  app.patch("/api/user/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
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

  // Emergency contacts routes (for permanent data storage)
  app.get("/api/emergency-contacts", async (req, res) => {
    try {
      // Get userId from query parameter (sent by frontend session management)
      const userId = req.query.userId || 'demo-user';
      
      const contacts = await storage.getEmergencyContacts(userId as string);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      res.status(500).json({ message: "Failed to get emergency contacts" });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      console.log('POST /api/emergency-contacts - Request body:', JSON.stringify(req.body, null, 2));
      
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user && 'id' in req.user) {
        userId = req.user.id as string;
      }

      console.log('Using userId:', userId);

      // Ensure demo user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        console.log('Creating demo user...');
        await storage.upsertUser({
          id: userId,
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User'
        });
      }

      const contactData = {
        ...req.body,
        userId: userId
      };

      console.log('Contact data before validation:', JSON.stringify(contactData, null, 2));

      const validatedData = insertEmergencyContactSchema.parse(contactData);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));
      
      const contact = await storage.createEmergencyContact(validatedData);
      console.log('Created contact:', JSON.stringify(contact, null, 2));
      
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating emergency contact:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      res.status(400).json({ 
        message: "Failed to create emergency contact",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Emergency contacts routes


  // Emergency alerts routes (no authentication required for emergency situations)
  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const validatedData = insertEmergencyAlertSchema.parse(req.body);
      const alert = await storage.createEmergencyAlert(validatedData);
      
      // Trigger emergency protocol with live streaming
      await triggerEmergencyProtocol(alert);
      
      res.status(201).json(alert);
    } catch (error) {
      console.error('Emergency alert error:', error);
      res.status(400).json({ message: "Failed to create emergency alert" });
    }
  });

  app.get("/api/emergency-alerts/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const alerts = await storage.getEmergencyAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emergency alerts" });
    }
  });

  app.patch("/api/emergency-alerts/:id", isAuthenticated, async (req, res) => {
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
      console.error('Community alert creation error:', error);
      res.status(400).json({ message: "Failed to create community alert" });
    }
  });

  // Safety issue reporting endpoint (accepts both authenticated and anonymous reports)
  app.post("/api/safety-reports", async (req, res) => {
    try {
      const { type, description, location, severity = 'medium' } = req.body;
      
      // Get user ID if authenticated, otherwise null for anonymous
      const userId = req.isAuthenticated() ? req.user?.claims?.sub : null;
      const reportedBy = userId ? 'user' : 'anonymous';
      
      // Convert safety report to community alert format
      const communityAlert = {
        userId: userId,
        type: type || 'safety_issue',
        description: description || 'Safety concern reported',
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        severity: severity,
        verified: false,
        reportedBy: reportedBy
      };

      const validatedData = insertCommunityAlertSchema.parse(communityAlert);
      const alert = await storage.createCommunityAlert(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "Safety report submitted successfully",
        alertId: alert.id 
      });
    } catch (error) {
      console.error('Safety report error:', error);
      res.status(400).json({ 
        success: false, 
        message: "Failed to submit safety report" 
      });
    }
  });

  // Safe zones routes
  app.get("/api/safe-zones/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const zones = await storage.getSafeZones(userId);
      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: "Failed to get safe zones" });
    }
  });

  app.post("/api/safe-zones", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSafeZoneSchema.parse(req.body);
      const zone = await storage.createSafeZone(validatedData);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ message: "Failed to create safe zone" });
    }
  });

  // Destinations routes for safe routing (permanent storage)
  app.get("/api/destinations", async (req, res) => {
    try {
      let userId = 'anonymous';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }
      
      const destinations = await storage.getDestinations(userId);
      res.json(destinations);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      res.status(500).json({ message: "Failed to get destinations" });
    }
  });

  app.post("/api/destinations", async (req, res) => {
    try {
      let userId = 'anonymous';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const destinationData = {
        ...req.body,
        userId: userId
      };

      const validatedData = insertDestinationSchema.parse(destinationData);
      const destination = await storage.createDestination(validatedData);
      res.status(201).json(destination);
    } catch (error) {
      console.error('Error creating destination:', error);
      res.status(400).json({ message: "Failed to create destination" });
    }
  });

  app.delete("/api/destinations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDestination(id);
      if (!deleted) {
        return res.status(404).json({ message: "Destination not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete destination" });
    }
  });

  // Home location storage endpoints
  app.post("/api/user/home-location", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      // Ensure demo user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        await storage.upsertUser({
          id: userId,
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User'
        });
      }

      const { latitude, longitude, address } = req.body;
      
      // Store as a destination marked as favorite (home)
      const homeDestination = {
        userId: userId,
        name: 'Home',
        latitude: latitude,
        longitude: longitude,
        address: address || `${latitude}, ${longitude}`,
        isFavorite: true
      };

      const validatedData = insertDestinationSchema.parse(homeDestination);
      const destination = await storage.createDestination(validatedData);
      res.status(201).json(destination);
    } catch (error) {
      console.error('Error saving home location:', error);
      res.status(400).json({ message: "Failed to save home location" });
    }
  });

  app.get("/api/user/home-location", async (req, res) => {
    try {
      // Get userId from query parameter (sent by frontend session management)
      const userId = req.query.userId || 'demo-user';
      
      const destinations = await storage.getDestinations(userId);
      const homeLocation = destinations.find(dest => dest.isFavorite === true);
      
      if (homeLocation) {
        res.json(homeLocation);
      } else {
        res.status(404).json({ message: "Home location not set" });
      }
    } catch (error) {
      console.error('Error fetching home location:', error);
      res.status(500).json({ message: "Failed to get home location" });
    }
  });

  // Live streaming routes
  app.post("/api/live-streams", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLiveStreamSchema.parse(req.body);
      const stream = await storage.createLiveStream(validatedData);
      res.status(201).json(stream);
    } catch (error) {
      res.status(400).json({ message: "Failed to create live stream" });
    }
  });

  app.get("/api/live-streams/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const streams = await storage.getLiveStreams(userId);
      res.json(streams);
    } catch (error) {
      res.status(500).json({ message: "Failed to get live streams" });
    }
  });

  app.patch("/api/live-streams/:id/end", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ended = await storage.endLiveStream(id);
      if (!ended) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json({ message: "Stream ended successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to end stream" });
    }
  });

  // OTP verification endpoints
  app.post("/api/auth/send-phone-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await storage.createOtpVerification({
        identifier: phoneNumber,
        type: 'phone',
        otp,
        expiresAt
      });

      // In a real implementation, you would send SMS via Twilio or similar service
      console.log(`SMS OTP for ${phoneNumber}: ${otp}`);
      
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending phone OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/send-email-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await storage.createOtpVerification({
        identifier: email,
        type: 'email',
        otp,
        expiresAt
      });

      // Send OTP via SMTP2GO email service
      const otpMessage = `Your Sakhi Suraksha verification code is: ${otp}. This code will expire in 10 minutes.`;
      const emailSent = await sendEmailOTP(email, otpMessage);
      
      console.log(`Email OTP for ${email}: ${otp}`);
      
      if (emailSent) {
        res.json({ message: "OTP sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send OTP email" });
      }
    } catch (error) {
      console.error("Error sending email OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-phone-otp", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;
      
      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      const isValid = await storage.verifyOtp(phoneNumber, 'phone', otp);
      
      if (isValid) {
        res.json({ message: "Phone number verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } catch (error) {
      console.error("Error verifying phone OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/verify-email-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      const isValid = await storage.verifyOtp(email, 'email', otp);
      
      if (isValid) {
        res.json({ message: "Email verified successfully" });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } catch (error) {
      console.error("Error verifying email OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
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

  // IoT Device Management Routes
  app.get("/api/iot-devices", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const devices = await storage.getIotDevices(userId);
      res.json(devices);
    } catch (error) {
      console.error('Error fetching IoT devices:', error);
      res.status(500).json({ message: "Failed to get IoT devices" });
    }
  });

  app.post("/api/iot-devices", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      // Ensure demo user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        await storage.upsertUser({
          id: userId,
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User'
        });
      }

      const deviceData = {
        ...req.body,
        userId: userId
      };

      const validatedData = insertIotDeviceSchema.parse(deviceData);
      const device = await storage.createIotDevice(validatedData);
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating IoT device:', error);
      res.status(400).json({ message: "Failed to create IoT device" });
    }
  });

  app.post("/api/iot-devices/:id/connect", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const success = await storage.connectDevice(deviceId);
      
      if (success) {
        res.json({ message: "Device connected successfully" });
      } else {
        res.status(404).json({ message: "Device not found" });
      }
    } catch (error) {
      console.error('Error connecting device:', error);
      res.status(500).json({ message: "Failed to connect device" });
    }
  });

  app.post("/api/iot-devices/:id/disconnect", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const success = await storage.disconnectDevice(deviceId);
      
      if (success) {
        res.json({ message: "Device disconnected successfully" });
      } else {
        res.status(404).json({ message: "Device not found" });
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
      res.status(500).json({ message: "Failed to disconnect device" });
    }
  });

  app.delete("/api/iot-devices/:id", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      const success = await storage.deleteIotDevice(deviceId);
      
      if (success) {
        res.json({ message: "Device deleted successfully" });
      } else {
        res.status(404).json({ message: "Device not found" });
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Health Metrics Routes
  app.get("/api/health-metrics", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const metrics = await storage.getHealthMetrics(userId, limit);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      res.status(500).json({ message: "Failed to get health metrics" });
    }
  });

  app.post("/api/health-metrics", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const metricData = {
        ...req.body,
        userId: userId
      };

      const validatedData = insertHealthMetricSchema.parse(metricData);
      const metric = await storage.createHealthMetric(validatedData);
      res.status(201).json(metric);
    } catch (error) {
      console.error('Error creating health metric:', error);
      res.status(400).json({ message: "Failed to create health metric" });
    }
  });

  // Stress Analysis Routes
  app.get("/api/stress-analysis", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const analysis = await storage.getStressAnalysis(userId, limit);
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching stress analysis:', error);
      res.status(500).json({ message: "Failed to get stress analysis" });
    }
  });

  app.post("/api/stress-analysis", async (req, res) => {
    try {
      let userId = 'demo-user';
      if (req.isAuthenticated() && req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      }

      const analysisData = {
        ...req.body,
        userId: userId
      };

      const validatedData = insertStressAnalysisSchema.parse(analysisData);
      const analysis = await storage.createStressAnalysis(validatedData);
      res.status(201).json(analysis);
    } catch (error) {
      console.error('Error creating stress analysis:', error);
      res.status(400).json({ message: "Failed to create stress analysis" });
    }
  });

  // Emergency protocol trigger with live streaming
  async function triggerEmergencyProtocol(alert: any) {
    try {
      // Get user and emergency contacts
      const user = await storage.getUser(alert.userId);
      if (!user) return;

      const contacts = await storage.getEmergencyContacts(alert.userId);
      
      // Create live stream session
      const streamUrl = `wss://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}/ws/stream/${alert.id}`;
      const shareLink = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}/emergency/${alert.id}`;
      
      const liveStream = await storage.createLiveStream({
        userId: alert.userId,
        emergencyAlertId: alert.id,
        streamUrl,
        shareLink,
        isActive: true
      });

      // Prepare emergency message with live stream link
      const emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\n${user.emergencyMessage}\n\nLocation: ${alert.address || 'Location unavailable'}\nTime: ${new Date().toLocaleString()}\n\nLive Stream: ${shareLink}\n\nThis message was sent automatically by Sakhi Suraksha app.`;
      
      // Send SMS to all emergency contacts
      for (const contact of contacts) {
        if (contact.isActive) {
          // Simulate SMS sending (replace with actual Twilio integration)
          console.log(`Emergency SMS sent to ${contact.name} (${contact.phoneNumber}): ${emergencyMessage}`);
        }
      }

      // Update user location sharing status
      await storage.updateUser(alert.userId, { isLocationSharingActive: true });
      
      // Broadcast to WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'emergency_alert',
            data: { alert, liveStream, user: { id: user.id, firstName: user.firstName } }
          }));
        }
      });
      
    } catch (error) {
      console.error("Failed to trigger emergency protocol:", error);
    }
  }

  const httpServer = createServer(app);
  
  // WebSocket server for live streaming and real-time communication
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'emergency_stream':
            // Broadcast emergency stream to all connected clients
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify(data));
              }
            });
            break;
          
          case 'location_update':
            // Broadcast location updates during emergency
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify(data));
              }
            });
            break;
            
          case 'join_stream':
            // Handle joining emergency stream
            ws.send(JSON.stringify({
              type: 'stream_joined',
              message: 'Connected to emergency stream'
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // OTP Verification Routes
  app.post('/api/otp/send', async (req, res) => {
    try {
      const { identifier, type } = req.body; // identifier = phone or email, type = 'phone' or 'email'
      
      if (!identifier || !type) {
        return res.status(400).json({ message: "Identifier and type are required" });
      }

      const otp = generateOTP();
      
      // Store OTP in database
      await storage.createOtpVerification({
        identifier,
        type,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      let success = false;
      
      if (type === 'phone') {
        success = await sendSMSOTP(identifier, otp);
      } else if (type === 'email') {
        success = await sendEmailOTP(identifier, otp);
      }

      if (success) {
        res.json({ message: "OTP sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send OTP" });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post('/api/otp/verify', async (req, res) => {
    try {
      const { identifier, type, otp } = req.body;
      
      if (!identifier || !type || !otp) {
        return res.status(400).json({ message: "Identifier, type, and OTP are required" });
      }

      const isValid = await storage.verifyOtp(identifier, type, otp);
      
      if (isValid) {
        res.json({ message: "OTP verified successfully", verified: true });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP", verified: false });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Test OTP delivery route for debugging
  app.post('/api/otp/test', async (req, res) => {
    try {
      const { type, identifier } = req.body;
      const testOtp = "123456";
      
      console.log(`Testing ${type} OTP delivery to ${identifier}`);
      
      let result = false;
      if (type === 'phone') {
        result = await sendSMSOTP(identifier, testOtp);
      } else if (type === 'email') {
        result = await sendEmailOTP(identifier, testOtp);
      }
      
      res.json({ 
        success: result, 
        message: result ? `Test OTP sent successfully` : `Failed to send test OTP`,
        testOtp 
      });
    } catch (error) {
      console.error('Test OTP error:', error);
      res.status(500).json({ message: "Test failed", error: error.message });
    }
  });

  // Voice distress emergency trigger
  app.post('/api/emergency-alert/voice-trigger', async (req, res) => {
    try {
      const { triggerType, keyword, confidence, location } = req.body;
      
      console.log(`Voice distress detected: "${keyword}" with ${confidence} confidence`);
      
      // Get user's emergency contacts
      const contacts = await storage.getEmergencyContacts('demo-user');
      
      if (contacts.length === 0) {
        return res.status(400).json({ message: 'No emergency contacts configured' });
      }
      
      // Create emergency alert record
      const alert = await storage.createEmergencyAlert({
        userId: 'demo-user',
        triggerType: `voice_distress_${keyword}`,
        latitude: location.lat,
        longitude: location.lng,
        address: location.address
      });
      
      // Enhanced message for voice distress
      const baseMessage = `🚨 VOICE DISTRESS EMERGENCY 🚨
AUTOMATED ALERT - Voice keyword "${keyword}" detected
Confidence: ${Math.round(confidence * 100)}%
Time: ${new Date().toLocaleString()}
Location: ${location.address}
Live Location: https://maps.google.com/maps?q=${location.lat},${location.lng}

This is an automated emergency alert from Sakhi Suraksha app.
Please contact immediately or call emergency services: 100, 101, 102, 108`;

      // Send alerts to all contacts
      const alertPromises = contacts.map(async (contact) => {
        const message = baseMessage.replace('[CONTACT_NAME]', contact.name);
        
        let smsSuccess = false;
        let whatsappSuccess = false;
        let emailSuccess = false;
        
        // Send SMS if phone number exists
        if (contact.phoneNumber) {
          try {
            smsSuccess = await sendSMSOTP(contact.phoneNumber, message);
            console.log(`Voice Alert SMS to ${contact.phoneNumber}: ${smsSuccess ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.error(`Voice Alert SMS error for ${contact.phoneNumber}:`, error);
          }
        }
        
        // Send WhatsApp if phone number exists
        if (contact.phoneNumber) {
          try {
            whatsappSuccess = await sendWhatsAppMessage(contact.phoneNumber, message);
            console.log(`Voice Alert WhatsApp to ${contact.phoneNumber}: ${whatsappSuccess ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.error(`Voice Alert WhatsApp error for ${contact.phoneNumber}:`, error);
          }
        }
        
        // Send email if email exists
        if (contact.email) {
          try {
            emailSuccess = await sendEmailOTP(contact.email, message);
            console.log(`Voice Alert Email to ${contact.email}: ${emailSuccess ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.error(`Voice Alert Email error for ${contact.email}:`, error);
          }
        }
        
        return { contact: contact.name, smsSuccess, whatsappSuccess, emailSuccess };
      });
      
      const results = await Promise.allSettled(alertPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      res.json({
        success: successCount > 0,
        alertsSent: successCount,
        totalContacts: contacts.length,
        keyword,
        confidence,
        message: `Voice distress alert sent to ${successCount}/${contacts.length} contacts`
      });
      
    } catch (error) {
      console.error('Voice distress alert error:', error);
      res.status(500).json({ message: 'Failed to process voice distress alert' });
    }
  });

  // Emergency alert sending endpoint
  app.post('/api/emergency/send-alert', async (req, res) => {
    try {
      const { contactId, contactName, phoneNumber, email, message, emergencyData } = req.body;
      
      console.log(`Sending emergency alert to ${contactName}...`);
      
      let smsSuccess = false;
      let whatsappSuccess = false;
      let emailSuccess = false;
      
      // Send SMS if phone number exists
      if (phoneNumber) {
        try {
          smsSuccess = await sendSMSOTP(phoneNumber, message);
          console.log(`SMS to ${phoneNumber}: ${smsSuccess ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
          console.error(`SMS error for ${phoneNumber}:`, error);
        }
      }
      
      // Send WhatsApp if phone number exists
      if (phoneNumber) {
        try {
          whatsappSuccess = await sendWhatsAppMessage(phoneNumber, message);
          console.log(`WhatsApp to ${phoneNumber}: ${whatsappSuccess ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
          console.error(`WhatsApp error for ${phoneNumber}:`, error);
        }
      }
      
      // Send email if email exists
      if (email) {
        try {
          emailSuccess = await sendEmailOTP(email, message);
          console.log(`Email to ${email}: ${emailSuccess ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
          console.error(`Email error for ${email}:`, error);
        }
      }
      
      // Save emergency alert record
      try {
        await storage.createEmergencyAlert({
          userId: 'demo-user', // Use actual user ID in production
          triggerType: emergencyData.triggerType,
          latitude: emergencyData.location.lat,
          longitude: emergencyData.location.lng,
          address: emergencyData.location.address
        });
      } catch (error) {
        console.error('Failed to save emergency alert:', error);
      }
      
      const success = smsSuccess || whatsappSuccess || emailSuccess;
      res.json({
        success,
        smsSuccess,
        whatsappSuccess,
        emailSuccess,
        message: success ? 'Emergency alert sent successfully' : 'Failed to send emergency alert'
      });
      
    } catch (error) {
      console.error('Emergency alert error:', error);
      res.status(500).json({ message: 'Failed to send emergency alert' });
    }
  });

  // Test SMS and Email services
  app.post('/api/test-services', async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      
      const testMessage = "Test message from Sakhi Suraksha emergency system. This is a connectivity test.";
      
      let smsResult = { success: false, error: null };
      let emailResult = { success: false, error: null };
      
      // Test SMS if phone number provided
      if (phoneNumber) {
        try {
          smsResult.success = await sendSMSOTP(phoneNumber, testMessage);
        } catch (error) {
          smsResult.error = error.message;
        }
      }
      
      // Test Email if email provided
      if (email) {
        try {
          emailResult.success = await sendEmailOTP(email, testMessage);
        } catch (error) {
          emailResult.error = error.message;
        }
      }
      
      res.json({
        sms: smsResult,
        email: emailResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Service test error:', error);
      res.status(500).json({ message: 'Service test failed', error: error.message });
    }
  });

  // Get live stream by ID for viewing with user details
  app.get('/api/live-stream/:id', async (req, res) => {
    try {
      const streamId = parseInt(req.params.id);
      const stream = await storage.getLiveStreamById(streamId);
      
      if (!stream) {
        return res.status(404).json({ message: 'Stream not found' });
      }

      // Get user details for the stream
      const user = await storage.getUser(stream.userId);
      const streamWithUserDetails = {
        ...stream,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User',
        userEmail: user?.email || 'user@example.com'
      };

      res.json(streamWithUserDetails);
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({ message: 'Failed to fetch stream' });
    }
  });

  // Live streaming endpoints
  app.post('/api/live-stream/start', async (req, res) => {
    try {
      const { streamUrl, shareableLink, isEmergency } = req.body;

      // Create live stream record
      const stream = await storage.createLiveStream({
        userId: 'demo-user',
        streamUrl,
        shareLink: shareableLink,
        isActive: true
      });
      
      // If emergency mode, automatically share with contacts
      if (isEmergency) {
        const contacts = await storage.getEmergencyContacts('demo-user');
        
        const emergencyMessage = `🔴 EMERGENCY LIVE STREAM
Watch live: ${shareableLink}
This is an active emergency situation. Please monitor or contact immediately.
Time: ${new Date().toLocaleString()}

This message was sent automatically by Sakhi Suraksha app.`;

        // Send stream link to all emergency contacts
        contacts.forEach(async (contact) => {
          if (contact.phoneNumber) {
            try {
              await sendSMSOTP(contact.phoneNumber, emergencyMessage);
              console.log(`Emergency stream SMS sent to ${contact.name}: SUCCESS`);
            } catch (error) {
              console.error(`Emergency stream SMS error for ${contact.name}:`, error);
            }
          }
          
          if (contact.email) {
            try {
              await sendEmailOTP(contact.email, emergencyMessage);
              console.log(`Emergency stream Email sent to ${contact.name}: SUCCESS`);
            } catch (error) {
              console.error(`Emergency stream Email error for ${contact.name}:`, error);
            }
          }
        });
      }
      
      res.json({
        success: true,
        streamId: stream.id,
        shareableLink: stream.shareLink,
        viewerCount: 0,
        message: isEmergency ? 'Emergency stream started and shared with contacts' : 'Live stream started successfully'
      });
      
    } catch (error) {
      console.error('Live stream start error:', error);
      res.status(500).json({ message: 'Failed to start live stream' });
    }
  });

  app.post('/api/live-stream/end', async (req, res) => {
    try {
      const { streamUrl } = req.body;
      
      // Find and end the stream
      const streams = await storage.getLiveStreams('demo-user');
      const activeStream = streams.find(s => s.streamUrl === streamUrl && s.isActive);
      
      if (activeStream) {
        await storage.endLiveStream(activeStream.id);
      }
      
      res.json({
        success: true,
        message: 'Live stream ended successfully'
      });
      
    } catch (error) {
      console.error('Live stream end error:', error);
      res.status(500).json({ message: 'Failed to end live stream' });
    }
  });

  app.post('/api/emergency/share-stream', async (req, res) => {
    try {
      const { shareableLink, message } = req.body;
      
      // Get emergency contacts
      const contacts = await storage.getEmergencyContacts('demo-user');
      
      if (contacts.length === 0) {
        return res.status(400).json({ message: 'No emergency contacts configured' });
      }
      
      // Send stream link to all contacts
      const alertPromises = contacts.map(async (contact) => {
        let smsSuccess = false;
        let emailSuccess = false;
        
        if (contact.phoneNumber) {
          try {
            smsSuccess = await sendSMSOTP(contact.phoneNumber, message);
            console.log(`Stream share SMS to ${contact.name}: ${smsSuccess ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.error(`Stream share SMS error for ${contact.name}:`, error);
          }
        }
        
        if (contact.email) {
          try {
            emailSuccess = await sendEmailOTP(contact.email, message);
            console.log(`Stream share Email to ${contact.name}: ${emailSuccess ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            console.error(`Stream share Email error for ${contact.name}:`, error);
          }
        }
        
        return { contact: contact.name, smsSuccess, emailSuccess };
      });
      
      const results = await Promise.allSettled(alertPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      res.json({
        success: successCount > 0,
        alertsSent: successCount,
        totalContacts: contacts.length,
        message: `Stream link shared with ${successCount}/${contacts.length} contacts`
      });
      
    } catch (error) {
      console.error('Stream share error:', error);
      res.status(500).json({ message: 'Failed to share stream link' });
    }
  });

  // Clean up expired OTPs periodically
  setInterval(async () => {
    try {
      await storage.cleanupExpiredOtps();
    } catch (error) {
      console.error('OTP cleanup error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  return httpServer;
}
