#!/usr/bin/env tsx
/**
 * Robust batch import for Bluestone Perennials CSV
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Mapping functions
function mapLightLevel(lightText: string): 'low' | 'medium' | 'bright' {
  if (!lightText) return 'medium';
  const light = lightText.toLowerCase();
  if (light.includes('shade') || light.includes('low') || light.includes('partial')) return 'low';
  if (light.includes('full sun') || light.includes('bright') || light.includes('sunny')) return 'bright';
  return 'medium';
}

function mapWaterNeeds(waterText: string): 'low' | 'medium' | 'high' {
  if (!waterText) return 'medium';
  const water = waterText.toLowerCase();
  if (water.includes('low') || water.includes('dry') || water.includes('drought')) return 'low';
  if (water.includes('high') || water.includes('moist') || water.includes('wet')) return 'high';
  return 'medium';
}

function mapHeightText(heightText: string): 'Short' | 'Medium' | 'Tall' {
  if (!heightText) return 'Medium';
  const height = heightText.toLowerCase();
  
  // Extract numbers from height text
  const heightMatch = height.match(/(\d+)["''`]?/);
  if (heightMatch) {
    const inches = parseInt(heightMatch[1]);
    if (inches <= 18) return 'Short';
    if (inches >= 36) return 'Tall';
    return 'Medium';
  }
  
  if (height.includes('short') || height.includes('4-6') || height.includes('low')) return 'Short';
  if (height.includes('tall') || height.includes('6-8') || height.includes("'")) return 'Tall';
  return 'Medium';
}

function parseBloomSeasons(bloomText: string): string[] {
  if (!bloomText) return ['Summer'];
  
  const seasons: string[] = [];
  const text = bloomText.toLowerCase();
  
  if (text.includes('spring') || text.includes('early summer') || text.includes('late spring')) seasons.push('Spring');
  if (text.includes('summer') || text.includes('mid-summer') || text.includes('midsummer')) seasons.push('Summer');
  if (text.includes('fall') || text.includes('autumn') || text.includes('early fall')) seasons.push('Fall');
  if (text.includes('winter')) seasons.push('Winter');
  
  return seasons.length > 0 ? [...new Set(seasons)] : ['Summer'];
}

function parseGrowZones(zoneText: string): string[] {
  if (!zoneText) return ['5', '6', '7']; // Default zones
  
  const zones: string[] = [];
  const cleanZone = zoneText.replace(/[^\d,-]/g, ''); // Remove non-digits, commas, dashes
  
  if (cleanZone.includes('-')) {
    const [start, end] = cleanZone.split('-').map(z => parseInt(z.trim()));
    if (!isNaN(start) && !isNaN(end)) {
      for (let i = Math.max(1, start); i <= Math.min(12, end); i++) {
        zones.push(i.toString());
      }
    }
  } else if (cleanZone.includes(',')) {
    zones.push(...cleanZone.split(',').map(z => z.trim()).filter(z => z && !isNaN(parseInt(z))));
  } else if (cleanZone && !isNaN(parseInt(cleanZone))) {
    zones.push(cleanZone);
  }
  
  return zones.length > 0 ? zones : ['5', '6', '7'];
}

async function batchImportBluestone() {
  console.log('Starting Bluestone Perennials batch import...');
  
  try {
    const csvContent = readFileSync('attached_assets/Plant Database - Bluestone Perennials(perennials)_1755029321494.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} plants to import`);
    
    let imported = 0;
    let skipped = 0;
    const batchSize = 50;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}...`);
      
      for (const record of batch) {
        try {
          if (!record.name || !record.scientific_name) {
            skipped++;
            continue;
          }

          // Clean the name to avoid duplicates
          const plantName = record.name.trim().replace(/[""]/g, '');
          
          // Check for duplicates
          const existing = await db.select().from(plants).where(eq(plants.name, plantName)).limit(1);
          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Map the data
          const lightLevel = mapLightLevel(record.light_level || record.amount_light || '');
          const waterNeeds = mapWaterNeeds(record.water_needs || '');
          const heightText = mapHeightText(record.height_text || record.Height || '');
          const bloomSeasons = parseBloomSeasons(record.bloom_seasons || record.bloom_time || '');
          const growZones = parseGrowZones(record.grow_zones || record.grow_zones_text || '');
          
          // Clean and truncate description
          let description = record.description || `${plantName} - A beautiful perennial plant.`;
          description = description.replace(/\s+/g, ' ').trim().substring(0, 1500);
          
          // Insert plant
          const [insertedPlant] = await db.insert(plants).values({
            name: plantName,
            scientificName: record.scientific_name.trim().replace(/[""]/g, ''),
            description,
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

          // Add zones
          for (const zoneValue of growZones) {
            try {
              let [zone] = await db.select().from(zones).where(eq(zones.zone, zoneValue));
              if (!zone) {
                [zone] = await db.insert(zones).values({ zone: zoneValue }).returning();
              }
              
              await db.insert(plantZones).values({
                plantId: insertedPlant.id,
                zoneId: zone.id
              }).onConflictDoNothing();
              
            } catch (zoneError) {
              // Continue if zone relationship fails
            }
          }

          // Add bloom seasons
          for (const seasonValue of bloomSeasons) {
            try {
              let [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonValue));
              if (!season) {
                [season] = await db.insert(bloomSeasons).values({ season: seasonValue }).returning();
              }
              
              await db.insert(plantBloomSeasons).values({
                plantId: insertedPlant.id,
                bloomSeasonId: season.id
              }).onConflictDoNothing();
              
            } catch (seasonError) {
              // Continue if season relationship fails
            }
          }

          imported++;
          
        } catch (error) {
          console.warn(`Failed to import ${record.name}: ${error}`);
          skipped++;
        }
      }
      
      console.log(`Batch complete. Total imported: ${imported}, skipped: ${skipped}`);
    }
    
    console.log(`\n🎉 Import complete!`);
    console.log(`✅ Imported: ${imported} plants`);
    console.log(`⏭️  Skipped: ${skipped} plants`);
    
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

batchImportBluestone().then(() => process.exit(0));