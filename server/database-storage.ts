import { 
  users, type User, type InsertUser,
  plants, type Plant, type InsertPlant, 
  type PlantFilter
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, inArray } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Plant methods
  async getPlants(filter?: PlantFilter): Promise<Plant[]> {
    let query = db.select().from(plants);
    
    if (filter) {
      const conditions = [];
      
      // Search filter
      if (filter.search) {
        conditions.push(
          or(
            ilike(plants.name, `%${filter.search}%`),
            ilike(plants.scientificName, `%${filter.search}%`),
            ilike(plants.description, `%${filter.search}%`)
          )
        );
      }
      
      // Light levels filter
      if (filter.lightLevels && filter.lightLevels.length > 0) {
        conditions.push(inArray(plants.lightLevel, filter.lightLevels));
      }
      
      // Water needs filter
      if (filter.waterNeeds && filter.waterNeeds.length > 0) {
        conditions.push(inArray(plants.waterNeeds, filter.waterNeeds));
      }
      
      // Difficulty levels filter
      if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
        conditions.push(inArray(plants.difficultyLevel, filter.difficultyLevels));
      }
      
      // Grow zones filter
      if (filter.growZones && filter.growZones.length > 0) {
        // Since grow zones are stored as ranges like "5-9", we need to check if any of the
        // selected zones fall within the range of each plant
        const growZoneConditions = filter.growZones.map(zone => {
          return ilike(plants.growZone, `%${zone}%`);
        });
        conditions.push(or(...growZoneConditions));
      }
      
      // Apply all conditions if there are any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Sorting
      if (filter.sort) {
        switch (filter.sort) {
          case 'name':
            query = query.orderBy(plants.name);
            break;
          case 'difficulty':
            // This is an approximation as we can't directly map string values in SQL like we can in memory
            // We'd need a more sophisticated solution for production
            query = query.orderBy(plants.difficultyLevel);
            break;
          case 'light':
            query = query.orderBy(plants.lightLevel);
            break;
          case 'zone':
            query = query.orderBy(plants.growZone);
            break;
        }
      }
    }
    
    const result = await query;
    return result;
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const [plant] = await db
      .insert(plants)
      .values(insertPlant)
      .returning();
    return plant;
  }

  async updatePlant(id: number, updatePlant: Partial<InsertPlant>): Promise<Plant | undefined> {
    const [updatedPlant] = await db
      .update(plants)
      .set(updatePlant)
      .where(eq(plants.id, id))
      .returning();
    
    return updatedPlant || undefined;
  }

  async deletePlant(id: number): Promise<boolean> {
    const [deletedPlant] = await db
      .delete(plants)
      .where(eq(plants.id, id))
      .returning();
    
    return !!deletedPlant;
  }

  // Seed function to populate the database
  async seedPlants(plantData: InsertPlant[]): Promise<void> {
    // First check if the database is already populated
    const existingPlants = await db.select().from(plants).limit(1);
    
    // Only seed if the database is empty
    if (existingPlants.length === 0) {
      // Insert plants in batches to avoid potential issues with large datasets
      for (const plant of plantData) {
        await this.createPlant(plant);
      }
      console.log('Database seeded with garden plants');
    }
  }
}