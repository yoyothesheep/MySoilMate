#!/usr/bin/env tsx
/**
 * Script to upload new plant data to the database
 * Usage: npm run upload-plants
 */

import { db } from '../server/db';
import { plants, zones, bloomSeasons, plantZones, plantBloomSeasons } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Example plant data structure
interface PlantData {
  name: string;
  scientificName: string;
  description: string;
  imageUrl?: string;
  lightLevel: 'low' | 'medium' | 'bright';
  waterNeeds: 'low' | 'medium' | 'high';
  bloomTime: string;
  height: string;
  width: string;
  temperature?: string;
  humidity?: string;
  careInstructions?: string;
  commonIssues?: string;
  growZones: string[]; // e.g., ['4', '5', '6', '7']
  bloomSeasons: string[]; // e.g., ['Spring', 'Summer']
}

// Sample data - replace with your actual plant data
const newPlantData: PlantData[] = [
  {
    name: "New Plant Example",
    scientificName: "Plantus exampleus",
    description: "An example plant for demonstration purposes.",
    imageUrl: "https://example.com/plant-image.jpg",
    lightLevel: "medium",
    waterNeeds: "medium",
    bloomTime: "Blooms from late spring to early fall",
    height: "2-3 feet",
    width: "18-24 inches",
    temperature: "Hardy in zones 5-8",
    humidity: "Average outdoor humidity",
    careInstructions: "Water regularly, deadhead spent flowers",
    commonIssues: "Aphids may be a problem in spring",
    growZones: ['5', '6', '7', '8'],
    bloomSeasons: ['Spring', 'Summer', 'Fall']
  }
  // Add more plants here...
];

async function uploadPlants() {
  console.log('🌱 Starting plant upload process...');
  
  try {
    for (const plantData of newPlantData) {
      console.log(`📤 Uploading: ${plantData.name}`);
      
      // 1. Insert the plant
      const [insertedPlant] = await db.insert(plants).values({
        name: plantData.name,
        scientificName: plantData.scientificName,
        description: plantData.description,
        imageUrl: plantData.imageUrl,
        lightLevel: plantData.lightLevel,
        waterNeeds: plantData.waterNeeds,
        bloomTime: plantData.bloomTime,
        height: plantData.height,
        width: plantData.width,
        temperature: plantData.temperature,
        humidity: plantData.humidity,
        careInstructions: plantData.careInstructions,
        commonIssues: plantData.commonIssues,
      }).returning();

      // 2. Handle grow zones
      for (const zoneValue of plantData.growZones) {
        // Find or create the zone
        let [zone] = await db.select().from(zones).where(eq(zones.zone, zoneValue));
        if (!zone) {
          [zone] = await db.insert(zones).values({ zone: zoneValue }).returning();
          console.log(`  ➕ Created new zone: ${zoneValue}`);
        }
        
        // Link plant to zone
        await db.insert(plantZones).values({
          plantId: insertedPlant.id,
          zoneId: zone.id
        });
      }

      // 3. Handle bloom seasons
      for (const seasonValue of plantData.bloomSeasons) {
        // Find or create the bloom season
        let [season] = await db.select().from(bloomSeasons).where(eq(bloomSeasons.season, seasonValue));
        if (!season) {
          [season] = await db.insert(bloomSeasons).values({ season: seasonValue }).returning();
          console.log(`  ➕ Created new bloom season: ${seasonValue}`);
        }
        
        // Link plant to bloom season
        await db.insert(plantBloomSeasons).values({
          plantId: insertedPlant.id,
          bloomSeasonId: season.id
        });
      }

      console.log(`  ✅ Successfully uploaded: ${plantData.name}`);
    }
    
    console.log('🎉 All plants uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading plants:', error);
    process.exit(1);
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadPlants().then(() => process.exit(0));
}

export { uploadPlants, type PlantData };