import { useState } from "react";
import { Plant } from "@shared/schema";
import { PlantCard } from "./PlantCard";
import { PlantDetailModal } from "./PlantDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PlantGridProps {
  plants: Plant[];
  totalCount: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onSortChange: (sortOption: string) => void;
  onAddPlantToSelection?: (plant: Plant) => void;
  onLoadMore: () => void;
}

export function PlantGrid({ 
  plants, 
  totalCount, 
  isLoading, 
  isFetchingNextPage, 
  hasNextPage, 
  onSortChange, 
  onAddPlantToSelection, 
  onLoadMore 
}: PlantGridProps) {
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handlePlantClick = (plant: Plant) => {
    setSelectedPlant(plant);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSortChange = (value: string) => {
    onSortChange(value);
  };

  const handleAddToGarden = (plant: Plant) => {
    if (onAddPlantToSelection) {
      onAddPlantToSelection(plant);
    }
  };
  
  return (
    <div className="flex-1">
      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {isLoading ? "Loading plants..." : `${plants.length} of ${totalCount} Garden Plants`}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <Select onValueChange={handleSortChange} defaultValue="name">
            <SelectTrigger className="w-[160px] text-sm border-gray-300 rounded-md focus:border-primary focus:ring-primary h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="difficulty">Care Difficulty</SelectItem>
              <SelectItem value="light">Light Needs</SelectItem>
              <SelectItem value="zone">USDA Grow Zone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Plant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
              <div className="h-56 w-full bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : plants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plants.map((plant) => (
            <PlantCard 
              key={plant.id}
              plant={plant} 
              onClick={() => handlePlantClick(plant)}
              onAddToGarden={onAddPlantToSelection ? handleAddToGarden : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-gray-500">No plants found matching your criteria.</div>
          <div className="text-sm text-gray-400 mt-2">Try adjusting your filters or search term.</div>
        </div>
      )}
      
      {/* Infinite Scroll Loading */}
      {isFetchingNextPage && (
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
      
      {/* Load More Button (fallback for manual loading) */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={onLoadMore}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            Load More Plants
          </Button>
        </div>
      )}
      
      {/* End of results message */}
      {!hasNextPage && plants.length > 0 && (
        <div className="mt-8 text-center text-gray-500">
          You've reached the end of the plant gallery! 🌱
        </div>
      )}
      
      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToGarden={onAddPlantToSelection}
        />
      )}
    </div>
  );
}
