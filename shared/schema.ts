import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  imageUrl: text("image_url").notNull(),
  lightLevel: text("light_level").notNull(), // 'low', 'medium', 'bright'
  waterNeeds: text("water_needs").notNull(), // 'low', 'medium', 'high'
  difficultyLevel: text("difficulty_level").notNull(), // 'beginner', 'intermediate', 'expert'
  temperature: text("temperature"),
  humidity: text("humidity"),
  careInstructions: text("care_instructions"),
  commonIssues: text("common_issues"),
});

export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
});

export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Plant = typeof plants.$inferSelect;

export type LightLevel = 'low' | 'medium' | 'bright';
export type WaterNeeds = 'low' | 'medium' | 'high';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';

export const plantFilterSchema = z.object({
  search: z.string().optional(),
  lightLevels: z.array(z.string()).optional(),
  waterNeeds: z.array(z.string()).optional(),
  difficultyLevels: z.array(z.string()).optional(),
  sort: z.enum(['name', 'difficulty', 'light']).optional(),
});

export type PlantFilter = z.infer<typeof plantFilterSchema>;
