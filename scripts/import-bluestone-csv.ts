#!/usr/bin/env tsx
/**
 * Script to import Bluestone Perennials CSV data
 * Usage: tsx scripts/import-bluestone-csv.ts path/to/csv
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

function mapLightLevel(lightText: string): 'low' | 'medium' | 'bright' {
  const light = lightText.toLowerCase();
  if (light.includes('shade') || light.includes('low')) return 'low';
  if (light.includes('full sun') || light.includes('bright')) return 'bright';
  return 'medium';
}

function mapWaterNeeds(waterText: string): 'low' | 'medium' | 'high' {
  const water = waterText.toLowerCase();
  if (water.includes('low') || water.includes('dry') || water.includes('drought')) return 'low';
  if (water.includes('high') || water.includes('moist') || water.includes('wet')) return 'high';
  return 'medium';
}

function mapHeightText(heightText: string): 'Short' | 'Medium' | 'Tall' | null {
  const height = heightText.toLowerCase();
  if (height.includes('short') || height.includes('4-6') || height.includes('12"')) return 'Short';
  if (height.includes('tall') || height.includes('6-8') || height.includes("'")) return 'Tall';
  if (height.includes('medium') || height.includes('20') || height.includes('22-24')) return 'Medium';
  return null;
}

function parseBloomSeasons(bloomText: string): string[] {
  if (!bloomText) return [];
  
  const seasons: string[] = [];
  const text = bloomText.toLowerCase();
  
  if (text.includes('spring') || text.includes('early summer')) seasons.push('Spring');
  if (text.includes('summer') || text.includes('mid-summer')) seasons.push('Summer');
  if (text.includes('fall') || text.includes('autumn')) seasons.push('Fall');
  if (text.includes('winter')) seasons.push('Winter');
  
  return [...new Set(seasons)]; // Remove duplicates
}

function parseGrowZones(zoneText: string): string[] {
  if (!zoneText) return [];
  
  // Handle ranges like "4-9" or comma-separated like "4,5,6,7,8,9"
  const zones: string[] = [];
  
  if (zoneText.includes('-')) {
    const [start, end] = zoneText.split('-').map(z => parseInt(z.trim()));
    for (let i = start; i <= end; i++) {
      zones.push(i.toString());
    }
  } else if (zoneText.includes(',')) {
    zones.push(...zoneText.split(',').map(z => z.trim()));
  } else {
    zones.push(zoneText.trim());
  }
  
  return zones.filter(z => z && !isNaN(parseInt(z)));
}

async function importBluestoneCSV(csvPath: string) {
  console.log(`Reading Bluestone Perennials CSV: ${csvPath}`);
  
  try {
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} plants to import`);
    let imported = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        // Skip if essential data is missing
        if (!record.name || !record.scientific_name) {
          skipped++;
          continue;
        }

        console.log(`Importing: ${record.name}`);
        
        // Parse and map the data
        const lightLevel = mapLightLevel(record.light_level || record.amount_light || 'medium');
        const waterNeeds = mapWaterNeeds(record.water_needs || 'medium');
        const heightText = mapHeightText(record.height_text || record.Height || '');
        const bloomSeasons = parseBloomSeasons(record.bloom_seasons || record.bloom_time || '');
        const growZones = parseGrowZones(record.grow_zones || record.grow_zones_text || '');
        
        // Check if plant already exists to avoid duplicates
        const existingPlant = await db.select().from(plants).where(eq(plants.name, record.name.trim())).limit(1);
        if (existingPlant.length > 0) {
          console.log(`  Skipping duplicate: ${record.name}`);
          skipped++;
          continue;
        }

        // Insert the plant
        const [insertedPlant] = await db.insert(plants).values({
          name: record.name.trim(),
          scientificName: record.scientific_name.trim(),
          description: record.description ? record.description.substring(0, 2000) : `${record.name} - A beautiful perennial plant.`,
          imageUrl: record.image_url || null,
          lightLevel,
          waterNeeds,
          bloomTime: record.bloom_time || 'Blooms seasonally',
          height: record.Height || record.height_text || 'Medium height',
          heightText,
          width: record.width || 'Medium spread',
          temperature: record.temperature || null,
          humidity: record.humidity || null,
          careInstructions: record.care_instructions ? record.care_instructions.substring(0, 1000) : null,
          commonIssues: record.common_issues ? record.common_issues.substring(0, 500) : null,
        }).returning();

        // Handle grow zones
        for (const zoneValue of growZones) {
          if (!zoneValue) continue;
          
          let [zone] = await db.select().from(zones).where(eq(zones.zone, zoneValue));
          if (!zone) {
            [zone] = await db.insert(zones).values({ zone: zoneValue }).returning();
          }
          
          // Check if relationship already exists
          const existingRelation = await db.select().from(plantZones)
            .where(eq(plantZones.plantId, insertedPlant.id))
            .where(eq(plantZones.zoneId, zone.id))
            .limit(1);
            
          if (existingRelation.length === 0) {
            await db.insert(plantZones).values({
              plantId: insertedPlant.id,
              zoneId: zone.id
            });
          }
        }

        // Handle bloom seasons
        for (const seasonValue of bloomSeasons) {
          if (!seasonValue) continue;
          
          let [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonValue));
          if (!season) {
            [season] = await db.insert(bloomSeasons).values({ season: seasonValue }).returning();
          }
          
          // Check if relationship already exists
          const existingRelation = await db.select().from(plantBloomSeasons)
            .where(eq(plantBloomSeasons.plantId, insertedPlant.id))
            .where(eq(plantBloomSeasons.bloomSeasonId, season.id))
            .limit(1);
            
          if (existingRelation.length === 0) {
            await db.insert(plantBloomSeasons).values({
              plantId: insertedPlant.id,
              bloomSeasonId: season.id
            });
          }
        }

        imported++;
        
        if (imported % 100 === 0) {
          console.log(`Progress: ${imported} plants imported...`);
        }
        
      } catch (error) {
        console.warn(`Failed to import ${record.name}: ${error}`);
        skipped++;
      }
    }
    
    console.log(`Import complete! ${imported} plants imported, ${skipped} skipped.`);
    
  } catch (error) {
    console.error('Error importing CSV:', error);
    process.exit(1);
  }
}

// Get CSV file path from command line arguments
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Please provide a CSV file path');
  console.log('Usage: tsx scripts/import-bluestone-csv.ts path/to/csv');
  process.exit(1);
}

importBluestoneCSV(csvPath).then(() => process.exit(0));