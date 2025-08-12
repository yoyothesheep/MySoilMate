import { 
  users, type User, type InsertUser,
  plants, type Plant, type InsertPlant, 
  type PlantFilter, type PlantWithZones,
  zones, plantZones, lightLevels, plantLightLevels, bloomSeasons, plantBloomSeasons,
  type PaginatedPlantsResponse, type InsertBloomSeason, type InsertPlantBloomSeason,
  type LightLevel, type InsertLightLevel
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
  async getPlants(filter?: PlantFilter): Promise<PaginatedPlantsResponse> {
    // Get plants with their grow zones, light levels, and bloom seasons using relations
    const plantsWithZones = await db.query.plants.findMany({
      with: {
        plantZones: {
          with: {
            zone: true
          }
        },
        plantLightLevels: {
          with: {
            lightLevel: true
          }
        },
        plantBloomSeasons: {
          with: {
            bloomSeason: true
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
        filteredPlants = filteredPlants.filter(plant => {
          const plantLightLevels = plant.plantLightLevels?.map(pll => pll.lightLevel.level) || [];
          return filter.lightLevels!.some(level => plantLightLevels.includes(level));
        });
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

      // Bloom season filter
      if (filter.bloomSeasons && filter.bloomSeasons.length > 0) {
        filteredPlants = filteredPlants.filter(plant => {
          const plantBloomSeasons = plant.plantBloomSeasons.map(pbs => pbs.bloomSeason.season);
          return filter.bloomSeasons!.some(season => plantBloomSeasons.includes(season));
        });
      }

      // Height text filter
      if (filter.heightTexts && filter.heightTexts.length > 0) {
        filteredPlants = filteredPlants.filter(plant => 
          plant.heightText && filter.heightTexts!.includes(plant.heightText)
        );
      }
      
      // Sorting
      if (filter.sort) {
        switch (filter.sort) {
          case 'name':
            filteredPlants.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'light':
            const lightOrder = { 
              'Full Shade': 1, 
              'Mostly Shade': 2, 
              'Half Sun / Half Shade': 3, 
              'Mostly Sun': 4, 
              'Full Sun': 5 
            };
            filteredPlants.sort((a, b) => {
              const aLightLevels = a.plantLightLevels?.map(pll => pll.lightLevel.level) || [];
              const bLightLevels = b.plantLightLevels?.map(pll => pll.lightLevel.level) || [];
              const aMaxLight = Math.max(...aLightLevels.map(level => lightOrder[level as keyof typeof lightOrder] || 0));
              const bMaxLight = Math.max(...bLightLevels.map(level => lightOrder[level as keyof typeof lightOrder] || 0));
              return aMaxLight - bMaxLight;
            });
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
    
    // Pagination
    const totalCount = filteredPlants.length;
    const page = filter?.page || 1;
    const limit = filter?.limit || 15;
    const offset = (page - 1) * limit;
    const paginatedPlants = filteredPlants.slice(offset, offset + limit);
    
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    return {
      plants: paginatedPlants,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage
    };
  }

  async getPlant(id: number): Promise<PlantWithZones | undefined> {
    const plant = await db.query.plants.findFirst({
      where: eq(plants.id, id),
      with: {
        plantZones: {
          with: {
            zone: true
          }
        },
        plantLightLevels: {
          with: {
            lightLevel: true
          }
        },
        plantBloomSeasons: {
          with: {
            bloomSeason: true
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

  // Seed function to populate the database with bloom data
  async seedPlants(): Promise<void> {
    // First check if the database is already populated
    const existingPlants = await db.select().from(plants).limit(1);
    
    // Only seed if the database is empty
    if (existingPlants.length === 0) {
      // First, seed bloom seasons
      const bloomSeasonsData: InsertBloomSeason[] = [
        { season: "Spring", description: "March to May flowering period" },
        { season: "Summer", description: "June to August flowering period" },
        { season: "Fall", description: "September to November flowering period" },
        { season: "Winter", description: "December to February flowering period" }
      ];

      for (const bloomSeasonData of bloomSeasonsData) {
        await db.insert(bloomSeasons).values(bloomSeasonData).onConflictDoNothing();
      }
      const plantData: InsertPlant[] = [
        {
          name: "Lavender",
          scientificName: "Lavandula",
          description: "Lavender is a fragrant perennial with silvery-gray foliage and purple flowers. It's deer-resistant, drought-tolerant, and attracts pollinators to the garden.",
          imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Lavender_flowers.jpg/1200px-Lavender_flowers.jpg",
          waterNeeds: "low",
          bloomTime: "Mid to late summer, with peak bloom in July and August",
          height: "18-24 inches",
          width: "18-24 inches",
          temperature: "Hardy in zones 5-9. Prefers temperatures between 60-80°F (15-27°C).",
          humidity: "Prefers dry conditions. Good air circulation is important.",
          careInstructions: "Plant in well-draining soil with full sun exposure. Water deeply but infrequently once established. Prune in early spring to maintain shape. Harvest flowers when they first bloom for the strongest fragrance.",
          commonIssues: "Root Rot: Usually caused by overwatering or poor drainage. Powdery Mildew: Often appears in humid conditions with poor air circulation."
        },
        {
          name: "Black-Eyed Susan",
          scientificName: "Rudbeckia hirta",
          description: "Black-Eyed Susan is a cheerful wildflower with golden-yellow petals and dark brown centers. It's a robust, low-maintenance addition to any garden.",
          imageUrl: "https://extension.umd.edu/sites/extension.umd.edu/files/styles/optimized/public/2021-03/black-eyed-susan-rudbeckia.jpg",
          waterNeeds: "medium",
          bloomTime: "Blooms from midsummer through fall, lasting 6-8 weeks",
          height: "24-36 inches",
          width: "18-24 inches",
          temperature: "Hardy in zones 3-9. Tolerates summer heat well.",
          humidity: "Adaptable to various humidity levels.",
          careInstructions: "Plant in well-draining soil in full sun. Water regularly until established, then only during prolonged dry spells. Deadhead spent blooms to encourage more flowers. Divide every 3-4 years to maintain vigor.",
          commonIssues: "Powdery Mildew: Can develop in humid conditions. Leaf Spot: Often appears in wet conditions or with overcrowding."
        },
        {
          name: "Foxglove",
          scientificName: "Digitalis",
          description: "Foxglove produces tall spikes of tubular flowers in various colors. It's a classic cottage garden plant that adds height and drama to borders.",
          imageUrl: "https://cdn.britannica.com/32/197432-050-DF9B15A9/flowers-Common-foxglove.jpg",
          waterNeeds: "medium",
          bloomTime: "Flowers from late spring through early summer, typically May to July",
          height: "4-6 feet",
          width: "12-18 inches",
          temperature: "Hardy in zones 4-9. Prefers cool summers.",
          humidity: "Adaptable to average humidity levels.",
          careInstructions: "Plant in rich, well-draining soil in partial shade. Water regularly, especially during dry periods. Stake tall varieties to prevent flopping. Allow to self-seed for continuous plants or deadhead to prevent spreading.",
          commonIssues: "Crown Rot: Usually caused by wet, heavy soils. Leaf Spot: Often appears in wet, humid conditions. Note: All parts are toxic if ingested."
        },
        {
          name: "Butterfly Bush",
          scientificName: "Buddleja davidii",
          description: "Butterfly Bush features cone-shaped clusters of fragrant flowers that attract butterflies and hummingbirds. It's a fast-growing shrub with arching branches.",
          imageUrl: "https://www.naturehills.com/media/catalog/product/cache/3a5e947e0f566242390a54e26840d069/b/l/black-knight-butterfly-bush-overview-3.jpg",
          waterNeeds: "medium",
          bloomTime: "Continuous blooms from summer through first frost",
          height: "6-8 feet",
          width: "4-6 feet",
          temperature: "Hardy in zones 5-9. Tolerates heat well.",
          humidity: "Adaptable to various humidity levels.",
          careInstructions: "Plant in well-draining soil in full sun. Water regularly until established, then only during dry spells. Prune back hard in early spring to maintain shape and encourage blooming.",
          commonIssues: "Spider Mites: Can occur during hot, dry conditions. Root Rot: Usually caused by poor drainage. Note: Can be invasive in some regions."
        },
        {
          name: "Hosta",
          scientificName: "Hosta spp.",
          description: "Hostas are shade-loving perennials grown primarily for their attractive foliage in various colors, sizes, and textures. They're perfect for adding interest to shady spots.",
          imageUrl: "https://www.thespruce.com/thmb/Kf-_D_C7kvCO0fYlz57cKtpfcmc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/plantain-lily-plants-hosta-1402844-07-fc41b84a98fe40249ea85cd122f36f23.jpg",
          waterNeeds: "medium",
          bloomTime: "Tall flower stalks appear in mid to late summer",
          height: "12-36 inches",
          width: "18-48 inches",
          temperature: "Hardy in zones 3-9. Prefers moderate temperatures.",
          humidity: "Prefers moderate humidity.",
          careInstructions: "Plant in rich, well-draining soil in shade or partial shade. Water regularly, especially during dry periods. Divide every 4-5 years to maintain vigor. Apply mulch to retain moisture and suppress weeds.",
          commonIssues: "Slug Damage: Usually affects leaves, especially in wet conditions. Deer Browsing: Often a favorite food for deer."
        }
      ];
      
      // Insert all zone data first
      const zoneData = [
        { zone: "3a" }, { zone: "3b" }, { zone: "4a" }, { zone: "4b" },
        { zone: "5a" }, { zone: "5b" }, { zone: "6a" }, { zone: "6b" },
        { zone: "7a" }, { zone: "7b" }, { zone: "8a" }, { zone: "8b" },
        { zone: "9a" }, { zone: "9b" }
      ];

      for (const zone of zoneData) {
        await db.insert(zones).values(zone).onConflictDoNothing();
      }

      // Insert all plants
      for (const plant of plantData) {
        await db.insert(plants).values(plant);
      }

      // Get bloom season IDs for relationships
      const [springSeason] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, "Spring"));
      const [summerSeason] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, "Summer"));
      const [fallSeason] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, "Fall"));

      // Define plant-bloom season relationships
      const plantBloomSeasonData: InsertPlantBloomSeason[] = [
        // Lavender - Summer
        { plantId: 1, bloomSeasonId: summerSeason.id },
        
        // Black-Eyed Susan - Summer and Fall
        { plantId: 2, bloomSeasonId: summerSeason.id },
        { plantId: 2, bloomSeasonId: fallSeason.id },
        
        // Foxglove - Spring and Summer  
        { plantId: 3, bloomSeasonId: springSeason.id },
        { plantId: 3, bloomSeasonId: summerSeason.id },
        
        // Butterfly Bush - Summer and Fall
        { plantId: 4, bloomSeasonId: summerSeason.id },
        { plantId: 4, bloomSeasonId: fallSeason.id },
        
        // Hosta - Summer
        { plantId: 5, bloomSeasonId: summerSeason.id }
      ];

      // Insert plant-bloom season relationships
      for (const plantBloomSeason of plantBloomSeasonData) {
        await db.insert(plantBloomSeasons).values(plantBloomSeason);
      }

      // Define plant-zone relationships
      const plantZoneData = [
        // Lavender - zones 5a to 9a
        { plantId: 1, zoneId: 5 }, { plantId: 1, zoneId: 6 }, { plantId: 1, zoneId: 7 },
        { plantId: 1, zoneId: 8 }, { plantId: 1, zoneId: 9 }, { plantId: 1, zoneId: 10 },
        { plantId: 1, zoneId: 11 }, { plantId: 1, zoneId: 12 }, { plantId: 1, zoneId: 13 },
        
        // Black-Eyed Susan - zones 3a to 9a
        { plantId: 2, zoneId: 1 }, { plantId: 2, zoneId: 2 }, { plantId: 2, zoneId: 3 },
        { plantId: 2, zoneId: 4 }, { plantId: 2, zoneId: 5 }, { plantId: 2, zoneId: 6 },
        { plantId: 2, zoneId: 7 }, { plantId: 2, zoneId: 8 }, { plantId: 2, zoneId: 9 },
        { plantId: 2, zoneId: 10 }, { plantId: 2, zoneId: 11 }, { plantId: 2, zoneId: 12 },
        { plantId: 2, zoneId: 13 },
        
        // Foxglove - zones 4a to 9a
        { plantId: 3, zoneId: 3 }, { plantId: 3, zoneId: 4 }, { plantId: 3, zoneId: 5 },
        { plantId: 3, zoneId: 6 }, { plantId: 3, zoneId: 7 }, { plantId: 3, zoneId: 8 },
        { plantId: 3, zoneId: 9 }, { plantId: 3, zoneId: 10 }, { plantId: 3, zoneId: 11 },
        { plantId: 3, zoneId: 12 }, { plantId: 3, zoneId: 13 },
        
        // Butterfly Bush - zones 5a to 9a
        { plantId: 4, zoneId: 5 }, { plantId: 4, zoneId: 6 }, { plantId: 4, zoneId: 7 },
        { plantId: 4, zoneId: 8 }, { plantId: 4, zoneId: 9 }, { plantId: 4, zoneId: 10 },
        { plantId: 4, zoneId: 11 }, { plantId: 4, zoneId: 12 }, { plantId: 4, zoneId: 13 },
        
        // Hosta - zones 3a to 9a
        { plantId: 5, zoneId: 1 }, { plantId: 5, zoneId: 2 }, { plantId: 5, zoneId: 3 },
        { plantId: 5, zoneId: 4 }, { plantId: 5, zoneId: 5 }, { plantId: 5, zoneId: 6 },
        { plantId: 5, zoneId: 7 }, { plantId: 5, zoneId: 8 }, { plantId: 5, zoneId: 9 },
        { plantId: 5, zoneId: 10 }, { plantId: 5, zoneId: 11 }, { plantId: 5, zoneId: 12 },
        { plantId: 5, zoneId: 13 }
      ];

      // Insert plant-zone relationships
      for (const plantZone of plantZoneData) {
        await db.insert(plantZones).values(plantZone);
      }

      console.log('Database seeded with garden plants including bloom season data');
    }
  }
}