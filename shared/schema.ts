import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: text("phone_number"),
  emergencyMessage: text("emergency_message").default("Emergency! I need help. This is an automated message from Sakhi Suraksha."),
  isLocationSharingActive: boolean("is_location_sharing_active").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  relationship: text("relationship"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  triggerType: text("trigger_type").notNull(), // 'button', 'voice', 'shake'
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  audioRecordingUrl: text("audio_recording_url"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const communityAlerts = pgTable("community_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  alertType: text("alert_type").notNull(), // 'suspicious_activity', 'harassment', 'danger_zone'
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const safeZones = pgTable("safe_zones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radius: real("radius").notNull(), // in meters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true
});

export const insertCommunityAlertSchema = createInsertSchema(communityAlerts).omit({
  id: true,
  createdAt: true
});

export const insertSafeZoneSchema = createInsertSchema(safeZones).omit({
  id: true,
  createdAt: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type CommunityAlert = typeof communityAlerts.$inferSelect;
export type InsertCommunityAlert = z.infer<typeof insertCommunityAlertSchema>;
export type SafeZone = typeof safeZones.$inferSelect;
export type InsertSafeZone = z.infer<typeof insertSafeZoneSchema>;
