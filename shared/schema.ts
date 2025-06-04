import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced user schema with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: text("phone_number"),
  emergencyMessage: text("emergency_message").default("Emergency! I need help. This is an automated message from Sakhi Suraksha."),
  isLocationSharingActive: boolean("is_location_sharing_active").default(false),
  theme: text("theme").default("light"),
  voiceActivationEnabled: boolean("voice_activation_enabled").default(true),
  shakeDetectionEnabled: boolean("shake_detection_enabled").default(true),
  communityAlertsEnabled: boolean("community_alerts_enabled").default(true),
  soundAlertsEnabled: boolean("sound_alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  relationship: text("relationship"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  triggerType: text("trigger_type").notNull(), // 'button', 'voice', 'shake'
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  audioRecordingUrl: text("audio_recording_url"),
  videoRecordingUrl: text("video_recording_url"),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const communityAlerts = pgTable("community_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Optional for anonymous reports
  type: text("type").notNull(), // 'safety_issue', 'harassment', 'poor_lighting', etc.
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  severity: text("severity").notNull().default("medium"), // 'low', 'medium', 'high'
  verified: boolean("verified").default(false),
  reportedBy: text("reported_by").default("anonymous"),
  createdAt: timestamp("created_at").defaultNow()
});

export const safeZones = pgTable("safe_zones", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  radius: real("radius").notNull(), // in meters
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Live streaming sessions for emergency video sharing
export const liveStreams = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  emergencyAlertId: integer("emergency_alert_id").references(() => emergencyAlerts.id),
  streamUrl: text("stream_url").notNull(),
  shareLink: text("share_link").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at")
});

// Routes and destinations for safe route planning
export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Home locations table
export const homeLocations = pgTable("home_locations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier").notNull(), // phone number or email
  type: varchar("type").notNull(), // 'phone' or 'email'
  otp: varchar("otp").notNull(),
  isVerified: boolean("is_verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// IoT Device Management
export const iotDevices = pgTable("iot_devices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // 'smartwatch', 'fitness_tracker', 'health_monitor'
  macAddress: text("mac_address").unique(),
  bluetoothId: text("bluetooth_id"),
  isConnected: boolean("is_connected").default(false),
  batteryLevel: integer("battery_level"),
  firmwareVersion: text("firmware_version"),
  lastConnected: timestamp("last_connected"),
  connectionStatus: text("connection_status").default("disconnected"), // 'connected', 'disconnected', 'pairing'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Health Monitoring Data
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => iotDevices.id),
  heartRate: integer("heart_rate"), // BPM
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  oxygenSaturation: real("oxygen_saturation"), // SpO2 percentage
  skinTemperature: real("skin_temperature"), // Celsius
  stressLevel: real("stress_level"), // 0-100 scale
  stepCount: integer("step_count"),
  caloriesBurned: real("calories_burned"),
  sleepQuality: real("sleep_quality"), // 0-100 scale
  activityLevel: text("activity_level"), // 'sedentary', 'light', 'moderate', 'vigorous'
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Stress Analysis and AI Predictions
export const stressAnalysis = pgTable("stress_analysis", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  overallStressScore: real("overall_stress_score").notNull(), // 0-100 scale
  heartRateVariability: real("heart_rate_variability"),
  skinConductance: real("skin_conductance"),
  movementPattern: text("movement_pattern"), // 'restless', 'normal', 'lethargic'
  voiceStressIndicators: jsonb("voice_stress_indicators"), // AI analysis results
  behaviorPattern: text("behavior_pattern"), // 'agitated', 'calm', 'anxious'
  riskLevel: text("risk_level").notNull(), // 'low', 'medium', 'high', 'critical'
  recommendedActions: text("recommended_actions").array(),
  triggerFactors: text("trigger_factors").array(),
  analysisTimestamp: timestamp("analysis_timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Emergency Triggers from IoT Devices
export const iotEmergencyTriggers = pgTable("iot_emergency_triggers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => iotDevices.id),
  triggerType: text("trigger_type").notNull(), // 'heart_rate_anomaly', 'fall_detection', 'panic_button', 'stress_threshold'
  severity: text("severity").notNull(), // 'low', 'medium', 'high', 'critical'
  sensorData: jsonb("sensor_data"), // Raw sensor readings
  location: jsonb("location"), // GPS coordinates
  isResolved: boolean("is_resolved").default(false),
  responseTime: integer("response_time"), // seconds
  emergencyAlertId: integer("emergency_alert_id").references(() => emergencyAlerts.id),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({
  id: true,
  createdAt: true
}).extend({
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const insertCommunityAlertSchema = createInsertSchema(communityAlerts).omit({
  id: true,
  createdAt: true
});

export const insertSafeZoneSchema = createInsertSchema(safeZones).omit({
  id: true,
  createdAt: true
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true
});

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
  createdAt: true
});

export const insertHomeLocationSchema = createInsertSchema(homeLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true
});

export const insertIotDeviceSchema = createInsertSchema(iotDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  createdAt: true,
  timestamp: true
});

export const insertStressAnalysisSchema = createInsertSchema(stressAnalysis).omit({
  id: true,
  createdAt: true,
  analysisTimestamp: true
});

export const insertIotEmergencyTriggerSchema = createInsertSchema(iotEmergencyTriggers).omit({
  id: true,
  createdAt: true,
  timestamp: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type CommunityAlert = typeof communityAlerts.$inferSelect;
export type InsertCommunityAlert = z.infer<typeof insertCommunityAlertSchema>;
export type SafeZone = typeof safeZones.$inferSelect;
export type InsertSafeZone = z.infer<typeof insertSafeZoneSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type HomeLocation = typeof homeLocations.$inferSelect;
export type InsertHomeLocation = z.infer<typeof insertHomeLocationSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type StressAnalysis = typeof stressAnalysis.$inferSelect;
export type InsertStressAnalysis = z.infer<typeof insertStressAnalysisSchema>;
export type IotEmergencyTrigger = typeof iotEmergencyTriggers.$inferSelect;
export type InsertIotEmergencyTrigger = z.infer<typeof insertIotEmergencyTriggerSchema>;
