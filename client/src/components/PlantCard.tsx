import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { SunIcon, DropletIcon } from "./icons/PlantIcons";
import { MapPin } from "lucide-react";

interface PlantCardProps {
  plant: Plant & { 
    growZones?: Array<{ zone: string }>;
    imageStoragePath?: string;
    imageMimeType?: string;
  };
  onClick: () => void;
}

export function PlantCard({ plant, onClick }: PlantCardProps) {
  // Format water needs for display
  const formatWaterNeeds = (waterNeeds: string): string => {
    switch (waterNeeds.toLowerCase()) {
      case 'low':
        return 'When completely dry';
      case 'medium':
        return 'When top inch is dry';
      case 'high':
        return 'Keep soil moist';
      default:
        return waterNeeds;
    }
  };

  // Get image source - prioritize object storage over URLs
  const [imageUrl, setImageUrl] = useState<string>('');
  
  useEffect(() => {
    if (plant.imageStoragePath) {
      // Fetch signed URL from API
      fetch(`/api/plants/${plant.id}/image`)
        .then(res => res.json())
        .then(data => setImageUrl(data.imageUrl))
        .catch(() => setImageUrl('https://via.placeholder.com/400x300?text=Plant+Image+Unavailable'));
    } else if (plant.imageUrl) {
      setImageUrl(plant.imageUrl);
    } else {
      setImageUrl('https://via.placeholder.com/400x300?text=Plant+Image+Unavailable');
    }
  }, [plant.id, plant.imageStoragePath, plant.imageUrl]);
  
  return (
    <div className="plant-card bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-lg">
      <img 
        src={imageUrl} 
        alt={plant.name} 
        className="h-56 w-full object-cover"
        onError={(e) => {
          // Fallback image if the plant image fails to load
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Plant+Image+Unavailable';
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
            <DropletIcon className="text-blue-500 mr-1 h-4 w-4" />
            <span>{formatWaterNeeds(plant.waterNeeds)}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="text-green-600 mr-1 h-4 w-4" />
            <span>Zones {plant.growZones ? plant.growZones.map(gz => gz.zone).join(', ') : 'N/A'}</span>
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
