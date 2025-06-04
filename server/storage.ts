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
  type InsertOtpVerification
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
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
