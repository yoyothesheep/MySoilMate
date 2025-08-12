#!/usr/bin/env tsx
/**
 * Populate plant light levels from CSV data
 */

import { db } from '../server/db';
import { plants, lightLevels, plantLightLevels } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

function mapLightLevel(lightText: string): string[] {
  if (!lightText) return ['Half Sun / Half Shade'];
  const light = lightText.toLowerCase();
  
  const levels: string[] = [];
  
  // Parse multiple light levels from text like "Full Sun, Mostly Sun"
  if (light.includes('full sun') && light.includes('mostly sun')) {
    levels.push('Full Sun', 'Mostly Sun');
  } else if (light.includes('full sun') || light.includes('sunny')) {
    levels.push('Full Sun');
  } else if (light.includes('mostly sun') || light.includes('partial shade')) {
    levels.push('Mostly Sun');
  } else if (light.includes('half') || light.includes('partial')) {
    levels.push('Half Sun / Half Shade');
  } else if (light.includes('mostly shade') || light.includes('shade')) {
    levels.push('Mostly Shade');
  } else if (light.includes('full shade') || light.includes('deep shade')) {
    levels.push('Full Shade');
  } else {
    levels.push('Half Sun / Half Shade');
  }
  
  return levels;
}

async function populatePlantLightLevels() {
  console.log('Populating plant light levels from CSV data...');
  
  try {
    const csvContent = readFileSync('attached_assets/Plant Database - Bluestone Perennials(perennials)_1755031143862.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const existingPlants = await db.select().from(plants);
    console.log(`Processing ${existingPlants.length} plants`);
    
    let updated = 0;
    
    for (const plant of existingPlants) {
      const csvRecord = records.find((r: any) => {
        const csvName = (r.name || '').trim().replace(/[""]/g, '');
        return csvName === plant.name;
      });
      
      if (!csvRecord) {
        console.log(`No CSV match for: ${plant.name}, using default light level`);
        // Add default light level
        try {
          const [lightLevel] = await db.select().from(lightLevels).where(eq(lightLevels.level, 'Half Sun / Half Shade'));
          if (lightLevel) {
            await db.insert(plantLightLevels).values({
              plantId: plant.id,
              lightLevelId: lightLevel.id
            });
          }
        } catch (error) {
          console.warn(`Failed to add default light level for ${plant.name}`);
        }
        continue;
      }
      
      const lightLevelsForPlant = mapLightLevel(csvRecord.light_level || csvRecord.amount_light || '');
      console.log(`${plant.name} -> ${lightLevelsForPlant.join(', ')}`);
      
      for (const levelName of lightLevelsForPlant) {
        try {
          const [lightLevel] = await db.select().from(lightLevels).where(eq(lightLevels.level, levelName));
          if (lightLevel) {
            await db.insert(plantLightLevels).values({
              plantId: plant.id,
              lightLevelId: lightLevel.id
            });
            console.log(`  Added: ${levelName}`);
          }
        } catch (error) {
          console.warn(`  Failed to add ${levelName}: ${error}`);
        }
      }
      
      updated++;
      if (updated % 50 === 0) {
        console.log(`Progress: ${updated} plants processed`);
      }
    }
    
    console.log(`✅ Updated ${updated} plants with light levels`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

populatePlantLightLevels().then(() => process.exit(0));