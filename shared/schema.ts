import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for authentication)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Match entries table (for scouting data)
export const matchEntries = pgTable("match_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  team: text("team").notNull(),
  matchType: text("match_type").notNull(),
  matchNumber: integer("match_number").notNull(),
  alliance: text("alliance").notNull(),
  
  // Performance ratings (1-7)
  defense: integer("defense").notNull(),
  defenseComment: text("defense_comment"),
  avoidingDefense: integer("avoiding_defense").notNull(),
  avoidingDefenseComment: text("avoiding_defense_comment"),
  scoringAlgae: integer("scoring_algae").notNull(),
  scoringAlgaeComment: text("scoring_algae_comment"),
  scoringCorals: integer("scoring_corals").notNull(),
  scoringCoralsComment: text("scoring_corals_comment"),
  autonomous: integer("autonomous").notNull(),
  autonomousComment: text("autonomous_comment"),
  drivingSkill: integer("driving_skill").notNull(),
  drivingSkillComment: text("driving_skill_comment"),
  
  // Climbing (none, low, high)
  climbing: text("climbing").notNull(),
  climbingComment: text("climbing_comment"),
  
  // Overall impression (1-7)
  overall: integer("overall").notNull(),
  comments: text("comments"),
  
  // Metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  syncStatus: text("sync_status").default("pending").notNull(), // pending, synced, failed
  scoutedBy: text("scouted_by"), // The person who did the scouting (optional)
});

export const insertMatchEntrySchema = createInsertSchema(matchEntries).omit({
  id: true,
  timestamp: true,
  syncStatus: true,
});

export type InsertMatchEntry = z.infer<typeof insertMatchEntrySchema>;
export type MatchEntry = typeof matchEntries.$inferSelect;

// Team statistics table (for aggregated team data)
export const teamStatistics = pgTable("team_statistics", {
  id: serial("id").primaryKey(),
  teamNumber: text("team_number").notNull().unique(),
  teamName: text("team_name").notNull(),
  matchCount: integer("match_count").default(0).notNull(),
  
  // Average ratings
  avgDefense: doublePrecision("avg_defense").default(0).notNull(),
  avgAvoidingDefense: doublePrecision("avg_avoiding_defense").default(0).notNull(),
  avgScoringAlgae: doublePrecision("avg_scoring_algae").default(0).notNull(),
  avgScoringCorals: doublePrecision("avg_scoring_corals").default(0).notNull(), 
  avgAutonomous: doublePrecision("avg_autonomous").default(0).notNull(),
  avgDrivingSkill: doublePrecision("avg_driving_skill").default(0).notNull(),
  avgOverall: doublePrecision("avg_overall").default(0).notNull(),
  
  // Climbing counts
  climbingNone: integer("climbing_none").default(0).notNull(),
  climbingLow: integer("climbing_low").default(0).notNull(),
  climbingHigh: integer("climbing_high").default(0).notNull(),
  
  // Last updated
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertTeamStatisticsSchema = createInsertSchema(teamStatistics).omit({
  id: true,
  lastUpdated: true,
});

export type InsertTeamStatistics = z.infer<typeof insertTeamStatisticsSchema>;
export type TeamStatistics = typeof teamStatistics.$inferSelect;

// Cloud backups table
export const cloudBackups = pgTable("cloud_backups", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  data: jsonb("data").notNull(),
  size: integer("size").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCloudBackupSchema = createInsertSchema(cloudBackups).omit({
  id: true,
  createdAt: true,
});

export type InsertCloudBackup = z.infer<typeof insertCloudBackupSchema>;
export type CloudBackup = typeof cloudBackups.$inferSelect;
