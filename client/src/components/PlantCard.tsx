import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { SunIcon } from "./icons/PlantIcons";
import { MapPin, Flower } from "lucide-react";

interface PlantCardProps {
  plant: Plant & { 
    plantZones?: Array<{ zone: { zone: string } }>;
  };
  onClick: () => void;
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  // Format bloom season for display
  const formatBloomSeason = (bloomSeason: string): string => {
    return bloomSeason;
  };

  // Get image source - use API endpoint first, fallback to URL
  const getImageSrc = () => {
    // Always try the API endpoint first (this will serve database images)
    return `/api/plants/${plant.id}/image`;
  };
  
  return (
    <div className="plant-card bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-lg">
      <img 
        src={getImageSrc()} 
        alt={plant.name} 
        className="h-56 w-full object-cover"
        onError={(e) => {
          // If API endpoint fails, try the original imageUrl, then fallback
          const img = e.target as HTMLImageElement;
          if (img.src.includes('/api/plants/') && plant.imageUrl) {
            img.src = plant.imageUrl;
          } else {
            img.src = 'https://via.placeholder.com/400x300?text=Plant+Image+Unavailable';
          }
        }}
      />
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{plant.name}</h3>
            <p className="text-sm text-gray-500 italic">{plant.scientificName}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center">
            <SunIcon className="text-yellow-500 mr-1 h-4 w-4" />
            <span>{plant.lightLevel.charAt(0).toUpperCase() + plant.lightLevel.slice(1)} Light</span>
          </div>
          <div className="flex items-center">
            <Flower className="text-pink-500 mr-1 h-4 w-4" />
            <span>{formatBloomSeason(plant.bloomSeason || 'Spring-Summer')}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="text-green-600 mr-1 h-4 w-4" />
            <span>Zones {plant.plantZones ? plant.plantZones.map(pz => pz.zone.zone).join(', ') : 'N/A'}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 mb-6 w-full flex items-center justify-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={onClick}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
