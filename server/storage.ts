import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users,
  emergencyContacts,
  emergencyAlerts,
  communityAlerts,
  safeZones,
  liveStreams,
  destinations,
  homeLocations,
  otpVerifications,
  iotDevices,
  healthMetrics,
  stressAnalysis,
  iotEmergencyTriggers,
  type User,
  type UpsertUser,
  type EmergencyContact,
  type InsertEmergencyContact,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type CommunityAlert,
  type InsertCommunityAlert,
  type SafeZone,
  type InsertSafeZone,
  type LiveStream,
  type InsertLiveStream,
  type Destination,
  type InsertDestination,
  type HomeLocation,
  type InsertHomeLocation,
  type OtpVerification,
  type InsertOtpVerification,
  type IotDevice,
  type InsertIotDevice,
  type HealthMetric,
  type InsertHealthMetric,
  type StressAnalysis,
  type InsertStressAnalysis,
  type IotEmergencyTrigger,
  type InsertIotEmergencyTrigger
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;

  // Emergency contacts operations
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: number): Promise<boolean>;

  // Emergency alerts operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: number, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined>;

  // Community alerts operations
  getCommunityAlerts(latitude: number, longitude: number, radius: number): Promise<CommunityAlert[]>;
  createCommunityAlert(alert: InsertCommunityAlert): Promise<CommunityAlert>;
  
  // Safe zones operations
  getSafeZones(userId: string): Promise<SafeZone[]>;
  createSafeZone(zone: InsertSafeZone): Promise<SafeZone>;
  deleteSafeZone(id: number): Promise<boolean>;

  // Live streaming operations
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  getLiveStreams(userId: string): Promise<LiveStream[]>;
  getLiveStreamById(id: number): Promise<LiveStream | undefined>;
  endLiveStream(id: number): Promise<boolean>;

  // Destinations operations
  getDestinations(userId: string): Promise<Destination[]>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  deleteDestination(id: number): Promise<boolean>;

  // Home location operations
  getHomeLocation(userId: string): Promise<HomeLocation | undefined>;
  setHomeLocation(homeLocation: InsertHomeLocation): Promise<HomeLocation>;
  updateHomeLocation(userId: string, updates: Partial<InsertHomeLocation>): Promise<HomeLocation | undefined>;

  // OTP verification operations
  createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification>;
  verifyOtp(identifier: string, type: string, otp: string): Promise<boolean>;
  cleanupExpiredOtps(): Promise<void>;

  // IoT Device operations
  getIotDevices(userId: string): Promise<IotDevice[]>;
  createIotDevice(device: InsertIotDevice): Promise<IotDevice>;
  updateIotDevice(id: number, updates: Partial<InsertIotDevice>): Promise<IotDevice | undefined>;
  deleteIotDevice(id: number): Promise<boolean>;
  connectDevice(id: number): Promise<boolean>;
  disconnectDevice(id: number): Promise<boolean>;

  // Health Metrics operations
  getHealthMetrics(userId: string, limit?: number): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  getLatestHealthMetrics(userId: string): Promise<HealthMetric | undefined>;

  // Stress Analysis operations
  getStressAnalysis(userId: string, limit?: number): Promise<StressAnalysis[]>;
  createStressAnalysis(analysis: InsertStressAnalysis): Promise<StressAnalysis>;
  getLatestStressAnalysis(userId: string): Promise<StressAnalysis | undefined>;

  // IoT Emergency Triggers operations
  getIotEmergencyTriggers(userId: string): Promise<IotEmergencyTrigger[]>;
  createIotEmergencyTrigger(trigger: InsertIotEmergencyTrigger): Promise<IotEmergencyTrigger>;
  resolveIotEmergencyTrigger(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by ID
    const existingUserById = await this.getUser(userData.id);
    
    if (existingUserById) {
      // User exists by ID, update their data without changing ID
      const updateData = { ...userData };
      delete updateData.id; // Don't update the ID to avoid foreign key issues
      
      const updated = await this.updateUser(userData.id, updateData);
      if (!updated) {
        throw new Error('Failed to update user');
      }
      return updated;
    }
    
    // Check if user exists by email (for email-based lookup)
    if (userData.email) {
      const [existingUserByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUserByEmail) {
        // User exists with this email, update them without changing ID
        const updateData = { ...userData };
        delete updateData.id; // Don't update the ID to avoid foreign key issues
        
        const updated = await this.updateUser(existingUserByEmail.id, updateData);
        if (!updated) {
          throw new Error('Failed to update user');
        }
        return updated;
      }
    }
    
    // User doesn't exist, insert new user
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Emergency contacts operations
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return await db
      .select()
      .from(emergencyContacts)
      .where(and(eq(emergencyContacts.userId, userId), eq(emergencyContacts.isActive, true)));
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [newContact] = await db
      .insert(emergencyContacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateEmergencyContact(id: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const [contact] = await db
      .update(emergencyContacts)
      .set(updates)
      .where(eq(emergencyContacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteEmergencyContact(id: number): Promise<boolean> {
    const result = await db
      .delete(emergencyContacts)
      .where(eq(emergencyContacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Emergency alerts operations
  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [newAlert] = await db
      .insert(emergencyAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]> {
    return await db
      .select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId));
  }

  async updateEmergencyAlert(id: number, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined> {
    const [alert] = await db
      .update(emergencyAlerts)
      .set(updates)
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  // Community alerts operations
  async getCommunityAlerts(latitude: number, longitude: number, radius: number): Promise<CommunityAlert[]> {
    // For now, return all alerts within a reasonable distance
    // In production, this would use PostGIS or similar spatial queries
    const alerts = await db.select().from(communityAlerts);
    return alerts.filter(alert => {
      const distance = this.calculateDistance(latitude, longitude, alert.latitude, alert.longitude);
      return distance <= radius;
    });
  }

  async createCommunityAlert(alert: InsertCommunityAlert): Promise<CommunityAlert> {
    const [newAlert] = await db
      .insert(communityAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  // Safe zones operations
  async getSafeZones(userId: string): Promise<SafeZone[]> {
    return await db
      .select()
      .from(safeZones)
      .where(and(eq(safeZones.userId, userId), eq(safeZones.isActive, true)));
  }

  async createSafeZone(zone: InsertSafeZone): Promise<SafeZone> {
    const [newZone] = await db
      .insert(safeZones)
      .values(zone)
      .returning();
    return newZone;
  }

  async deleteSafeZone(id: number): Promise<boolean> {
    const result = await db
      .delete(safeZones)
      .where(eq(safeZones.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Live streaming operations
  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    const [newStream] = await db
      .insert(liveStreams)
      .values(stream)
      .returning();
    return newStream;
  }

  async getLiveStreamById(id: number): Promise<LiveStream | undefined> {
    const [stream] = await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.id, id));
    return stream;
  }

  async getLiveStreams(userId: string): Promise<LiveStream[]> {
    return await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.userId, userId));
  }

  async endLiveStream(id: number): Promise<boolean> {
    const result = await db
      .update(liveStreams)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(liveStreams.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Destinations operations
  async getDestinations(userId: string): Promise<Destination[]> {
    return await db
      .select()
      .from(destinations)
      .where(eq(destinations.userId, userId));
  }

  async createDestination(destination: InsertDestination): Promise<Destination> {
    const [newDestination] = await db
      .insert(destinations)
      .values(destination)
      .returning();
    return newDestination;
  }

  async deleteDestination(id: number): Promise<boolean> {
    const result = await db
      .delete(destinations)
      .where(eq(destinations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Home location operations
  async getHomeLocation(userId: string): Promise<HomeLocation | undefined> {
    const [homeLocation] = await db.select().from(homeLocations).where(eq(homeLocations.userId, userId));
    return homeLocation;
  }

  async setHomeLocation(homeLocation: InsertHomeLocation): Promise<HomeLocation> {
    const [result] = await db
      .insert(homeLocations)
      .values(homeLocation)
      .onConflictDoUpdate({
        target: homeLocations.userId,
        set: {
          latitude: homeLocation.latitude,
          longitude: homeLocation.longitude,
          address: homeLocation.address,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async updateHomeLocation(userId: string, updates: Partial<InsertHomeLocation>): Promise<HomeLocation | undefined> {
    const [result] = await db
      .update(homeLocations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(homeLocations.userId, userId))
      .returning();
    return result;
  }

  // OTP verification operations
  async createOtpVerification(otp: InsertOtpVerification): Promise<OtpVerification> {
    const [result] = await db
      .insert(otpVerifications)
      .values(otp)
      .returning();
    return result;
  }

  async verifyOtp(identifier: string, type: string, otp: string): Promise<boolean> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.identifier, identifier),
          eq(otpVerifications.type, type),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.isVerified, false)
        )
      );

    if (!verification) {
      return false;
    }

    // Check if OTP is expired
    if (new Date() > verification.expiresAt) {
      return false;
    }

    // Mark as verified
    await db
      .update(otpVerifications)
      .set({ isVerified: true })
      .where(eq(otpVerifications.id, verification.id));

    return true;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(eq(otpVerifications.expiresAt, new Date()));
  }

  // IoT Device operations
  async getIotDevices(userId: string): Promise<IotDevice[]> {
    return await db.select().from(iotDevices).where(eq(iotDevices.userId, userId));
  }

  async createIotDevice(device: InsertIotDevice): Promise<IotDevice> {
    const [newDevice] = await db.insert(iotDevices).values(device).returning();
    return newDevice;
  }

  async updateIotDevice(id: number, updates: Partial<InsertIotDevice>): Promise<IotDevice | undefined> {
    const [device] = await db
      .update(iotDevices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(iotDevices.id, id))
      .returning();
    return device || undefined;
  }

  async deleteIotDevice(id: number): Promise<boolean> {
    const result = await db.delete(iotDevices).where(eq(iotDevices.id, id));
    return result.rowCount > 0;
  }

  async connectDevice(id: number): Promise<boolean> {
    const [device] = await db
      .update(iotDevices)
      .set({ 
        isConnected: true, 
        connectionStatus: 'connected',
        lastConnected: new Date(),
        updatedAt: new Date()
      })
      .where(eq(iotDevices.id, id))
      .returning();
    return !!device;
  }

  async disconnectDevice(id: number): Promise<boolean> {
    const [device] = await db
      .update(iotDevices)
      .set({ 
        isConnected: false, 
        connectionStatus: 'disconnected',
        updatedAt: new Date()
      })
      .where(eq(iotDevices.id, id))
      .returning();
    return !!device;
  }

  // Health Metrics operations
  async getHealthMetrics(userId: string, limit = 100): Promise<HealthMetric[]> {
    return await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(healthMetrics.timestamp)
      .limit(limit);
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newMetric] = await db.insert(healthMetrics).values(metric).returning();
    return newMetric;
  }

  async getLatestHealthMetrics(userId: string): Promise<HealthMetric | undefined> {
    const [metric] = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(healthMetrics.timestamp)
      .limit(1);
    return metric || undefined;
  }

  // Stress Analysis operations
  async getStressAnalysis(userId: string, limit = 50): Promise<StressAnalysis[]> {
    return await db
      .select()
      .from(stressAnalysis)
      .where(eq(stressAnalysis.userId, userId))
      .orderBy(stressAnalysis.analysisTimestamp)
      .limit(limit);
  }

  async createStressAnalysis(analysis: InsertStressAnalysis): Promise<StressAnalysis> {
    const [newAnalysis] = await db.insert(stressAnalysis).values(analysis).returning();
    return newAnalysis;
  }

  async getLatestStressAnalysis(userId: string): Promise<StressAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(stressAnalysis)
      .where(eq(stressAnalysis.userId, userId))
      .orderBy(stressAnalysis.analysisTimestamp)
      .limit(1);
    return analysis || undefined;
  }

  // IoT Emergency Triggers operations
  async getIotEmergencyTriggers(userId: string): Promise<IotEmergencyTrigger[]> {
    return await db
      .select()
      .from(iotEmergencyTriggers)
      .where(eq(iotEmergencyTriggers.userId, userId))
      .orderBy(iotEmergencyTriggers.timestamp);
  }

  async createIotEmergencyTrigger(trigger: InsertIotEmergencyTrigger): Promise<IotEmergencyTrigger> {
    const [newTrigger] = await db.insert(iotEmergencyTriggers).values(trigger).returning();
    return newTrigger;
  }

  async resolveIotEmergencyTrigger(id: number): Promise<boolean> {
    const [trigger] = await db
      .update(iotEmergencyTriggers)
      .set({ isResolved: true })
      .where(eq(iotEmergencyTriggers.id, id))
      .returning();
    return !!trigger;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Distance in meters
  }
}

export const storage = new DatabaseStorage();
