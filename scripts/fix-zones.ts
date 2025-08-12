import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db.js';
import { plants, zones, plantZones } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface CSVRow {
  name: string;
  grow_zones: string;
}

async function fixZones() {
  try {
    console.log('Reading CSV to fix zones...');
    const csvContent = fs.readFileSync('../attached_assets/Plant Database - Bluestone Perennials(perennials)_1755031143862.csv', 'utf-8');
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Get zone lookup map
    const zoneMap = new Map();
    const zoneRows = await db.select().from(zones);
    zoneRows.forEach(row => zoneMap.set(row.zone, row.id));

    console.log(`Processing ${records.length} records for zone data...`);

    let processed = 0;
    let skipped = 0;

    for (const record of records) {
      if (!record.name || !record.grow_zones) {
        skipped++;
        continue;
      }

      try {
        // Find the plant by name
        const [plant] = await db.select().from(plants).where(eq(plants.name, record.name.trim()));
        
        if (!plant) {
          console.log(`Plant not found: ${record.name}`);
          skipped++;
          continue;
        }

        // Parse zones - they appear to be comma separated
        const zonesList = record.grow_zones.split(',').map(z => z.trim());
        
        for (const zone of zonesList) {
          // Handle different zone formats
          let normalizedZone = zone;
          
          // Convert "4-9" format to individual zones
          if (zone.includes('-')) {
            const [start, end] = zone.split('-');
            const startNum = parseInt(start);
            const endNum = parseInt(end);
            
            for (let i = startNum; i <= endNum; i++) {
              const zoneId = zoneMap.get(`${i}a`);
              if (zoneId) {
                await db.insert(plantZones).values({
                  plantId: plant.id,
                  zoneId: zoneId
                }).onConflictDoNothing();
              }
              const zoneIdB = zoneMap.get(`${i}b`);
              if (zoneIdB) {
                await db.insert(plantZones).values({
                  plantId: plant.id,
                  zoneId: zoneIdB
                }).onConflictDoNothing();
              }
            }
          } else {
            // Direct zone match (like "5a", "6b")
            const zoneId = zoneMap.get(normalizedZone);
            if (zoneId) {
              await db.insert(plantZones).values({
                plantId: plant.id,
                zoneId: zoneId
              }).onConflictDoNothing();
            } else {
              // Try to handle just numeric zones by adding 'a' and 'b'
              if (/^\d+$/.test(normalizedZone)) {
                const zoneAId = zoneMap.get(`${normalizedZone}a`);
                if (zoneAId) {
                  await db.insert(plantZones).values({
                    plantId: plant.id,
                    zoneId: zoneAId
                  }).onConflictDoNothing();
                }
                const zoneBId = zoneMap.get(`${normalizedZone}b`);
                if (zoneBId) {
                  await db.insert(plantZones).values({
                    plantId: plant.id,
                    zoneId: zoneBId
                  }).onConflictDoNothing();
                }
              }
            }
          }
        }

        processed++;
        if (processed % 100 === 0) {
          console.log(`Processed ${processed} plants...`);
        }
        
      } catch (error) {
        console.error(`Error processing zones for ${record.name}:`, error);
      }
    }

    console.log(`Zone fix complete! Processed: ${processed}, Skipped: ${skipped}`);
    
    // Verify results
    const totalZoneLinks = await db.select().from(plantZones);
    console.log(`Total plant-zone links created: ${totalZoneLinks.length}`);
    
  } catch (error) {
    console.error('Zone fix failed:', error);
    throw error;
  }
}

fixZones();