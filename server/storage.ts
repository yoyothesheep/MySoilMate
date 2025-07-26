import { 
  users, type User, type InsertUser,
  plants, type Plant, type InsertPlant, 
  plantFilterSchema, type PlantFilter,
  type PlantWithZones, type PaginatedPlantsResponse
} from "@shared/schema";

// Use database storage instead of memory storage for production

export interface IStorage {
  // User methods (keeping existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Plant methods
  getPlants(filter?: PlantFilter): Promise<PaginatedPlantsResponse>;
  getPlant(id: number): Promise<PlantWithZones | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: number, plant: Partial<InsertPlant>): Promise<Plant | undefined>;
  deletePlant(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private plants: Map<number, PlantWithZones>;
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
  async getPlants(filter?: PlantFilter): Promise<PaginatedPlantsResponse> {
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
      
      // Filter by grow zones
      if (filter.growZones && filter.growZones.length > 0) {
        plants = plants.filter(plant => 
          plant.plantZones.some(pz => filter.growZones!.includes(pz.zone.zone))
        );
      }
      
      // Sort plants
      if (filter.sort) {
        switch (filter.sort) {
          case 'name':
            plants.sort((a, b) => a.name.localeCompare(b.name));
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
          case 'zone':
            // Sort by lowest grow zone number
            plants.sort((a, b) => {
              const aLowestZone = Math.min(...a.plantZones.map(pz => parseInt(pz.zone.zone.replace(/[ab]/, ''))));
              const bLowestZone = Math.min(...b.plantZones.map(pz => parseInt(pz.zone.zone.replace(/[ab]/, ''))));
              return aLowestZone - bLowestZone;
            });
            break;
        }
      }
    }
    
    // Pagination
    const totalCount = plants.length;
    const page = filter?.page || 1;
    const limit = filter?.limit || 15;
    const offset = (page - 1) * limit;
    const paginatedPlants = plants.slice(offset, offset + limit);
    
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    return {
      plants: paginatedPlants,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage
    };
  }

  async getPlant(id: number): Promise<PlantWithZones | undefined> {
    return this.plants.get(id);
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = this.plantCurrentId++;
    const plant: Plant = { ...insertPlant, id };
    const plantWithZones: PlantWithZones = { ...plant, plantZones: [] };
    this.plants.set(id, plantWithZones);
    return plant;
  }

  async updatePlant(id: number, updatePlant: Partial<InsertPlant>): Promise<Plant | undefined> {
    const existingPlant = this.plants.get(id);
    if (!existingPlant) return undefined;
    
    const updatedPlantWithZones = { ...existingPlant, ...updatePlant };
    this.plants.set(id, updatedPlantWithZones);
    // Fix type compatibility
    const { plantZones, ...plantData } = updatedPlantWithZones;
    return plantData;
  }

  async deletePlant(id: number): Promise<boolean> {
    return this.plants.delete(id);
  }

  private seedPlants() {
    const plantData: InsertPlant[] = [
      {
        name: "Lavender",
        scientificName: "Lavandula",
        description: "Lavender is a fragrant perennial with silvery-gray foliage and purple flowers. It's deer-resistant, drought-tolerant, and attracts pollinators to the garden.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Lavender_flowers.jpg/1200px-Lavender_flowers.jpg",
        lightLevel: "bright",
        waterNeeds: "low",
        bloomSeason: "Summer",
        bloomTime: "Mid to late summer, with peak bloom in July and August",
        temperature: "Hardy in zones 5-9. Prefers temperatures between 60-80°F (15-27°C).",
        humidity: "Prefers dry conditions. Good air circulation is important.",
        careInstructions: "Plant in well-draining soil with full sun exposure. Water deeply but infrequently once established. Prune in early spring to maintain shape. Harvest flowers when they first bloom for the strongest fragrance.",
        commonIssues: "Root Rot: Usually caused by overwatering or poor drainage. Powdery Mildew: Often appears in humid conditions with poor air circulation."
      },
      {
        name: "Black-Eyed Susan",
        scientificName: "Rudbeckia hirta",
        description: "Black-Eyed Susan is a cheerful wildflower with golden-yellow petals and dark brown centers. It's a robust, low-maintenance addition to any garden.",
        imageUrl: "https://extension.umd.edu/sites/extension.umd.edu/files/styles/optimized/public/2021-03/black-eyed-susan-rudbeckia.jpg",
        lightLevel: "bright",
        waterNeeds: "medium",
        bloomSeason: "Summer-Fall",
        bloomTime: "Blooms from midsummer through fall, lasting 6-8 weeks",
        temperature: "Hardy in zones 3-9. Tolerates summer heat well.",
        humidity: "Adaptable to various humidity levels.",
        careInstructions: "Plant in well-draining soil in full sun. Water regularly until established, then only during prolonged dry spells. Deadhead spent blooms to encourage more flowers. Divide every 3-4 years to maintain vigor.",
        commonIssues: "Powdery Mildew: Can develop in humid conditions. Leaf Spot: Often appears in wet conditions or with overcrowding."
      },
      {
        name: "Foxglove",
        scientificName: "Digitalis",
        description: "Foxglove produces tall spikes of tubular flowers in various colors. It's a classic cottage garden plant that adds height and drama to borders.",
        imageUrl: "https://cdn.britannica.com/32/197432-050-DF9B15A9/flowers-Common-foxglove.jpg",
        lightLevel: "medium",
        waterNeeds: "medium",
        bloomSeason: "Late Spring-Summer",
        bloomTime: "Flowers from late spring through early summer, typically May to July",
        temperature: "Hardy in zones 4-9. Prefers cool summers.",
        humidity: "Adaptable to average humidity levels.",
        careInstructions: "Plant in rich, well-draining soil in partial shade. Water regularly, especially during dry periods. Stake tall varieties to prevent flopping. Allow to self-seed for continuous plants or deadhead to prevent spreading.",
        commonIssues: "Crown Rot: Usually caused by wet, heavy soils. Leaf Spot: Often appears in wet, humid conditions. Note: All parts are toxic if ingested."
      },
      {
        name: "Butterfly Bush",
        scientificName: "Buddleja davidii",
        description: "Butterfly Bush features cone-shaped clusters of fragrant flowers that attract butterflies and hummingbirds. It's a fast-growing shrub with arching branches.",
        imageUrl: "https://www.naturehills.com/media/catalog/product/cache/3a5e947e0f566242390a54e26840d069/b/l/black-knight-butterfly-bush-overview-3.jpg",
        lightLevel: "bright",
        waterNeeds: "medium",
        bloomSeason: "Summer-Fall",
        bloomTime: "Continuous blooms from summer through first frost",
        temperature: "Hardy in zones 5-9. Tolerates heat well.",
        humidity: "Adaptable to various humidity levels.",
        careInstructions: "Plant in well-draining soil in full sun. Water regularly until established, then only during dry spells. Prune back hard in early spring to maintain shape and encourage blooming.",
        commonIssues: "Spider Mites: Can occur during hot, dry conditions. Root Rot: Usually caused by poor drainage. Note: Can be invasive in some regions."
      },
      {
        name: "Hosta",
        scientificName: "Hosta spp.",
        description: "Hostas are shade-loving perennials grown primarily for their attractive foliage in various colors, sizes, and textures. They're perfect for adding interest to shady spots.",
        imageUrl: "https://www.thespruce.com/thmb/Kf-_D_C7kvCO0fYlz57cKtpfcmc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/plantain-lily-plants-hosta-1402844-07-fc41b84a98fe40249ea85cd122f36f23.jpg",
        lightLevel: "low",
        waterNeeds: "medium",
        bloomSeason: "Summer",
        bloomTime: "Tall flower stalks appear in mid to late summer",
        temperature: "Hardy in zones 3-9. Prefers moderate temperatures.",
        humidity: "Prefers moderate humidity.",
        careInstructions: "Plant in rich, well-draining soil in shade or partial shade. Water regularly, especially during dry periods. Divide every 4-5 years to maintain vigor. Apply mulch to retain moisture and suppress weeds.",
        commonIssues: "Slug Damage: Usually affects leaves, especially in wet conditions. Deer Browsing: Often a favorite food for deer."
      },
      {
        name: "Russian Sage",
        scientificName: "Perovskia atriplicifolia",
        description: "Russian Sage is a woody subshrub with silvery-gray foliage and lavender-blue flowers. It's extremely drought-tolerant and provides long-lasting summer color.",
        imageUrl: "https://hips.hearstapps.com/hmg-prod/images/close-up-of-perovskia-atriplicifolia-russian-sage-royalty-free-image-958113360-1563981908.jpg",
        lightLevel: "bright",
        waterNeeds: "low",
        bloomSeason: "Summer-Fall",
        bloomTime: "Long blooming period from mid-summer through early fall",
        temperature: "Hardy in zones 4-9. Tolerates heat and cold well.",
        humidity: "Prefers dry conditions.",
        careInstructions: "Plant in lean, well-draining soil in full sun. Water occasionally until established, then rarely. Cut back to 6 inches in early spring to promote compact growth.",
        commonIssues: "Root Rot: Usually caused by overwatering or poor drainage. Legginess: Often caused by insufficient sunlight or lack of pruning."
      },
      {
        name: "Coneflower",
        scientificName: "Echinacea purpurea",
        description: "Coneflower is a native wildflower with daisy-like blooms and a prominent cone-shaped center. It's drought-tolerant, attracts pollinators, and has medicinal properties.",
        imageUrl: "https://www.gardeningknowhow.com/wp-content/uploads/2023/02/echinacea-flower.jpg",
        lightLevel: "bright",
        waterNeeds: "low",
        bloomSeason: "Summer-Fall",
        bloomTime: "Blooms from early summer through fall with proper deadheading",
        temperature: "Hardy in zones 3-9. Tolerates heat and humidity well.",
        humidity: "Adaptable to various humidity levels.",
        careInstructions: "Plant in well-draining soil in full sun. Water regularly until established, then only during prolonged dry spells. Deadhead spent blooms to encourage more flowers or leave for winter interest and bird food.",
        commonIssues: "Japanese Beetles: Can damage flowers and foliage. Powdery Mildew: May develop in humid conditions with poor air circulation."
      },
      {
        name: "Hydrangea",
        scientificName: "Hydrangea macrophylla",
        description: "Hydrangeas are flowering shrubs with large, showy blooms that can change color based on soil pH. They're classic garden plants that add charm to partially shaded areas.",
        imageUrl: "https://www.almanac.com/sites/default/files/styles/or/public/image_nodes/hydrangea-pink-planting-growing.jpg",
        lightLevel: "medium",
        waterNeeds: "high",
        bloomSeason: "Summer",
        bloomTime: "Large flower clusters appear from early to mid-summer",
        temperature: "Hardy in zones 6-9 (varies by variety). Prefers moderate temperatures.",
        humidity: "Prefers moderate to high humidity.",
        careInstructions: "Plant in rich, well-draining soil in morning sun and afternoon shade. Water deeply and regularly, especially in dry periods. Prune after flowering or in early spring, depending on variety. Add aluminum sulfate to soil for blue flowers or lime for pink (in bigleaf varieties).",
        commonIssues: "Wilting: Usually caused by underwatering or excessive heat. Powdery Mildew: Can develop in humid conditions with poor air circulation."
      },
      {
        name: "Ornamental Grass",
        scientificName: "Miscanthus sinensis",
        description: "Ornamental grasses add texture, movement, and year-round interest to gardens. They're low-maintenance, drought-tolerant, and provide winter habitat for beneficial insects.",
        imageUrl: "https://extension.umn.edu/sites/extension.umn.edu/files/styles/large/public/Purple%20miscanthus.jpg",
        lightLevel: "bright",
        waterNeeds: "low",
        bloomSeason: "Fall",
        bloomTime: "Feathery plumes appear in late summer to early fall",
        temperature: "Hardy in zones 5-9 (varies by variety). Tolerates heat and cold well.",
        humidity: "Adaptable to various humidity levels.",
        careInstructions: "Plant in well-draining soil in full sun. Water occasionally until established, then rarely. Cut back to a few inches above ground in late winter before new growth emerges.",
        commonIssues: "Rust: Can appear as orange spots on foliage. Flopping: May occur with tall varieties in shade or overly rich soil."
      },
      {
        name: "Sedum",
        scientificName: "Sedum 'Autumn Joy'",
        description: "Sedum is a succulent perennial with fleshy leaves and star-shaped flowers that bloom in late summer to fall. It's extremely drought-tolerant and attracts pollinators.",
        imageUrl: "https://www.highcountrygardens.com/media/catalog/product/s/e/sedum_autumn_joy_1.jpg",
        lightLevel: "bright",
        waterNeeds: "low",
        bloomSeason: "Late Summer-Fall",
        bloomTime: "Flowers change from pink to rusty red from late summer through fall",
        temperature: "Hardy in zones 3-9. Tolerates heat and drought well.",
        humidity: "Prefers dry conditions.",
        careInstructions: "Plant in well-draining soil in full sun. Water occasionally until established, then rarely. Divide every 3-4 years to maintain vigor. Leave seedheads for winter interest or cut back in early spring.",
        commonIssues: "Root Rot: Usually caused by overwatering or poor drainage. Legginess: Often occurs in too much shade."
      },
      {
        name: "Daylily",
        scientificName: "Hemerocallis",
        description: "Daylilies are rugged, adaptable perennials with strap-like foliage and lily-like flowers. Each bloom lasts only one day, but plants produce many buds for weeks of color.",
        imageUrl: "https://www.thespruce.com/thmb/kHtxU1zNLWuP9YCqB7Kg9l-haIM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/grow-daylily-plants-1402714-01-555394bb5fc94624bd90a1a4c9dd21e6.jpg",
        lightLevel: "bright",
        waterNeeds: "medium",
        bloomSeason: "Summer",
        bloomTime: "Each flower lasts one day, but continuous blooms for 4-6 weeks",
        temperature: "Hardy in zones 3-9. Tolerates heat and humidity well.",
        humidity: "Adaptable to various humidity levels.",
        careInstructions: "Plant in well-draining soil in full sun to light shade. Water regularly until established, then only during prolonged dry spells. Divide every 3-5 years to maintain vigor. Remove spent flower stalks to prevent seeding.",
        commonIssues: "Daylily Rust: Appears as orange-brown spots on foliage. Deer Browsing: Often a favorite food for deer."
      },
      {
        name: "Azalea",
        scientificName: "Rhododendron",
        description: "Azaleas are flowering shrubs with vibrant blooms in spring. They add a burst of color to woodland gardens and shaded landscapes.",
        imageUrl: "https://www.thespruce.com/thmb/fBHI3rr48-U-UZ2dXMVwTmAUfRY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/grow-azaleas-successfully-1402812-01-5e3a3ae1a45d4e809f97196c30416d2a.jpg",
        lightLevel: "medium",
        waterNeeds: "medium",
        bloomSeason: "Spring",
        bloomTime: "Spectacular display of flowers in mid to late spring",
        temperature: "Hardy in zones 4-9 (varies by variety). Prefers moderate temperatures.",
        humidity: "Prefers moderate humidity.",
        careInstructions: "Plant in acidic, well-draining soil in dappled shade. Water regularly, especially during dry periods. Mulch to retain moisture and suppress weeds. Prune after flowering if needed.",
        commonIssues: "Lace Bugs: Can cause stippled, discolored foliage. Chlorosis: Yellow leaves often caused by alkaline soil."
      }
    ];
    
    plantData.forEach(plant => {
      this.createPlant(plant);
    });
  }
}

// Use database storage
import { DatabaseStorage } from './database-storage';
export const storage = new DatabaseStorage();
