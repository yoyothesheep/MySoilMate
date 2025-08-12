import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { SunIcon } from "./icons/PlantIcons";
import { Sprout, Flower } from "lucide-react";

interface PlantCardProps {
  plant: Plant & { 
    plantZones?: Array<{ zone: { zone: string } }>;
    plantBloomSeasons?: Array<{ bloomSeason: { season: string } }>;
  };
  onClick: () => void;
  onAddToGarden?: (plant: Plant) => void;
}

export function PlantCard({ plant, onClick, onAddToGarden }: PlantCardProps) {
  // Format bloom season for display
  const formatBloomSeason = (bloomSeason: string): string => {
    return bloomSeason;
  };

  // Get image source - use image_url from database
  const getImageSrc = () => {
    return plant.imageUrl || 'https://via.placeholder.com/400x300?text=Plant+Image+Unavailable';
  };
  
  const handleAddToGarden = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onAddToGarden) {
      onAddToGarden(plant);
    }
  };

  return (
    <div 
      className="plant-card bg-white rounded-lg shadow overflow-hidden transition-all duration-300 hover:transform hover:translate-y-[-4px] hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={getImageSrc()} 
        alt={plant.name} 
        className="h-56 w-full object-cover"
        onError={(e) => {
          // Fallback to placeholder if image fails to load
          const img = e.target as HTMLImageElement;
          img.src = 'https://via.placeholder.com/400x300?text=Plant+Image+Unavailable';
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
            <span>{plant.lightLevel}</span>
          </div>
          <div className="flex items-center">
            <Flower className="text-pink-500 mr-1 h-4 w-4" />
            <span>
              {plant.plantBloomSeasons?.map(pbs => pbs.bloomSeason.season).join(", ") || "N/A"}
            </span>
          </div>
          <div className="flex items-center">
            <Sprout className="text-green-600 mr-1 h-4 w-4" />
            <span>{plant.height || 'Height varies'}</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
          onClick={handleAddToGarden}
        >
          + Add to Garden
        </Button>
      </div>
    </div>
  );
}
