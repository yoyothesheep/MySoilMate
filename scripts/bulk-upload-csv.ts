#!/usr/bin/env tsx
/**
 * Script to bulk upload plants from a CSV file
 * Usage: npm run upload-csv -- /path/to/plants.csv
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface CSVRow {
  name: string;
  scientific_name: string;
  description: string;
  image_url?: string;
  light_level: 'low' | 'medium' | 'bright';
  water_needs: 'low' | 'medium' | 'high';
  bloom_time: string;
  height: string;
  width: string;
  temperature?: string;
  humidity?: string;
  care_instructions?: string;
  common_issues?: string;
  grow_zones: string; // Comma-separated: "4,5,6,7"
  bloom_seasons: string; // Comma-separated: "Spring,Summer"
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row as CSVRow;
  });
}

async function uploadFromCSV(csvPath: string) {
  console.log(`📁 Reading CSV file: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const plantData = parseCSV(csvContent);
  
  console.log(`🌱 Found ${plantData.length} plants to upload`);
  
  try {
    for (const row of plantData) {
      console.log(`📤 Uploading: ${row.name}`);
      
      // Insert the plant
      const [insertedPlant] = await db.insert(plants).values({
        name: row.name,
        scientificName: row.scientific_name,
        description: row.description,
        imageUrl: row.image_url || null,
        lightLevel: row.light_level,
        waterNeeds: row.water_needs,
        bloomTime: row.bloom_time,
        height: row.height,
        width: row.width,
        temperature: row.temperature || null,
        humidity: row.humidity || null,
        careInstructions: row.care_instructions || null,
        commonIssues: row.common_issues || null,
      }).returning();

      // Handle grow zones
      if (row.grow_zones) {
        const zoneValues = row.grow_zones.split(',').map(z => z.trim());
        for (const zoneValue of zoneValues) {
          let [zone] = await db.select().from(zones).where(eq(zones.zone, zoneValue));
          if (!zone) {
            [zone] = await db.insert(zones).values({ zone: zoneValue }).returning();
          }
          
          await db.insert(plantZones).values({
            plantId: insertedPlant.id,
            zoneId: zone.id
          });
        }
      }

      // Handle bloom seasons
      if (row.bloom_seasons) {
        const seasonValues = row.bloom_seasons.split(',').map(s => s.trim());
        for (const seasonValue of seasonValues) {
          let [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonValue));
          if (!season) {
            [season] = await db.insert(bloomSeasons).values({ season: seasonValue }).returning();
          }
          
          await db.insert(plantBloomSeasons).values({
            plantId: insertedPlant.id,
            bloomSeasonId: season.id
          });
        }
      }

      console.log(`  ✅ Successfully uploaded: ${row.name}`);
    }
    
    console.log('🎉 All plants from CSV uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading plants from CSV:', error);
    process.exit(1);
  }
}

// Get CSV path from command line arguments
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npm run upload-csv -- /path/to/plants.csv');
  process.exit(1);
}

uploadFromCSV(csvPath).then(() => process.exit(0));