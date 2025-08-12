#!/usr/bin/env tsx
/**
 * Full import script for all 1000+ Bluestone Perennials
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

function mapLightLevel(lightText: string): 'Full Sun' | 'Mostly Sun' | 'Half Sun / Half Shade' | 'Mostly Shade' | 'Full Shade' {
  if (!lightText) return 'Half Sun / Half Shade';
  const light = lightText.toLowerCase();
  
  if (light.includes('full sun') || light.includes('sunny')) return 'Full Sun';
  if (light.includes('mostly sun') || light.includes('partial shade')) return 'Mostly Sun';
  if (light.includes('half') || light.includes('partial')) return 'Half Sun / Half Shade';
  if (light.includes('mostly shade') || light.includes('shade')) return 'Mostly Shade';
  if (light.includes('full shade') || light.includes('deep shade')) return 'Full Shade';
  
  return 'Half Sun / Half Shade';
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
  
  // Extract inches from various formats
  const heightMatch = height.match(/(\d+)[-"]?/);
  if (heightMatch) {
    const inches = parseInt(heightMatch[1]);
    if (inches <= 18) return 'Short';
    if (inches >= 36) return 'Tall';
    return 'Medium';
  }
  
  // Handle feet
  if (height.includes("'") || height.includes('feet') || height.includes('ft')) {
    return 'Tall';
  }
  
  if (height.includes('short') || height.includes('low')) return 'Short';
  if (height.includes('tall') || height.includes('high')) return 'Tall';
  return 'Medium';
}

function parseBloomSeasons(bloomSeasonsText: string, bloomTimeText: string): string[] {
  const seasons: string[] = [];
  
  // First try the bloom_seasons column (comma-separated)
  if (bloomSeasonsText && bloomSeasonsText.trim()) {
    const seasonList = bloomSeasonsText.toLowerCase().split(',').map(s => s.trim());
    for (const season of seasonList) {
      if (season.includes('spring')) seasons.push('Spring');
      else if (season.includes('summer')) seasons.push('Summer');
      else if (season.includes('fall') || season.includes('autumn')) seasons.push('Fall');
      else if (season.includes('winter')) seasons.push('Winter');
    }
  }
  
  // If no seasons found, parse bloom_time text
  if (seasons.length === 0 && bloomTimeText) {
    const text = bloomTimeText.toLowerCase();
    if (text.includes('spring') || text.includes('late spring') || text.includes('early spring')) seasons.push('Spring');
    if (text.includes('summer') || text.includes('mid-summer') || text.includes('midsummer') || text.includes('early summer') || text.includes('late summer')) seasons.push('Summer');
    if (text.includes('fall') || text.includes('autumn') || text.includes('early fall') || text.includes('late fall')) seasons.push('Fall');
    if (text.includes('winter')) seasons.push('Winter');
  }
  
  // Default to Summer if nothing found
  return seasons.length > 0 ? [...new Set(seasons)] : ['Summer'];
}

function parseGrowZones(zoneText: string): string[] {
  if (!zoneText) return ['5', '6', '7'];
  
  const zones: string[] = [];
  const cleanZone = zoneText.replace(/[^\d,-]/g, '');
  
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

async function fullImportBluestone() {
  console.log('Starting full Bluestone import with all 1000+ plants...');
  
  try {
    // First ensure bloom seasons exist
    const seasonsToCreate = ['Spring', 'Summer', 'Fall', 'Winter'];
    for (const seasonName of seasonsToCreate) {
      const existing = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonName));
      if (existing.length === 0) {
        await db.insert(bloomSeasons).values({ season: seasonName });
        console.log(`Created bloom season: ${seasonName}`);
      }
    }

    const csvContent = readFileSync('attached_assets/Plant Database - Bluestone Perennials(perennials)_1755031143862.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} plants to import`);
    
    let imported = 0;
    let skipped = 0;
    let batchSize = 50;
    
    // Process in batches to avoid memory issues
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (plants ${i + 1}-${Math.min(i + batchSize, records.length)})`);
      
      for (const record of batch) {
        try {
          if (!record.name || !record.scientific_name) {
            skipped++;
            continue;
          }

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
          const bloomSeasons = parseBloomSeasons(record.bloom_seasons || '', record.bloom_time || '');
          const growZones = parseGrowZones(record.grow_zones || record.grow_zones_text || '');
          
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
              });
            } catch (error) {
              // Silently continue if zone insertion fails
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
              });
            } catch (error) {
              // Silently continue if bloom season insertion fails
            }
          }

          imported++;
          
          if (imported % 100 === 0) {
            console.log(`Progress: ${imported} plants imported`);
          }
          
        } catch (error) {
          console.warn(`Failed to import ${record.name}: ${error}`);
          skipped++;
        }
      }
    }
    
    console.log(`\n🎉 Full import complete!`);
    console.log(`✅ Imported: ${imported} plants`);
    console.log(`⏭️  Skipped: ${skipped} plants`);
    console.log(`📊 Total processed: ${imported + skipped} records`);
    
  } catch (error) {
    console.error('❌ Error during full import:', error);
    process.exit(1);
  }
}

fullImportBluestone().then(() => process.exit(0));