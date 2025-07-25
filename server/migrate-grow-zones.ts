// Migration script to move grow zones from plants table to separate grow_zones table

async function migrateGrowZones() {
  console.log("Starting grow zone migration...");
  
  try {
    // First, get all plants with their current grow zones from the existing schema
    const query = `
      SELECT id, name, grow_zone 
      FROM plants 
      WHERE grow_zone IS NOT NULL
    `;
    
    const result = await executeSQL(query);
    const plants = result.rows;
    
    console.log(`Found ${plants.length} plants to migrate`);
    
    // Migrate each plant's grow zones
    for (const plant of plants) {
      if (plant.grow_zone) {
        // Parse the grow zone string (e.g., "4-9" or "5-8")
        const zones = parseGrowZone(plant.grow_zone);
        
        // Insert each zone as a separate row
        for (const zone of zones) {
          await executeSQL(`
            INSERT INTO grow_zones (plant_id, zone) 
            VALUES ($1, $2)
          `, [plant.id, zone]);
        }
        
        console.log(`Migrated plant ${plant.name}: ${plant.grow_zone} -> ${zones.join(", ")}`);
      }
    }
    
    console.log("Grow zone migration completed successfully!");
    
  } catch (error) {
    console.error("Error during grow zone migration:", error);
    throw error;
  }
}

async function executeSQL(query: string, params: any[] = []) {
  // We'll use a simple approach with the database connection
  const { Pool } = await import('@neondatabase/serverless');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const result = await pool.query(query, params);
    return result;
  } finally {
    await pool.end();
  }
}

function parseGrowZone(growZone: string): string[] {
  // Handle ranges like "4-9" or single zones like "5"
  if (growZone.includes("-")) {
    const [start, end] = growZone.split("-").map(z => parseInt(z.trim()));
    const zones: string[] = [];
    for (let i = start; i <= end; i++) {
      zones.push(i.toString());
    }
    return zones;
  } else {
    // Single zone
    return [growZone.trim()];
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateGrowZones()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateGrowZones };