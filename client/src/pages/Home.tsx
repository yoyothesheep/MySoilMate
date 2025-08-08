import { useState } from "react";
import bannerImage from "@assets/assets_task_01k255cg7zf1sbf84p3kf7nzhe_1754667700_img_1_1754667891304.webp";

import { PlantSidebar } from "@/components/PlantSidebar";
import { PlantGrid } from "@/components/PlantGrid";
import { PlantFooter } from "@/components/PlantFooter";
import { GardenDesignerPanel } from "@/components/GardenDesignerPanel";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { type PlantFilter, type Plant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<PlantFilter>({
    search: "",
    lightLevels: [],
    waterNeeds: [],
    growZones: [],
    bloomSeasons: [],
    heights: [],
    sort: "name",
    page: 1,
    limit: 15
  });
  
  const [isGardenDesignerOpen, setIsGardenDesignerOpen] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState<Plant[]>([]);
  
  // Use infinite scroll hook for loading plants
  const { 
    plants, 
    totalCount, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    loadMore 
  } = useInfiniteScroll(filter);
  
  const handleSearch = (search: string) => {
    setFilter(prev => ({ ...prev, search }));
  };
  
  const handleFilterChange = (
    filterType: 'lightLevels' | 'waterNeeds' | 'growZones' | 'bloomSeasons' | 'heights', 
    values: string[]
  ) => {
    setFilter(prev => ({ ...prev, [filterType]: values }));
  };
  
  const handleClearFilters = () => {
    setFilter(prev => ({
      ...prev,
      lightLevels: [],
      waterNeeds: [],
      growZones: [],
      bloomSeasons: [],
      heights: []
    }));
  };
  

  
  const handleOpenGardenDesigner = () => {
    if (selectedPlants.length === 0) {
      toast({
        title: "No plants selected",
        description: "Please select some plants for your garden design first.",
        variant: "destructive",
      });
    } else {
      setIsGardenDesignerOpen(true);
    }
  };
  
  const handleCloseGardenDesigner = () => {
    setIsGardenDesignerOpen(false);
  };
  
  const handleAddPlantToSelection = (plant: Plant) => {
    // Check if the plant is already selected
    if (selectedPlants.some(p => p.id === plant.id)) {
      toast({
        title: "Already selected",
        description: `${plant.name} is already in your garden selection.`,
      });
      return;
    }
    
    setSelectedPlants(prev => [...prev, plant]);
    toast({
      title: "Plant added",
      description: `${plant.name} has been added to your garden selection.`,
    });
  };
  
  const handleRemovePlantFromSelection = (plantId: number) => {
    setSelectedPlants(prev => prev.filter(plant => plant.id !== plantId));
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light">
      {/* Hero Header Section */}
      <section 
        className="relative py-16 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
            Garden Designer
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Discover outdoor plants and design your perfect garden layout with our interactive garden visualizer.
          </p>
        </div>
      </section>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {selectedPlants.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-green-800">Garden Selection</h2>
                  <p className="text-sm text-green-600">
                    You have selected {selectedPlants.length} plant{selectedPlants.length !== 1 ? 's' : ''} for your garden design.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleOpenGardenDesigner}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                  >
                    Open Designer
                  </button>
                  <button 
                    onClick={() => setSelectedPlants([])}
                    className="px-3 py-1 bg-white text-green-700 text-sm border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPlants.map((plant) => (
                  <div key={plant.id} className="flex items-center px-2 py-1 bg-white border border-green-200 rounded-full text-sm">
                    <span className="mr-1">{plant.name}</span>
                    <button 
                      onClick={() => handleRemovePlantFromSelection(plant.id)}
                      className="h-4 w-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-6">
            <PlantSidebar 
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onSearch={handleSearch}
            />
            
            <PlantGrid 
              plants={plants} 
              totalCount={totalCount}
              isLoading={isLoading} 
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onAddPlantToSelection={handleAddPlantToSelection}
              onLoadMore={loadMore}
            />
          </div>
        </div>
      </main>
      
      <PlantFooter />
      
      <GardenDesignerPanel 
        isOpen={isGardenDesignerOpen}
        onClose={handleCloseGardenDesigner}
        selectedPlants={selectedPlants}
        onRemovePlant={handleRemovePlantFromSelection}
      />
    </div>
  );
}
