import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlantHeader } from "@/components/PlantHeader";
import { PlantSidebar } from "@/components/PlantSidebar";
import { PlantGrid } from "@/components/PlantGrid";
import { PlantFooter } from "@/components/PlantFooter";
import { buildQueryString } from "@/lib/plantData";
import { type PlantFilter } from "@shared/schema";

export default function Home() {
  const [filter, setFilter] = useState<PlantFilter>({
    search: "",
    lightLevels: [],
    waterNeeds: [],
    difficultyLevels: [],
    sort: "name"
  });
  
  // Fetch plants based on current filter
  const { data: plants = [], isLoading } = useQuery({
    queryKey: [`/api/plants?${buildQueryString(filter)}`],
    keepPreviousData: true,
  });
  
  const handleSearch = (search: string) => {
    setFilter(prev => ({ ...prev, search }));
  };
  
  const handleFilterChange = (
    filterType: 'lightLevels' | 'waterNeeds' | 'difficultyLevels', 
    values: string[]
  ) => {
    setFilter(prev => ({ ...prev, [filterType]: values }));
  };
  
  const handleClearFilters = () => {
    setFilter(prev => ({
      ...prev,
      lightLevels: [],
      waterNeeds: [],
      difficultyLevels: []
    }));
  };
  
  const handleSortChange = (sortOption: string) => {
    setFilter(prev => ({ ...prev, sort: sortOption }));
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-light">
      <PlantHeader onSearch={handleSearch} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <PlantSidebar 
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            
            <PlantGrid 
              plants={plants} 
              isLoading={isLoading} 
              onSortChange={handleSortChange}
            />
          </div>
        </div>
      </main>
      
      <PlantFooter />
    </div>
  );
}
