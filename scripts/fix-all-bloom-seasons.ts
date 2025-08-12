#!/usr/bin/env tsx
import { db } from '../server/db';
import { plants, bloomSeasons, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

function parseBloomSeasons(bloomSeasonsText: string, bloomTimeText: string): string[] {
  const seasons: string[] = [];
  
  if (bloomSeasonsText && bloomSeasonsText.trim()) {
    const seasonList = bloomSeasonsText.toLowerCase().split(',').map(s => s.trim());
    for (const season of seasonList) {
      if (season.includes('spring')) seasons.push('Spring');
      else if (season.includes('summer')) seasons.push('Summer');
      else if (season.includes('fall') || season.includes('autumn')) seasons.push('Fall');
      else if (season.includes('winter')) seasons.push('Winter');
    }
  }
  
  if (seasons.length === 0 && bloomTimeText) {
    const text = bloomTimeText.toLowerCase();
    if (text.includes('spring') || text.includes('late spring') || text.includes('early spring')) seasons.push('Spring');
    if (text.includes('summer') || text.includes('mid-summer') || text.includes('midsummer') || text.includes('early summer') || text.includes('late summer')) seasons.push('Summer');
    if (text.includes('fall') || text.includes('autumn') || text.includes('early fall') || text.includes('late fall')) seasons.push('Fall');
    if (text.includes('winter')) seasons.push('Winter');
  }
  
  return seasons.length > 0 ? [...new Set(seasons)] : ['Summer'];
}

async function fixAllBloomSeasons() {
  console.log('Fixing bloom seasons for all plants...');
  
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
      
      if (!csvRecord) continue;
      
      const bloomSeasonsForPlant = parseBloomSeasons(csvRecord.bloom_seasons || '', csvRecord.bloom_time || '');
      
      for (const seasonName of bloomSeasonsForPlant) {
        try {
          const [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonName));
          if (season) {
            await db.insert(plantBloomSeasons).values({
              plantId: plant.id,
              bloomSeasonId: season.id
            });
          }
        } catch (error) {
          // Skip duplicates
        }
      }
      
      updated++;
      if (updated % 50 === 0) {
        console.log(`Progress: ${updated} plants processed`);
      }
    }
    
    console.log(`✅ Updated ${updated} plants with bloom seasons`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllBloomSeasons().then(() => process.exit(0));