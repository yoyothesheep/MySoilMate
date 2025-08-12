#!/usr/bin/env tsx
/**
 * Script to upload plant data from CSV file
 * Usage: tsx scripts/csv-upload.ts path/to/plants.csv
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

async function uploadFromCSV(csvPath: string) {
  console.log(`📁 Reading CSV file: ${csvPath}`);
  
  try {
    const csvContent = readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📊 Found ${records.length} plants to upload`);

    for (const record of records) {
      console.log(`📤 Uploading: ${record.name}`);
      
      // Parse grow zones and bloom seasons from comma-separated values
      const growZones = record.grow_zones ? record.grow_zones.split(',').map((z: string) => z.trim()) : [];
      const bloomSeasons = record.bloom_seasons ? record.bloom_seasons.split(',').map((s: string) => s.trim()) : [];
      
      // 1. Insert the plant
      const [insertedPlant] = await db.insert(plants).values({
        name: record.name,
        scientificName: record.scientific_name,
        description: record.description,
        imageUrl: record.image_url || null,
        lightLevel: record.light_level,
        waterNeeds: record.water_needs,
        bloomTime: record.bloom_time,
        height: record.height,
        heightText: record.height_text || null,
        width: record.width,
        temperature: record.temperature || null,
        humidity: record.humidity || null,
        careInstructions: record.care_instructions || null,
        commonIssues: record.common_issues || null,
      }).returning();

      // 2. Handle grow zones
      for (const zoneValue of growZones) {
        if (!zoneValue) continue;
        
        let [zone] = await db.select().from(zones).where(eq(zones.zone, zoneValue));
        if (!zone) {
          [zone] = await db.insert(zones).values({ zone: zoneValue }).returning();
          console.log(`  ➕ Created new zone: ${zoneValue}`);
        }
        
        await db.insert(plantZones).values({
          plantId: insertedPlant.id,
          zoneId: zone.id
        });
      }

      // 3. Handle bloom seasons
      for (const seasonValue of bloomSeasons) {
        if (!seasonValue) continue;
        
        let [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonValue));
        if (!season) {
          [season] = await db.insert(bloomSeasons).values({ season: seasonValue }).returning();
          console.log(`  ➕ Created new bloom season: ${seasonValue}`);
        }
        
        await db.insert(plantBloomSeasons).values({
          plantId: insertedPlant.id,
          bloomSeasonId: season.id
        });
      }

      console.log(`  ✅ Successfully uploaded: ${record.name}`);
    }
    
    console.log('🎉 All plants uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading plants:', error);
    process.exit(1);
  }
}

// Get CSV file path from command line arguments
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('❌ Please provide a CSV file path');
  console.log('Usage: tsx scripts/csv-upload.ts path/to/plants.csv');
  process.exit(1);
}

uploadFromCSV(csvPath).then(() => process.exit(0));