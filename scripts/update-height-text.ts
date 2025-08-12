import { db } from "../server/db";
import { plants } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateHeightTexts() {
  console.log("Updating height_text values for existing plants...");
  
  const allPlants = await db.select().from(plants);
  
  for (const plant of allPlants) {
    let heightText = "Medium"; // Default
    
    // Parse height information to determine category
    const heightStr = plant.height.toLowerCase();
    
    // Check for various height indicators
    if (heightStr.includes("inch")) {
      const inches = parseInt(heightStr.match(/(\d+)/)?.[1] || "0");
      if (inches <= 18) {
        heightText = "Short";
      } else if (inches <= 36) {
        heightText = "Medium";
      } else {
        heightText = "Tall";
      }
    } else if (heightStr.includes("feet") || heightStr.includes("ft")) {
      const feet = parseInt(heightStr.match(/(\d+)/)?.[1] || "0");
      if (feet <= 1.5) {
        heightText = "Short";
      } else if (feet <= 3) {
        heightText = "Medium";
      } else {
        heightText = "Tall";
      }
    } else {
      // Use some heuristics based on plant name or description
      const plantInfo = (plant.name + " " + plant.description).toLowerCase();
      if (plantInfo.includes("dwarf") || plantInfo.includes("compact") || plantInfo.includes("low") || plantInfo.includes("short")) {
        heightText = "Short";
      } else if (plantInfo.includes("tall") || plantInfo.includes("large") || plantInfo.includes("tree")) {
        heightText = "Tall";
      }
    }
    
    // Update the plant with height_text
    await db.update(plants)
      .set({ heightText })
      .where(eq(plants.id, plant.id));
    
    console.log(`Updated ${plant.name}: ${heightText}`);
  }
  
  console.log("Height text update completed!");
}

updateHeightTexts().catch(console.error);