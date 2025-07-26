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
  
  if (filter.growZones && filter.growZones.length > 0) {
    params.append('growZones', filter.growZones.join(','));
  }
  
  if (filter.bloomSeasons && filter.bloomSeasons.length > 0) {
    params.append('bloomSeasons', filter.bloomSeasons.join(','));
  }
  
  if (filter.heights && filter.heights.length > 0) {
    params.append('heights', filter.heights.join(','));
  }
  
  if (filter.sort) {
    params.append('sort', filter.sort);
  }
  
  if (filter.page) {
    params.append('page', filter.page.toString());
  }
  
  if (filter.limit) {
    params.append('limit', filter.limit.toString());
  }
  
  return params.toString();
}

export async function addPlantToCollection(plantId: number): Promise<void> {
  // This is a placeholder function for adding plants to a user's collection
  // In a real app, this would make an API call to update a user's collection
  console.log(`Adding plant ${plantId} to collection`);
  return Promise.resolve();
}


