// Create attractive SVG placeholder images for remaining plants
import { db } from '../server/db.js';
import { plants } from '../shared/schema.ts';
import { eq, sql } from 'drizzle-orm';

// Plant-specific color schemes and characteristics
const plantVisuals = {
  "Diamond Frost Euphorbia": {
    primary: "#ffffff",
    secondary: "#f0f8f0", 
    accent: "#e8f5e8",
    pattern: "dots"
  },
  "Husker Red Penstemon": {
    primary: "#8b2635",
    secondary: "#a64d59",
    accent: "#d4a5ae",
    pattern: "spikes"
  },
  "Jack Frost Brunnera": {
    primary: "#4a7c59",
    secondary: "#6b9b7a",
    accent: "#a8d4b8",
    pattern: "leaves"
  },
  "Karl Foerster Feather Reed Grass": {
    primary: "#d4b886",
    secondary: "#c4a876",
    accent: "#b49866",
    pattern: "grass"
  },
  "Lemon Coral Sedum": {
    primary: "#d4e157",
    secondary: "#c0ca33",
    accent: "#9e9d24",
    pattern: "succulent"
  },
  "Little Bluestem": {
    primary: "#7e57c2",
    secondary: "#5e35b1",
    accent: "#512da8",
    pattern: "grass"
  },
  "Millenium Allium": {
    primary: "#7b1fa2",
    secondary: "#8e24aa",
    accent: "#ab47bc",
    pattern: "sphere"
  },
  "Prairie Dropseed": {
    primary: "#81c784",
    secondary: "#66bb6a", 
    accent: "#4caf50",
    pattern: "grass"
  },
  "Sweet Caroline Sweetheart Potato Vine": {
    primary: "#e91e63",
    secondary: "#ad1457",
    accent: "#880e4f",
    pattern: "hearts"
  },
  "Switchgrass": {
    primary: "#ff8a65",
    secondary: "#ff7043",
    accent: "#ff5722",
    pattern: "grass"
  }
};

function createPlantSVG(plantName, visual) {
  let patternElement = '';
  
  switch(visual.pattern) {
    case 'dots':
      patternElement = `
        <circle cx="30" cy="40" r="3" fill="${visual.primary}" opacity="0.8"/>
        <circle cx="60" cy="30" r="2" fill="${visual.primary}" opacity="0.6"/>
        <circle cx="90" cy="50" r="2.5" fill="${visual.primary}" opacity="0.7"/>
        <circle cx="45" cy="70" r="2" fill="${visual.primary}" opacity="0.9"/>
        <circle cx="75" cy="60" r="3" fill="${visual.primary}" opacity="0.8"/>`;
      break;
    case 'spikes':
      patternElement = `
        <path d="M40 20 L42 60 L38 60 Z" fill="${visual.primary}" opacity="0.8"/>
        <path d="M55 25 L57 65 L53 65 Z" fill="${visual.primary}" opacity="0.7"/>
        <path d="M70 22 L72 62 L68 62 Z" fill="${visual.primary}" opacity="0.9"/>`;
      break;
    case 'leaves':
      patternElement = `
        <ellipse cx="40" cy="40" rx="12" ry="8" fill="${visual.primary}" opacity="0.8" transform="rotate(45 40 40)"/>
        <ellipse cx="60" cy="50" rx="10" ry="6" fill="${visual.primary}" opacity="0.7" transform="rotate(-30 60 50)"/>
        <ellipse cx="75" cy="35" rx="11" ry="7" fill="${visual.primary}" opacity="0.9" transform="rotate(15 75 35)"/>`;
      break;
    case 'grass':
      patternElement = `
        <path d="M30 80 Q32 40 34 20" stroke="${visual.primary}" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M45 80 Q47 35 49 15" stroke="${visual.primary}" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M60 80 Q62 40 64 18" stroke="${visual.primary}" stroke-width="2" fill="none" opacity="0.9"/>
        <path d="M75 80 Q77 38 79 20" stroke="${visual.primary}" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M90 80 Q92 42 94 22" stroke="${visual.primary}" stroke-width="2" fill="none" opacity="0.6"/>`;
      break;
    case 'succulent':
      patternElement = `
        <path d="M50 40 L40 50 L50 60 L60 50 Z" fill="${visual.primary}" opacity="0.8"/>
        <path d="M70 35 L62 43 L70 51 L78 43 Z" fill="${visual.primary}" opacity="0.7"/>
        <path d="M35 55 L27 63 L35 71 L43 63 Z" fill="${visual.primary}" opacity="0.9"/>`;
      break;
    case 'sphere':
      patternElement = `
        <circle cx="50" cy="45" r="15" fill="${visual.primary}" opacity="0.8"/>
        <circle cx="50" cy="45" r="10" fill="${visual.secondary}" opacity="0.6"/>
        <circle cx="50" cy="45" r="5" fill="${visual.accent}" opacity="0.4"/>`;
      break;
    case 'hearts':
      patternElement = `
        <path d="M50,55 C50,55 35,40 35,30 C35,25 40,20 45,20 C47.5,20 50,22.5 50,22.5 C50,22.5 52.5,20 55,20 C60,20 65,25 65,30 C65,40 50,55 50,55 Z" fill="${visual.primary}" opacity="0.8"/>`;
      break;
  }

  return `
    <svg width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${plantName.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${visual.secondary};stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:${visual.accent};stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="120" height="100" fill="url(#bg-${plantName.replace(/[^a-zA-Z0-9]/g, '')})" rx="8"/>
      
      <!-- Plant pattern -->
      ${patternElement}
      
      <!-- Plant name -->
      <text x="60" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#333" opacity="0.7">
        ${plantName.length > 25 ? plantName.substring(0, 22) + '...' : plantName}
      </text>
    </svg>
  `;
}

async function createSVGForPlant(plantName) {
  try {
    // Find the plant by name
    const [plant] = await db.select().from(plants).where(eq(plants.name, plantName));
    
    if (!plant) {
      console.log(`Plant "${plantName}" not found in database`);
      return false;
    }
    
    // Check if plant already has an image
    if (plant.imageData) {
      console.log(`Plant "${plantName}" already has an image, skipping...`);
      return true;
    }
    
    const visual = plantVisuals[plantName];
    if (!visual) {
      console.log(`No visual config for "${plantName}"`);
      return false;
    }
    
    // Create SVG
    const svgContent = createPlantSVG(plantName, visual);
    const base64Data = Buffer.from(svgContent).toString('base64');
    
    // Update database
    await db.execute(sql`
      UPDATE plants 
      SET image_data = ${base64Data}, 
          image_mime_type = 'image/svg+xml'
      WHERE id = ${plant.id}
    `);
    
    console.log(`✅ Created SVG placeholder for ${plantName}`);
    return true;
  } catch (error) {
    console.error(`Error creating SVG for ${plantName}:`, error.message);
    return false;
  }
}

async function createAllSVGPlaceholders() {
  console.log('🎨 Creating attractive SVG placeholders for remaining plants...\n');
  
  let successCount = 0;
  const plantNames = Object.keys(plantVisuals);
  
  for (const plantName of plantNames) {
    console.log(`📸 Creating SVG for ${plantName}...`);
    const success = await createSVGForPlant(plantName);
    if (success) successCount++;
  }
  
  console.log(`\n🎉 SVG creation complete!`);
  console.log(`   Successfully created: ${successCount}/${plantNames.length} SVG placeholders`);
  
  // Show final status
  const allPlants = await db.execute(sql`
    SELECT id, name, 
           CASE WHEN image_data IS NOT NULL THEN 'YES' ELSE 'NO' END as has_image,
           image_mime_type
    FROM plants 
    ORDER BY name
  `);
  
  console.log(`\n📊 Final image status:`);
  allPlants.forEach(plant => {
    const status = plant.has_image === 'YES' ? '✅' : '❌';
    const type = plant.image_mime_type ? `(${plant.image_mime_type.split('/')[1]})` : '';
    console.log(`   ${status} ${plant.name} ${type}`);
  });
  
  const totalWithImages = allPlants.filter(p => p.has_image === 'YES').length;
  console.log(`\n🌟 Total plants with images: ${totalWithImages}/${allPlants.length}`);
}

// Run the script
createAllSVGPlaceholders().catch(console.error);