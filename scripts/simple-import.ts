#!/usr/bin/env tsx
/**
 * Simple import script for testing with limited records
 */

import { db } from '../server/db';
import { plants } from '@shared/schema';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

async function testImport() {
  console.log('Testing simple import...');
  
  try {
    // Test with a single plant entry
    const testPlant = {
      name: "Test Bluestone Plant",
      scientificName: "Testicus bluestonis",
      description: "A test plant from Bluestone Perennials import",
      lightLevel: 'medium' as const,
      waterNeeds: 'medium' as const,
      bloomTime: "Summer blooming",
      height: "2-3 feet",
      heightText: 'Medium' as const,
      width: "18 inches"
    };

    const result = await db.insert(plants).values(testPlant).returning();
    console.log('Successfully inserted test plant:', result[0].name);
    
    // Now try importing first 5 records from CSV
    const csvContent = readFileSync('attached_assets/Plant Database - Bluestone Perennials(perennials)_1755029321494.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }).slice(0, 5); // Only first 5 records

    console.log(`Importing first 5 records from CSV...`);
    
    for (const record of records) {
      if (!record.name || !record.scientific_name) continue;
      
      console.log(`Importing: ${record.name}`);
      
      const plantData = {
        name: record.name.trim(),
        scientificName: record.scientific_name.trim(),
        description: record.description ? record.description.substring(0, 1000) : `${record.name} - A beautiful perennial from Bluestone.`,
        lightLevel: 'medium' as const,
        waterNeeds: 'medium' as const,
        bloomTime: record.bloom_time || 'Seasonal blooming',
        height: record.Height || record.height_text || 'Medium height',
        heightText: 'Medium' as const,
        width: record.width || 'Medium spread'
      };
      
      const result = await db.insert(plants).values(plantData).returning();
      console.log(`✓ Imported: ${result[0].name}`);
    }
    
    console.log('Test import completed successfully!');
    
  } catch (error) {
    console.error('Error during test import:', error);
  }
}

testImport().then(() => process.exit(0));