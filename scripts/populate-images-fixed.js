// Fixed script to populate plant database with real images from professional nursery sources
import fetch from 'node-fetch';
import { db } from '../server/db.js';
import { plants } from '../shared/schema.ts';
import { eq, sql } from 'drizzle-orm';

// Professional plant images from reputable nurseries and botanical sources
const plantImages = {
  // Exact names matching database
  "Cat's Pajamas Catmint": {
    url: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_cats_pajamas_apj20_14.jpg",
    alt: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_cats_pajamas.jpg"
  },
  
  "Purple Coneflower": {
    url: "https://www.prairiemoon.com/mm5/graphics/00000001/echinacea-purpurea-purple-coneflower-monarch-early-sunflower_483x730.jpg",
    alt: "https://www.prairiemoon.com/mm5/graphics/00000001/echinacea-purpurea-purple-coneflower_prairie_730x548.jpg"
  },
  
  "Black-Eyed Susan": {
    url: "https://www.wildflower.org/image_archive/320x240/LMP/LMP_IMG0084.JPG",
    alt: "https://www.wildflower.org/image_archive/160x120/JLR/JLR_IMG7197.JPG"
  },
  
  "Russian Sage": {
    url: "https://assets.highcountrygardens.com/media/catalog/product/b/l/blue-spire-russian-sage_1.jpg",
    alt: "https://assets.highcountrygardens.com/media/catalog/product/p/e/perovskia-blue-spires-russian-sage_1.jpg"
  },

  "Walker's Low Catmint": {
    url: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_walkers_low_1.jpg",
    alt: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_walkers_low_apj20_1.jpg"
  },

  "Lemon Coral Sedum": {
    url: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/sedum_lemon_coral_apj20_1.jpg",
    alt: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/sedum_lemon_coral.jpg"
  },

  "Diamond Frost Euphorbia": {
    url: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/euphorbia_diamond_frost_apj20_1.jpg",
    alt: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/euphorbia_diamond_frost.jpg"
  },

  "Husker Red Penstemon": {
    url: "https://www.highcountrygardens.com/media/catalog/product/h/u/husker-red-penstemon_1.jpg",
    alt: "https://www.highcountrygardens.com/media/catalog/product/p/e/penstemon-digitalis-husker-red_1.jpg"
  }
};

async function downloadImage(imageUrl) {
  try {
    console.log(`Downloading image from: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Response is not an image');
    }
    
    const imageBuffer = await response.arrayBuffer();
    return {
      data: Buffer.from(imageBuffer),
      mimeType: contentType
    };
  } catch (error) {
    console.error(`Failed to download image from ${imageUrl}:`, error.message);
    return null;
  }
}

async function updatePlantImage(plantName, imageUrl) {
  try {
    // Find the plant by name
    const [plant] = await db.select().from(plants).where(eq(plants.name, plantName));
    
    if (!plant) {
      console.log(`Plant "${plantName}" not found in database`);
      return false;
    }
    
    // Download the image
    const imageData = await downloadImage(imageUrl);
    if (!imageData) {
      console.log(`Failed to download image for ${plantName}`);
      return false;
    }
    
    // Convert to base64 and update the database (stored as text)
    const base64Data = imageData.data.toString('base64');
    await db.execute(sql`
      UPDATE plants 
      SET image_data = ${base64Data}, 
          image_mime_type = ${imageData.mimeType}
      WHERE id = ${plant.id}
    `);
    
    console.log(`✅ Successfully updated image for ${plantName} (${imageData.data.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`Error updating image for ${plantName}:`, error.message);
    return false;
  }
}

async function populateAllImages() {
  console.log('🌱 Starting to populate plant images from professional nursery sources...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Process main plant images
  for (const [plantName, imageInfo] of Object.entries(plantImages)) {
    totalCount++;
    console.log(`\n📸 Processing ${plantName}...`);
    
    const success = await updatePlantImage(plantName, imageInfo.url);
    if (success) {
      successCount++;
    } else if (imageInfo.alt) {
      // Try alternative URL if primary fails
      console.log(`   Trying alternative source...`);
      const altSuccess = await updatePlantImage(plantName, imageInfo.alt);
      if (altSuccess) successCount++;
    }
    
    // Small delay to be respectful to servers
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`\n🎉 Image population complete!`);
  console.log(`   Successfully updated: ${successCount}/${totalCount} plants`);
  console.log(`   Images are now stored in the database and will display in your app.`);
}

// Run the script
populateAllImages().catch(console.error);