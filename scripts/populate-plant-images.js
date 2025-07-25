// Script to populate plant database with real images from reputable nursery sources
import fetch from 'node-fetch';
import { db } from '../server/db.js';
import { plants } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

// Professional plant images from reputable nurseries and botanical sources
const plantImages = {
  // Cat's Pajamas Catmint - Proven Winners (professional nursery images)
  "Cat's Pajamas Catmint": {
    url: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_cats_pajamas_apj20_14.jpg",
    alt: "https://www.provenwinners.com/sites/provenwinners.com/files/imagecache/500x500/ifa_upload/nepeta_cats_pajamas.jpg"
  },
  
  // Purple Coneflower - Prairie Moon Nursery (native plant specialist)
  "Purple Coneflower": {
    url: "https://www.prairiemoon.com/mm5/graphics/00000001/echinacea-purpurea-purple-coneflower-monarch-early-sunflower_483x730.jpg",
    alt: "https://www.prairiemoon.com/mm5/graphics/00000001/echinacea-purpurea-purple-coneflower_main_68x90.jpg"
  },
  
  // Black-Eyed Susan - Native plant database
  "Black-Eyed Susan": {
    url: "https://www.wildflower.org/image_archive/320x240/LMP/LMP_IMG0084.JPG",
    alt: "https://www.wildflower.org/image_archive/160x120/JLR/JLR_IMG7197.JPG"
  },
  
  // Russian Sage - High Country Gardens (professional nursery)
  "Russian Sage": {
    url: "https://assets.highcountrygardens.com/media/catalog/product/b/l/blue-spire-russian-sage_1.jpg",
    alt: "https://assets.highcountrygardens.com/media/catalog/product/p/e/perovskia-blue-spires-russian-sage_1.jpg"
  }
};

// Additional professional nursery sources for other plants
const additionalSources = {
  "Hydrangea": "https://www.almanac.com/sites/default/files/styles/or/public/image_nodes/hydrangea-pink-planting-growing.jpg",
  "Hosta": "https://www.thespruce.com/thmb/Kf-_D_C7kvCO0fYlz57cKtpfcmc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/plantain-lily-plants-hosta-1402844-07-fc41b84a98fe40249ea85cd122f36f23.jpg",
  "Foxglove": "https://cdn.britannica.com/32/197432-050-DF9B15A9/flowers-Common-foxglove.jpg",
  "Sedum": "https://www.highcountrygardens.com/media/catalog/product/s/e/sedum_autumn_joy_1.jpg",
  "Daylily": "https://www.thespruce.com/thmb/kHtxU1zNLWuP9YCqB7Kg9l-haIM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/grow-daylily-plants-1402714-01-555394bb5fc94624bd90a1a4c9dd21e6.jpg",
  "Azalea": "https://www.thespruce.com/thmb/fBHI3rr48-U-UZ2dXMVwTmAUfRY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/grow-azaleas-successfully-1402812-01-5e3a3ae1a45d4e809f97196c30416d2a.jpg"
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
    
    // Update the plant with the image data 
    await db
      .update(plants)
      .set({
        imageData: imageData.data,
        imageMimeType: imageData.mimeType
      })
      .where(eq(plants.id, plant.id));
    
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
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Process additional sources
  for (const [plantName, imageUrl] of Object.entries(additionalSources)) {
    totalCount++;
    console.log(`\n📸 Processing ${plantName}...`);
    
    const success = await updatePlantImage(plantName, imageUrl);
    if (success) successCount++;
    
    // Small delay to be respectful to servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Image population complete!`);
  console.log(`   Successfully updated: ${successCount}/${totalCount} plants`);
  console.log(`   Images are now stored in the database and will display in your app.`);
}

// Run the script
populateAllImages().catch(console.error);