import { db } from "../server/db";
import { plants } from "@shared/schema";
import { eq } from "drizzle-orm";

function mapOldToNewLightLevel(oldLevel: string): string {
  switch (oldLevel.toLowerCase()) {
    case 'low':
      return 'Full Shade';
    case 'medium':
      return 'Half Sun / Half Shade';
    case 'bright':
      return 'Full Sun';
    default:
      // Handle existing Bluestone data that might already have the new format
      if (['Full Sun', 'Mostly Sun', 'Half Sun / Half Shade', 'Mostly Shade', 'Full Shade'].includes(oldLevel)) {
        return oldLevel;
      }
      // Map common variations from CSV
      const level = oldLevel.toLowerCase();
      if (level.includes('full sun') || level.includes('sunny')) return 'Full Sun';
      if (level.includes('mostly sun') || level.includes('partial shade')) return 'Mostly Sun';
      if (level.includes('half') || level.includes('partial')) return 'Half Sun / Half Shade';
      if (level.includes('mostly shade') || level.includes('shade')) return 'Mostly Shade';
      if (level.includes('full shade') || level.includes('deep shade')) return 'Full Shade';
      return 'Half Sun / Half Shade'; // Default
  }
}

async function updateLightLevels() {
  console.log("Updating light levels to new 5-value system...");
  
  const allPlants = await db.select().from(plants);
  
  for (const plant of allPlants) {
    const newLightLevel = mapOldToNewLightLevel(plant.lightLevel);
    
    if (newLightLevel !== plant.lightLevel) {
      await db.update(plants)
        .set({ lightLevel: newLightLevel })
        .where(eq(plants.id, plant.id));
      
      console.log(`Updated ${plant.name}: ${plant.lightLevel} -> ${newLightLevel}`);
    }
  }
  
  console.log("Light level update completed!");
}

updateLightLevels().catch(console.error);