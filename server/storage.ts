import { 
  users, 
  emergencyContacts, 
  emergencyAlerts, 
  communityAlerts, 
  safeZones,
  type User, 
  type InsertUser,
  type EmergencyContact,
  type InsertEmergencyContact,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type CommunityAlert,
  type InsertCommunityAlert,
  type SafeZone,
  type InsertSafeZone
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Emergency contacts operations
  getEmergencyContacts(userId: number): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(id: number): Promise<boolean>;

  // Emergency alerts operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getEmergencyAlerts(userId: number): Promise<EmergencyAlert[]>;
  updateEmergencyAlert(id: number, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined>;

  // Community alerts operations
  getCommunityAlerts(latitude: number, longitude: number, radius: number): Promise<CommunityAlert[]>;
  createCommunityAlert(alert: InsertCommunityAlert): Promise<CommunityAlert>;
  
  // Safe zones operations
  getSafeZones(userId: number): Promise<SafeZone[]>;
  createSafeZone(zone: InsertSafeZone): Promise<SafeZone>;
  deleteSafeZone(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private emergencyContacts: Map<number, EmergencyContact>;
  private emergencyAlerts: Map<number, EmergencyAlert>;
  private communityAlerts: Map<number, CommunityAlert>;
  private safeZones: Map<number, SafeZone>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.emergencyContacts = new Map();
    this.emergencyAlerts = new Map();
    this.communityAlerts = new Map();
    this.safeZones = new Map();
    this.currentId = 1;

    // Add default demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "demo",
      password: "demo123",
      phoneNumber: "+919876543210",
      emergencyMessage: "Emergency! I need help. This is an automated message from Sakhi Suraksha.",
      isLocationSharingActive: false,
      createdAt: new Date()
    };
    this.users.set(1, demoUser);

    // Add demo emergency contacts
    const contacts: EmergencyContact[] = [
      {
        id: 1,
        userId: 1,
        name: "Mom",
        phoneNumber: "+919876543211",
        relationship: "Mother",
        isPrimary: true,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        name: "Best Friend",
        phoneNumber: "+919876543212",
        relationship: "Friend",
        isPrimary: false,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 3,
        userId: 1,
        name: "Brother",
        phoneNumber: "+919876543213",
        relationship: "Sibling",
        isPrimary: false,
        isActive: true,
        createdAt: new Date()
      }
    ];

    contacts.forEach(contact => this.emergencyContacts.set(contact.id, contact));

    // Add demo community alerts
    const communityAlert: CommunityAlert = {
      id: 1,
      userId: 1,
      alertType: "suspicious_activity",
      description: "Suspicious activity reported near Metro Station",
      latitude: 28.6139,
      longitude: 77.2090,
      address: "Connaught Place Metro Station, New Delhi",
      isVerified: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };
    this.communityAlerts.set(1, communityAlert);

    // Add demo safe zone
    const safeZone: SafeZone = {
      id: 1,
      userId: 1,
      name: "Home",
      latitude: 28.6129,
      longitude: 77.2295,
      radius: 500,
      isActive: true,
      createdAt: new Date()
    };
    this.safeZones.set(1, safeZone);

    this.currentId = 10; // Start new IDs from 10
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getEmergencyContacts(userId: number): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values()).filter(contact => 
      contact.userId === userId && contact.isActive
    );
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = this.currentId++;
    const newContact: EmergencyContact = {
      ...contact,
      id,
      createdAt: new Date()
    };
    this.emergencyContacts.set(id, newContact);
    return newContact;
  }

  async updateEmergencyContact(id: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const contact = this.emergencyContacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...updates };
    this.emergencyContacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteEmergencyContact(id: number): Promise<boolean> {
    return this.emergencyContacts.delete(id);
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const id = this.currentId++;
    const newAlert: EmergencyAlert = {
      ...alert,
      id,
      createdAt: new Date()
    };
    this.emergencyAlerts.set(id, newAlert);
    return newAlert;
  }

  async getEmergencyAlerts(userId: number): Promise<EmergencyAlert[]> {
    return Array.from(this.emergencyAlerts.values()).filter(alert => alert.userId === userId);
  }

  async updateEmergencyAlert(id: number, updates: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | undefined> {
    const alert = this.emergencyAlerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, ...updates };
    this.emergencyAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async getCommunityAlerts(latitude: number, longitude: number, radius: number): Promise<CommunityAlert[]> {
    return Array.from(this.communityAlerts.values()).filter(alert => {
      const distance = this.calculateDistance(latitude, longitude, alert.latitude, alert.longitude);
      return distance <= radius;
    });
  }

  async createCommunityAlert(alert: InsertCommunityAlert): Promise<CommunityAlert> {
    const id = this.currentId++;
    const newAlert: CommunityAlert = {
      ...alert,
      id,
      createdAt: new Date()
    };
    this.communityAlerts.set(id, newAlert);
    return newAlert;
  }

  async getSafeZones(userId: number): Promise<SafeZone[]> {
    return Array.from(this.safeZones.values()).filter(zone => 
      zone.userId === userId && zone.isActive
    );
  }

  async createSafeZone(zone: InsertSafeZone): Promise<SafeZone> {
    const id = this.currentId++;
    const newZone: SafeZone = {
      ...zone,
      id,
      createdAt: new Date()
    };
    this.safeZones.set(id, newZone);
    return newZone;
  }

  async deleteSafeZone(id: number): Promise<boolean> {
    return this.safeZones.delete(id);
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

export const storage = new MemStorage();
