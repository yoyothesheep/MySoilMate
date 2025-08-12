import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db.js';
import { plants, lightLevels, bloomSeasons, zones, plantLightLevels, plantBloomSeasons, plantZones } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface CSVRow {
  name: string;
  scientific_name: string;
  description: string;
  image_url: string;
  light_level: string;
  water_needs: string;
  bloom_time: string;
  bloom_seasons: string;
  height: string;
  width: string;
  temperature: string;
  humidity: string;
  care_instructions: string;
  common_issues: string;
  grow_zones: string;
}

async function batchImport() {
  try {
    // Read and parse CSV
    console.log('Reading CSV file...');
    const csvContent = fs.readFileSync('../attached_assets/Plant Database - Bluestone Perennials(perennials)_1755031143862.csv', 'utf-8');
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} plant records`);

    // Get lookup table data
    const lightLevelMap = new Map();
    const bloomSeasonMap = new Map();
    const zoneMap = new Map();

    const lightLevelRows = await db.select().from(lightLevels);
    lightLevelRows.forEach(row => lightLevelMap.set(row.level, row.id));

    const bloomSeasonRows = await db.select().from(bloomSeasons);
    bloomSeasonRows.forEach(row => bloomSeasonMap.set(row.season, row.id));

    const zoneRows = await db.select().from(zones);
    zoneRows.forEach(row => zoneMap.set(row.zone, row.id));

    // Process in batches of 100
    const batchSize = 100;
    let processed = 0;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} plants)`);
      
      for (const record of batch) {
        if (!record.name || !record.scientific_name) continue;

        try {
          // Insert plant
          const [plant] = await db.insert(plants).values({
            name: record.name.trim(),
            scientificName: record.scientific_name.trim(),
            description: record.description?.trim() || 'No description available',
            imageUrl: record.image_url?.trim() || null,
            waterNeeds: record.water_needs?.toLowerCase().trim() || 'medium',
            bloomTime: record.bloom_time?.trim() || null,
            height: record.height?.trim() || 'Size not specified',
            width: record.width?.trim() || 'Size not specified',
            temperature: record.temperature?.trim() || null,
            humidity: record.humidity?.trim() || null,
            careInstructions: record.care_instructions?.trim() || null,
            commonIssues: record.common_issues?.trim() || null
          }).returning({ id: plants.id });

          // Process light levels
          if (record.light_level) {
            const lightLevels = record.light_level.split(',').map(l => l.trim());
            for (const level of lightLevels) {
              const lightLevelId = lightLevelMap.get(level);
              if (lightLevelId) {
                await db.insert(plantLightLevels).values({
                  plantId: plant.id,
                  lightLevelId: lightLevelId
                }).onConflictDoNothing();
              }
            }
          }

          // Process bloom seasons (skip for ferns and non-blooming plants)
          const isFern = record.name.toLowerCase().includes('fern') || 
                         record.scientific_name.toLowerCase().includes('fern');
          const nonBlooming = record.bloom_time?.toLowerCase().includes('not applicable') ||
                             record.bloom_seasons?.toLowerCase().includes('not applicable');
          
          if (record.bloom_seasons && !isFern && !nonBlooming) {
            const seasons = record.bloom_seasons.toLowerCase().split(',').map(s => {
              const season = s.trim();
              return season.charAt(0).toUpperCase() + season.slice(1);
            });
            
            for (const season of seasons) {
              const bloomSeasonId = bloomSeasonMap.get(season);
              if (bloomSeasonId) {
                await db.insert(plantBloomSeasons).values({
                  plantId: plant.id,
                  bloomSeasonId: bloomSeasonId
                }).onConflictDoNothing();
              }
            }
          }

          // Process zones
          if (record.grow_zones) {
            const zonesList = record.grow_zones.split(',').map(z => z.trim());
            for (const zone of zonesList) {
              const zoneId = zoneMap.get(zone);
              if (zoneId) {
                await db.insert(plantZones).values({
                  plantId: plant.id,
                  zoneId: zoneId
                }).onConflictDoNothing();
              }
            }
          }

          processed++;
        } catch (error) {
          console.error(`Error processing plant ${record.name}:`, error);
        }
      }
      
      console.log(`Batch complete. Total processed: ${processed}`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Import complete! Successfully imported ${processed} plants.`);
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

batchImport();