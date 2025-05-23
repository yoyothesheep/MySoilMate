import { useState } from "react";
import { Plant } from "@shared/schema";
import { PlantCard } from "./PlantCard";
import { PlantDetailModal } from "./PlantDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlantGridProps {
  plants: Plant[];
  isLoading: boolean;
  onSortChange: (sortOption: string) => void;
}

export function PlantGrid({ plants, isLoading, onSortChange }: PlantGridProps) {
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
  
  return (
    <div className="flex-1">
      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {isLoading ? "Loading plants..." : `${plants.length} Plants`}
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="text-gray-500">No plants found matching your criteria.</div>
          <div className="text-sm text-gray-400 mt-2">Try adjusting your filters or search term.</div>
        </div>
      )}
      
      {/* Pagination - would normally be implemented with real pagination data */}
      {plants.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <button className="px-3 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50" disabled>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 inline mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <div className="flex items-center space-x-1">
            <span className="px-3 py-1 bg-primary text-white rounded">1</span>
            <span className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded cursor-pointer">2</span>
            <span className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded cursor-pointer">3</span>
          </div>
          <button className="px-3 py-1 rounded text-sm text-gray-700 hover:bg-gray-100">
            Next
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 inline ml-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Plant Detail Modal */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
