import { type Plant, type PlantFilter } from "@shared/schema";
import { apiRequest } from "./queryClient";

export function buildQueryString(filter: PlantFilter): string {
  const params = new URLSearchParams();
  
  if (filter.search) {
    params.append('search', filter.search);
  }
  
  if (filter.lightLevels && filter.lightLevels.length > 0) {
    params.append('lightLevels', filter.lightLevels.join(','));
  }
  
  if (filter.waterNeeds && filter.waterNeeds.length > 0) {
    params.append('waterNeeds', filter.waterNeeds.join(','));
  }
  
  if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
    params.append('difficultyLevels', filter.difficultyLevels.join(','));
  }
  
  if (filter.sort) {
    params.append('sort', filter.sort);
  }
  
  return params.toString();
}

export async function addPlantToCollection(plantId: number): Promise<void> {
  // This is a placeholder function for adding plants to a user's collection
  // In a real app, this would make an API call to update a user's collection
  console.log(`Adding plant ${plantId} to collection`);
  return Promise.resolve();
}

export function getDifficultyColor(difficultyLevel: string): string {
  switch (difficultyLevel.toLowerCase()) {
    case 'beginner':
      return 'bg-green-100 text-green-800';
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800';
    case 'expert':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
