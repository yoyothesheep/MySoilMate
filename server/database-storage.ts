import { 
  users, type User, type InsertUser,
  plants, type Plant, type InsertPlant, 
  type PlantFilter, type PlantWithZones,
  zones, plantZones
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
  async getPlants(filter?: PlantFilter): Promise<PlantWithZones[]> {
    // Get plants with their grow zones using relations
    const plantsWithZones = await db.query.plants.findMany({
      with: {
        plantZones: {
          with: {
            zone: true
          }
        }
      }
    });
    
    let filteredPlants = plantsWithZones;
    
    if (filter) {
      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredPlants = filteredPlants.filter(plant => 
          plant.name.toLowerCase().includes(searchTerm) || 
          plant.scientificName.toLowerCase().includes(searchTerm) ||
          plant.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Light levels filter
      if (filter.lightLevels && filter.lightLevels.length > 0) {
        filteredPlants = filteredPlants.filter(plant => 
          filter.lightLevels!.includes(plant.lightLevel)
        );
      }
      
      // Water needs filter
      if (filter.waterNeeds && filter.waterNeeds.length > 0) {
        filteredPlants = filteredPlants.filter(plant => 
          filter.waterNeeds!.includes(plant.waterNeeds)
        );
      }
      

      
      // Grow zones filter
      if (filter.growZones && filter.growZones.length > 0) {
        filteredPlants = filteredPlants.filter(plant => {
          const plantZonesValues = plant.plantZones.map(pz => pz.zone.zone);
          return filter.growZones!.some(zone => plantZonesValues.includes(zone));
        });
      }
      
      // Sorting
      if (filter.sort) {
        switch (filter.sort) {
          case 'name':
            filteredPlants.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'light':
            const lightOrder = { 'low': 1, 'medium': 2, 'bright': 3 };
            filteredPlants.sort((a, b) => lightOrder[a.lightLevel as keyof typeof lightOrder] - lightOrder[b.lightLevel as keyof typeof lightOrder]);
            break;
          case 'zone':
            filteredPlants.sort((a, b) => {
              const aMinZone = Math.min(...a.plantZones.map(pz => parseInt(pz.zone.zone.replace(/[ab]/, ''))));
              const bMinZone = Math.min(...b.plantZones.map(pz => parseInt(pz.zone.zone.replace(/[ab]/, ''))));
              return aMinZone - bMinZone;
            });
            break;
        }
      }
    }
    
    return filteredPlants;
  }

  async getPlant(id: number): Promise<PlantWithZones | undefined> {
    const plant = await db.query.plants.findFirst({
      where: eq(plants.id, id),
      with: {
        plantZones: {
          with: {
            zone: true
          }
        }
      }
    });
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