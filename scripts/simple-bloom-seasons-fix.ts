#!/usr/bin/env tsx
import { db } from '../server/db';
import { plants, bloomSeasons, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

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

async function fixBloomSeasons() {
  console.log('Adding bloom seasons to existing plants...');
  
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

    const csvContent = readFileSync('attached_assets/Plant Database - Bluestone Perennials(perennials)_1755030523951.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Get all existing plants
    const existingPlants = await db.select().from(plants);
    console.log(`Found ${existingPlants.length} existing plants`);
    
    let updated = 0;
    
    for (const plant of existingPlants) {
      // Find matching CSV record
      const csvRecord = records.find((r: any) => {
        const csvName = (r.name || '').trim().replace(/[""]/g, '');
        return csvName === plant.name;
      });
      
      if (!csvRecord) {
        console.log(`No CSV match for: ${plant.name}`);
        continue;
      }
      
      const bloomSeasonsForPlant = parseBloomSeasons(csvRecord.bloom_seasons || '', csvRecord.bloom_time || '');
      console.log(`${plant.name} -> ${bloomSeasonsForPlant.join(', ')}`);
      
      // Add bloom seasons
      for (const seasonName of bloomSeasonsForPlant) {
        try {
          const [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonName));
          if (season) {
            await db.insert(plantBloomSeasons).values({
              plantId: plant.id,
              bloomSeasonId: season.id
            });
            console.log(`  Added: ${seasonName}`);
          }
        } catch (error) {
          console.warn(`  Failed to add ${seasonName}: ${error}`);
        }
      }
      
      updated++;
    }
    
    console.log(`\n✅ Updated ${updated} plants with bloom seasons`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBloomSeasons().then(() => process.exit(0));