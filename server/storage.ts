import { 
  users, type User, type InsertUser,
  plants, type Plant, type InsertPlant, 
  plantFilterSchema, type PlantFilter
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods (keeping existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plant methods
  getPlants(filter?: PlantFilter): Promise<Plant[]>;
  getPlant(id: number): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plants: Map<number, Plant>;
  userCurrentId: number;
  plantCurrentId: number;

  constructor() {
    this.users = new Map();
    this.plants = new Map();
    this.userCurrentId = 1;
    this.plantCurrentId = 1;
    
    // Initialize with some plant data
    this.seedPlants();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Plant methods
  async getPlants(filter?: PlantFilter): Promise<Plant[]> {
    let plants = Array.from(this.plants.values());
    
    if (filter) {
      // Filter by search term
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        plants = plants.filter(plant => 
          plant.name.toLowerCase().includes(searchTerm) || 
          plant.scientificName.toLowerCase().includes(searchTerm) ||
          plant.description.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by light levels
      if (filter.lightLevels && filter.lightLevels.length > 0) {
        plants = plants.filter(plant => 
          filter.lightLevels!.some(level => plant.lightLevel.toLowerCase().includes(level.toLowerCase()))
        );
      }
      
      // Filter by water needs
      if (filter.waterNeeds && filter.waterNeeds.length > 0) {
        plants = plants.filter(plant => 
          filter.waterNeeds!.some(need => plant.waterNeeds.toLowerCase().includes(need.toLowerCase()))
        );
      }
      
      // Filter by difficulty levels
      if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
        plants = plants.filter(plant => 
          filter.difficultyLevels!.includes(plant.difficultyLevel)
        );
      }
      
      // Sort plants
      if (filter.sort) {
        switch (filter.sort) {
          case 'name':
            plants.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'difficulty':
            // Sort by difficulty (beginner -> expert)
            const difficultyOrder = { beginner: 1, intermediate: 2, expert: 3 };
            plants.sort((a, b) => 
              difficultyOrder[a.difficultyLevel as keyof typeof difficultyOrder] - 
              difficultyOrder[b.difficultyLevel as keyof typeof difficultyOrder]
            );
            break;
          case 'light':
            // Sort by light needs (low -> bright)
            const lightOrder = { low: 1, medium: 2, bright: 3 };
            plants.sort((a, b) => {
              const aLight = a.lightLevel.toLowerCase().includes('low') ? 'low' : 
                a.lightLevel.toLowerCase().includes('medium') ? 'medium' : 'bright';
              const bLight = b.lightLevel.toLowerCase().includes('low') ? 'low' : 
                b.lightLevel.toLowerCase().includes('medium') ? 'medium' : 'bright';
              return lightOrder[aLight as keyof typeof lightOrder] - 
                     lightOrder[bLight as keyof typeof lightOrder];
            });
            break;
        }
      }
    }
    
    return plants;
  }

  async getPlant(id: number): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = this.plantCurrentId++;
    const plant: Plant = { ...insertPlant, id };
    this.plants.set(id, plant);
    return plant;
  }

  async updatePlant(id: number, updatePlant: Partial<InsertPlant>): Promise<Plant | undefined> {
    const existingPlant = this.plants.get(id);
    if (!existingPlant) return undefined;
    
    const updatedPlant = { ...existingPlant, ...updatePlant };
    this.plants.set(id, updatedPlant);
    return updatedPlant;
  }

  async deletePlant(id: number): Promise<boolean> {
    return this.plants.delete(id);
  }

  private seedPlants() {
    const plantData: InsertPlant[] = [
      {
        name: "Monstera Deliciosa",
        scientificName: "Swiss Cheese Plant",
        description: "The Monstera Deliciosa is known for its stunning split leaves and minimal care requirements. Native to the tropical forests of southern Mexico and Panama, it has become one of the most popular houseplants worldwide.",
        imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
        lightLevel: "medium",
        waterNeeds: "medium",
        difficultyLevel: "beginner",
        temperature: "Thrives in temperatures between 65-85°F (18-29°C). Avoid cold drafts.",
        humidity: "Prefers moderate to high humidity. Mist occasionally or use a humidifier.",
        careInstructions: "Wipe the leaves with a damp cloth monthly to remove dust. Repot every 2-3 years or when roots begin growing through drainage holes. Use a support pole for the plant to climb as it grows. Fertilize monthly during spring and summer with a balanced houseplant fertilizer.",
        commonIssues: "Yellow Leaves: Usually indicates overwatering. Allow soil to dry out more between waterings. Brown Leaf Tips: Often caused by low humidity. Increase humidity around the plant."
      },
      {
        name: "Golden Pothos",
        scientificName: "Epipremnum aureum",
        description: "The Golden Pothos is an easy-to-care-for trailing plant with heart-shaped, variegated leaves. It's known for its air-purifying qualities and ability to thrive in various light conditions.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcvNtDbXsD5Yo0sVUbAu3WexgKYTKNq5u7CA&usqp=CAU",
        lightLevel: "low",
        waterNeeds: "low",
        difficultyLevel: "beginner",
        temperature: "Thrives in temperatures between 65-85°F (18-29°C).",
        humidity: "Adaptable to normal indoor humidity levels.",
        careInstructions: "Allow soil to dry out between waterings. Trim leggy stems to promote bushier growth. Can be propagated easily in water.",
        commonIssues: "Yellowing Leaves: Often caused by overwatering. Brown Spots: Usually due to direct sunlight exposure."
      },
      {
        name: "Snake Plant",
        scientificName: "Sansevieria trifasciata",
        description: "The Snake Plant is virtually indestructible and features tall, rigid leaves that grow vertically. It's excellent for beginners and known for its air-purifying abilities.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSW1uRnbL8eP8xPJMT8xrJGqRzUjidp0VnGJw&usqp=CAU",
        lightLevel: "low",
        waterNeeds: "low",
        difficultyLevel: "beginner",
        temperature: "Adaptable to temperatures between 55-85°F (13-29°C).",
        humidity: "Tolerates dry indoor air very well.",
        careInstructions: "Water only when soil is completely dry. Wipe leaves occasionally to remove dust. Repot only when root-bound.",
        commonIssues: "Soft, Mushy Leaves: Indicates overwatering. Brown tips: Usually caused by fluoride in tap water."
      },
      {
        name: "Fiddle Leaf Fig",
        scientificName: "Ficus lyrata",
        description: "The Fiddle Leaf Fig features large, violin-shaped leaves and can grow into an impressive indoor tree. It's popular but requires some attention to thrive.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMDNGlMoEBQGCO5a60HhgOwb0Bt6JFoJwYZg&usqp=CAU",
        lightLevel: "bright",
        waterNeeds: "medium",
        difficultyLevel: "intermediate",
        temperature: "Prefers temperatures between 65-75°F (18-24°C).",
        humidity: "Benefits from moderate to high humidity.",
        careInstructions: "Water when the top inch of soil is dry. Rotate periodically for even growth. Clean leaves with a damp cloth. Avoid relocating frequently.",
        commonIssues: "Brown spots: Usually caused by overwatering. Leaf drop: Often due to drafts, temperature changes, or relocation stress."
      },
      {
        name: "Peace Lily",
        scientificName: "Spathiphyllum",
        description: "The Peace Lily features elegant white flowers and glossy green leaves. It's known for its air-purifying qualities and ability to thrive in low light.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5jvqGH6KxjxO-2t3W8Njt3nwAKxLQx8fVpA&usqp=CAU",
        lightLevel: "low",
        waterNeeds: "medium",
        difficultyLevel: "beginner",
        temperature: "Prefers temperatures between 65-80°F (18-27°C).",
        humidity: "Enjoys higher humidity levels.",
        careInstructions: "Water when the plant starts to droop slightly. Mist regularly to increase humidity. Fertilize lightly every 6-8 weeks during growing season.",
        commonIssues: "Brown leaf tips: Usually caused by dry air or fluoride in water. Yellow leaves: Often due to overwatering."
      },
      {
        name: "ZZ Plant",
        scientificName: "Zamioculcas zamiifolia",
        description: "The ZZ Plant features glossy, dark green leaves and is incredibly drought-tolerant. It's perfect for beginners and can survive in low light conditions.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv5JKhIuHcRc-G5ykJXAwAVXRdBE0cVrCkSA&usqp=CAU",
        lightLevel: "low",
        waterNeeds: "low",
        difficultyLevel: "beginner",
        temperature: "Tolerates temperatures between 65-80°F (18-27°C).",
        humidity: "Adapts well to normal indoor humidity.",
        careInstructions: "Allow soil to dry out completely between waterings. Wipe leaves occasionally to remove dust. Can go weeks without water.",
        commonIssues: "Yellow leaves: Usually indicates overwatering. Rarely has pest problems."
      },
      {
        name: "Rubber Plant",
        scientificName: "Ficus elastica",
        description: "The Rubber Plant features glossy, leather-like leaves and can grow into a tall indoor tree. It's relatively easy to care for and makes a bold statement.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQOFjHC5iJPpcpITQj0NN6jbQaPODDO7y5hQQ&usqp=CAU",
        lightLevel: "medium",
        waterNeeds: "medium",
        difficultyLevel: "beginner",
        temperature: "Prefers temperatures between 60-80°F (15-27°C).",
        humidity: "Adapts to normal indoor humidity.",
        careInstructions: "Water when the top inch of soil is dry. Wipe leaves regularly to maintain glossiness. Prune in spring to control size and shape.",
        commonIssues: "Leaf drop: Usually caused by temperature fluctuations or relocation. Yellow leaves: Often indicates overwatering."
      },
      {
        name: "Calathea Medallion",
        scientificName: "Calathea medallion",
        description: "The Calathea Medallion features stunning patterned leaves that move up and down throughout the day. It requires a bit more attention but rewards with beautiful foliage.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuOlAXArhZYkgqGsF0zHyR7G9xvdYCiBx_uQ&usqp=CAU",
        lightLevel: "medium",
        waterNeeds: "high",
        difficultyLevel: "intermediate",
        temperature: "Prefers temperatures between 65-80°F (18-27°C).",
        humidity: "Requires high humidity levels to thrive.",
        careInstructions: "Keep soil consistently moist but not soggy. Use distilled or filtered water. Mist regularly or use a humidifier nearby.",
        commonIssues: "Crispy leaf edges: Usually caused by low humidity or tap water. Curling leaves: Often indicates underwatering or low humidity."
      },
      {
        name: "String of Pearls",
        scientificName: "Senecio rowleyanus",
        description: "The String of Pearls features unique bead-like leaves on trailing stems. It's a striking succulent that works well in hanging planters.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTr9EV4ETWbZAnL_CMl_0w20qnOcAD_8_OCtA&usqp=CAU",
        lightLevel: "bright",
        waterNeeds: "low",
        difficultyLevel: "intermediate",
        temperature: "Thrives in temperatures between 70-80°F (21-27°C).",
        humidity: "Prefers drier conditions.",
        careInstructions: "Allow soil to dry completely between waterings. Place in bright, indirect light. Water sparingly in winter.",
        commonIssues: "Shriveled pearls: Usually indicates underwatering. Mushy stems: Often caused by overwatering."
      },
      {
        name: "Chinese Money Plant",
        scientificName: "Pilea peperomioides",
        description: "The Chinese Money Plant features round, coin-shaped leaves on thin stems. It's become very popular for its unique appearance and ease of propagation.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_rLqPwQn38NXoCKb3UWXmDQs3i3VGvuCocA&usqp=CAU",
        lightLevel: "medium",
        waterNeeds: "medium",
        difficultyLevel: "beginner",
        temperature: "Prefers temperatures between 65-75°F (18-24°C).",
        humidity: "Adapts to normal indoor humidity.",
        careInstructions: "Water when the top inch of soil is dry. Rotate regularly for even growth. Remove baby plants to propagate new plants.",
        commonIssues: "Curling leaves: Usually indicates too much direct sunlight. Pale leaves: Often caused by too much light."
      },
      {
        name: "Bird of Paradise",
        scientificName: "Strelitzia nicolai",
        description: "The Bird of Paradise features large, banana-like leaves and can produce striking orange and blue flowers when mature. It makes a dramatic statement in any space.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqgcJu5EG8Dp8Z-T3i3WF8NlWx0Vv78Y3H8A&usqp=CAU",
        lightLevel: "bright",
        waterNeeds: "medium",
        difficultyLevel: "intermediate",
        temperature: "Thrives in temperatures between 65-85°F (18-29°C).",
        humidity: "Prefers moderate to high humidity.",
        careInstructions: "Water when the top 2 inches of soil are dry. Place in the brightest spot available. Wipe leaves regularly to remove dust. Fertilize monthly during growing season.",
        commonIssues: "Brown leaf edges: Usually caused by low humidity. Lack of growth: Often indicates insufficient light."
      },
      {
        name: "Boston Fern",
        scientificName: "Nephrolepis exaltata",
        description: "The Boston Fern features feathery, arching fronds and is one of the most popular fern varieties. It adds a lush, tropical feel to any space.",
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_WB0lKZJyaPqhMdAGB7TioPYXvgOGjZQQUg&usqp=CAU",
        lightLevel: "medium",
        waterNeeds: "high",
        difficultyLevel: "intermediate",
        temperature: "Prefers temperatures between 60-75°F (15-24°C).",
        humidity: "Requires high humidity to thrive.",
        careInstructions: "Keep soil consistently moist but not soggy. Mist frequently or place on a humidity tray. Keep away from heating vents and drafts.",
        commonIssues: "Brown fronds: Usually indicates low humidity or underwatering. Yellowing fronds: Often caused by overwatering or too much direct sunlight."
      }
    ];
    
    plantData.forEach(plant => {
      this.createPlant(plant);
    });
  }
}

export const storage = new MemStorage();
