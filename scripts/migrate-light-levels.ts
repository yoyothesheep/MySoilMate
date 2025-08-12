#!/usr/bin/env tsx
/**
 * Migrate light levels from plant.light_level column to relational tables
 */

import { db } from '../server/db';
import { plants, lightLevels, plantLightLevels } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function migrateLightLevels() {
  console.log('Migrating light levels to relational structure...');
  
  try {
    // First, create the light level reference data
    const lightLevelsData = [
      { level: 'Full Sun', description: 'Direct sunlight for 6+ hours daily' },
      { level: 'Mostly Sun', description: 'Direct sunlight for 4-6 hours daily' },
      { level: 'Half Sun / Half Shade', description: 'Partial sunlight for 3-4 hours daily' },
      { level: 'Mostly Shade', description: 'Filtered or dappled sunlight, 2-3 hours daily' },
      { level: 'Full Shade', description: 'Little to no direct sunlight, bright indirect light' }
    ];
    
    console.log('Creating light levels reference table...');
    for (const lightLevelData of lightLevelsData) {
      try {
        await db.insert(lightLevels).values(lightLevelData);
        console.log(`Created light level: ${lightLevelData.level}`);
      } catch (error) {
        // Level might already exist, check if it does
        const existing = await db.select().from(lightLevels).where(eq(lightLevels.level, lightLevelData.level));
        if (existing.length === 0) {
          console.error(`Failed to create light level ${lightLevelData.level}: ${error}`);
        }
      }
    }
    
    // Get all plants with their current light levels
    const existingPlants = await db.select({ id: plants.id, lightLevel: plants.lightLevel }).from(plants);
    console.log(`Found ${existingPlants.length} plants to migrate`);
    
    // Migrate each plant's light level to the junction table
    let migrated = 0;
    for (const plant of existingPlants) {
      try {
        // Find the corresponding light level record
        const [lightLevel] = await db.select()
          .from(lightLevels)
          .where(eq(lightLevels.level, plant.lightLevel));
        
        if (lightLevel) {
          // Create the junction table entry
          await db.insert(plantLightLevels).values({
            plantId: plant.id,
            lightLevelId: lightLevel.id
          });
          migrated++;
          
          if (migrated % 50 === 0) {
            console.log(`Progress: ${migrated} plants migrated`);
          }
        } else {
          console.warn(`No light level found for value: ${plant.lightLevel}`);
        }
      } catch (error) {
        console.warn(`Failed to migrate plant ${plant.id}: ${error}`);
      }
    }
    
    console.log(`✅ Successfully migrated ${migrated} plants to relational light levels`);
    console.log('\nNow you can run: npm run db:push --force to remove the old light_level column');
    
  } catch (error) {
    console.error('❌ Error during light level migration:', error);
    process.exit(1);
  }
}

migrateLightLevels().then(() => process.exit(0));