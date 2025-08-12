import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User schema (keeping the existing one)
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

// Plant schema
export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"), // Keep for backward compatibility, but make optional
  imageData: text("image_data"), // Base64 encoded image data
  imageMimeType: text("image_mime_type"), // MIME type of the stored image
  lightLevel: text("light_level").notNull(), // 'low', 'medium', 'bright'
  waterNeeds: text("water_needs").notNull(), // 'low', 'medium', 'high'
  bloomTime: text("bloom_time").notNull(), // Descriptive text about bloom timing
  height: text("height").notNull(), // Plant height at maturity
  heightText: text("height_text"), // Height category: 'Short', 'Medium', 'Tall'
  width: text("width").notNull(), // Plant width/spread at maturity
  temperature: text("temperature"),
  humidity: text("humidity"),
  careInstructions: text("care_instructions"),
  commonIssues: text("common_issues"),
});

// Zones reference table - USDA hardiness zones
export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  zone: text("zone").notNull().unique(), // Individual zone like "4a", "5b", "6a", etc.
});

// Bloom seasons reference table
export const bloomSeasons = pgTable("bloom_seasons", {
  id: serial("id").primaryKey(),
  season: text("season").notNull().unique(), // e.g., "Spring", "Summer", "Fall", "Winter"
  description: text("description"), // Optional description of the season
});

// Plant zones junction table - many-to-many relationship
export const plantZones = pgTable("plant_zones", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  zoneId: integer("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
});

// Plant bloom seasons junction table - many-to-many relationship
export const plantBloomSeasons = pgTable("plant_bloom_seasons", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull().references(() => plants.id, { onDelete: "cascade" }),
  bloomSeasonId: integer("bloom_season_id").notNull().references(() => bloomSeasons.id, { onDelete: "cascade" }),
});

// Relations
export const plantsRelations = relations(plants, ({ many }) => ({
  plantZones: many(plantZones),
  plantBloomSeasons: many(plantBloomSeasons),
}));

export const zonesRelations = relations(zones, ({ many }) => ({
  plantZones: many(plantZones),
}));

export const bloomSeasonsRelations = relations(bloomSeasons, ({ many }) => ({
  plantBloomSeasons: many(plantBloomSeasons),
}));

export const plantZonesRelations = relations(plantZones, ({ one }) => ({
  plant: one(plants, {
    fields: [plantZones.plantId],
    references: [plants.id],
  }),
  zone: one(zones, {
    fields: [plantZones.zoneId],
    references: [zones.id],
  }),
}));

export const plantBloomSeasonsRelations = relations(plantBloomSeasons, ({ one }) => ({
  plant: one(plants, {
    fields: [plantBloomSeasons.plantId],
    references: [plants.id],
  }),
  bloomSeason: one(bloomSeasons, {
    fields: [plantBloomSeasons.bloomSeasonId],
    references: [bloomSeasons.id],
  }),
}));

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
});

export const insertZoneSchema = createInsertSchema(zones).omit({
  id: true,
});

export const insertBloomSeasonSchema = createInsertSchema(bloomSeasons).omit({
  id: true,
});

export const insertPlantZoneSchema = createInsertSchema(plantZones).omit({
  id: true,
});

export const insertPlantBloomSeasonSchema = createInsertSchema(plantBloomSeasons).omit({
  id: true,
});

export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zones.$inferSelect;
export type InsertBloomSeason = z.infer<typeof insertBloomSeasonSchema>;
export type BloomSeason = typeof bloomSeasons.$inferSelect;
export type InsertPlantZone = z.infer<typeof insertPlantZoneSchema>;
export type PlantZone = typeof plantZones.$inferSelect;
export type InsertPlantBloomSeason = z.infer<typeof insertPlantBloomSeasonSchema>;
export type PlantBloomSeason = typeof plantBloomSeasons.$inferSelect;

export type LightLevel = 'low' | 'medium' | 'bright';
export type WaterNeeds = 'low' | 'medium' | 'high';
export type ZoneNumber = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13';

// Type for plant with grow zones and bloom seasons included
export type PlantWithZones = Plant & {
  plantZones: (PlantZone & { zone: Zone })[];
  plantBloomSeasons: (PlantBloomSeason & { bloomSeason: BloomSeason })[];
};

export const plantFilterSchema = z.object({
  search: z.string().optional(),
  lightLevels: z.array(z.string()).optional(),
  waterNeeds: z.array(z.string()).optional(),
  growZones: z.array(z.string()).optional(),
  bloomSeasons: z.array(z.string()).optional(),
  heightTexts: z.array(z.string()).optional(),
  sort: z.enum(['name', 'light', 'zone']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(15),
});

export type PlantFilter = z.infer<typeof plantFilterSchema>;

// Paginated response type
export type PaginatedPlantsResponse = {
  plants: PlantWithZones[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
