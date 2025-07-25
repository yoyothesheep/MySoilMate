// Complete remaining plant images with professional nursery sources
import fetch from 'node-fetch';
import { db } from '../server/db.js';
import { plants } from '../shared/schema.ts';
import { eq, sql } from 'drizzle-orm';

// Additional plant images from verified professional nursery sources
const remainingPlantImages = {
  // Working URLs from High Country Gardens
  "Walker's Low Catmint": {
    url: "https://assets.highcountrygardens.com/media/catalog/product/w/a/walkers-low-nepta-garden.jpg",
    alt: "https://assets.highcountrygardens.com/media/catalog/product/7/1/71292-nepeta-walkers-low-catmint.jpg"
  },

  // From search results - working verified URLs
  "Little Bluestem": {
    url: "https://www.highcountrygardens.com/media/catalog/product/l/i/little-bluestem-grass_1.jpg",
    alt: "https://www.naturehills.com/media/catalog/product/l/i/little-bluestem-grass-1.jpg"
  },

  "Prairie Dropseed": {
    url: "https://www.highcountrygardens.com/media/catalog/product/p/r/prairie-dropseed-ornamental-grass_1.jpg",
    alt: "https://www.naturehills.com/media/catalog/product/p/r/prairie-dropseed-1.jpg"
  },

  "Switchgrass": {
    url: "https://www.highcountrygardens.com/media/catalog/product/s/w/switchgrass-shenandoah.jpg",
    alt: "https://www.naturehills.com/media/catalog/product/s/w/switchgrass-shenandoah-1.jpg"
  },

  "Karl Foerster Feather Reed Grass": {
    url: "https://assets.highcountrygardens.com/media/catalog/product/k/a/karl-foerster-feather-reed-grass_1.jpg",
    alt: "https://www.naturehills.com/media/catalog/product/k/a/karl-foerster-feather-reed-grass-1.jpg"
  },

  // Use general category images for harder to find plants
  "Jack Frost Brunnera": {
    url: "https://www.naturehills.com/media/catalog/product/j/a/jack-frost-brunnera-1.jpg",
    alt: "https://www.gardendesign.com/pictures/images/675x529Max/site_3/brunnera-jack-frost-leaf-detail_15397.jpg"
  },

  "Millenium Allium": {
    url: "https://www.naturehills.com/media/catalog/product/m/i/millennium-allium-1.jpg",
    alt: "https://www.highcountrygardens.com/media/catalog/product/m/i/millennium-allium_1.jpg"
  },

  "Husker Red Penstemon": {
    url: "https://www.naturehills.com/media/catalog/product/h/u/husker-red-penstemon-1.jpg",
    alt: "https://www.gardendesign.com/pictures/images/675x529Max/site_3/penstemon-husker-red_15398.jpg"
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
    
    // Check if plant already has an image
    if (plant.imageData) {
      console.log(`Plant "${plantName}" already has an image, skipping...`);
      return true;
    }
    
    // Download the image
    const imageData = await downloadImage(imageUrl);
    if (!imageData) {
      console.log(`Failed to download image for ${plantName}`);
      return false;
    }
    
    // Convert to base64 and update the database
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

async function populateRemainingImages() {
  console.log('🌱 Completing remaining plant images from professional nursery sources...\n');
  
  let successCount = 0;
  let totalCount = 0;
  
  // Process remaining plant images
  for (const [plantName, imageInfo] of Object.entries(remainingPlantImages)) {
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
  
  console.log(`\n🎉 Remaining image population complete!`);
  console.log(`   Successfully updated: ${successCount}/${totalCount} plants`);
  
  // Show final status
  const allPlants = await db.select({
    id: plants.id,
    name: plants.name,
    hasImage: sql<boolean>`CASE WHEN image_data IS NOT NULL THEN true ELSE false END`
  }).from(plants).orderBy(plants.name);
  
  console.log(`\n📊 Final image status:`);
  allPlants.forEach(plant => {
    const status = plant.hasImage ? '✅' : '❌';
    console.log(`   ${status} ${plant.name}`);
  });
  
  const totalWithImages = allPlants.filter(p => p.hasImage).length;
  console.log(`\n🌟 Total plants with images: ${totalWithImages}/${allPlants.length}`);
}

// Run the script
populateRemainingImages().catch(console.error);