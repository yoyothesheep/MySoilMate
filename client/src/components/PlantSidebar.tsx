import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface PlantSidebarProps {
  onFilterChange: (
    filterType: 'lightLevels' | 'waterNeeds' | 'growZones' | 'bloomSeasons' | 'heights', 
    values: string[]
  ) => void;
  onClearFilters: () => void;
}

export function PlantSidebar({ onFilterChange, onClearFilters }: PlantSidebarProps) {
  // Filter option definitions
  const lightLevels: FilterOption[] = [
    { id: 'light-low', label: 'Low Light', value: 'low' },
    { id: 'light-medium', label: 'Medium Light', value: 'medium' },
    { id: 'light-bright', label: 'Bright Light', value: 'bright' }
  ];
  
  const waterNeeds: FilterOption[] = [
    { id: 'water-low', label: 'Low', value: 'low' },
    { id: 'water-medium', label: 'Medium', value: 'medium' },
    { id: 'water-high', label: 'High', value: 'high' }
  ];
  

  
  const growZones: FilterOption[] = [
    { id: 'zone-3', label: 'Zone 3', value: '3' },
    { id: 'zone-4', label: 'Zone 4', value: '4' },
    { id: 'zone-5', label: 'Zone 5', value: '5' },
    { id: 'zone-6', label: 'Zone 6', value: '6' },
    { id: 'zone-7', label: 'Zone 7', value: '7' },
    { id: 'zone-8', label: 'Zone 8', value: '8' },
    { id: 'zone-9', label: 'Zone 9', value: '9' },
    { id: 'zone-10', label: 'Zone 10', value: '10' }
  ];

  const bloomSeasons: FilterOption[] = [
    { id: 'bloom-spring', label: 'Spring', value: 'Spring' },
    { id: 'bloom-summer', label: 'Summer', value: 'Summer' },
    { id: 'bloom-fall', label: 'Fall', value: 'Fall' },
    { id: 'bloom-winter', label: 'Winter', value: 'Winter' }
  ];

  const heights: FilterOption[] = [
    { id: 'height-small', label: 'Small (under 2 feet)', value: 'small' },
    { id: 'height-medium', label: 'Medium (2-4 feet)', value: 'medium' },
    { id: 'height-large', label: 'Large (over 4 feet)', value: 'large' }
  ];
  
  // State for selected filters
  const [selectedLightLevels, setSelectedLightLevels] = useState<string[]>([]);
  const [selectedWaterNeeds, setSelectedWaterNeeds] = useState<string[]>([]);
  const [selectedGrowZones, setSelectedGrowZones] = useState<string[]>([]);
  const [selectedBloomSeasons, setSelectedBloomSeasons] = useState<string[]>([]);
  const [selectedHeights, setSelectedHeights] = useState<string[]>([]);
  
  const handleLightLevelChange = (value: string) => {
    const updatedLevels = selectedLightLevels.includes(value)
      ? selectedLightLevels.filter(level => level !== value)
      : [...selectedLightLevels, value];
    
    setSelectedLightLevels(updatedLevels);
    onFilterChange('lightLevels', updatedLevels);
  };
  
  const handleWaterNeedsChange = (value: string) => {
    const updatedNeeds = selectedWaterNeeds.includes(value)
      ? selectedWaterNeeds.filter(need => need !== value)
      : [...selectedWaterNeeds, value];
    
    setSelectedWaterNeeds(updatedNeeds);
    onFilterChange('waterNeeds', updatedNeeds);
  };
  

  
  const handleGrowZoneChange = (value: string) => {
    const updatedZones = selectedGrowZones.includes(value)
      ? selectedGrowZones.filter(zone => zone !== value)
      : [...selectedGrowZones, value];
    
    setSelectedGrowZones(updatedZones);
    onFilterChange('growZones', updatedZones);
  };

  const handleBloomSeasonChange = (value: string) => {
    const updatedSeasons = selectedBloomSeasons.includes(value)
      ? selectedBloomSeasons.filter(season => season !== value)
      : [...selectedBloomSeasons, value];
    
    setSelectedBloomSeasons(updatedSeasons);
    onFilterChange('bloomSeasons', updatedSeasons);
  };

  const handleHeightChange = (value: string) => {
    const updatedHeights = selectedHeights.includes(value)
      ? selectedHeights.filter(height => height !== value)
      : [...selectedHeights, value];
    
    setSelectedHeights(updatedHeights);
    onFilterChange('heights', updatedHeights);
  };
  
  const handleClearFilters = () => {
    setSelectedLightLevels([]);
    setSelectedWaterNeeds([]);
    setSelectedGrowZones([]);
    setSelectedBloomSeasons([]);
    setSelectedHeights([]);
    onClearFilters();
  };
  
  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          
          {/* Light Level Filter */}
          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Light Level</h3>
            <div className="space-y-2">
              {lightLevels.map((level) => (
                <div key={level.id} className="flex items-center">
                  <input
                    id={level.id}
                    type="checkbox"
                    className="filter-checkbox h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary hidden"
                    checked={selectedLightLevels.includes(level.value)}
                    onChange={() => handleLightLevelChange(level.value)}
                  />
                  <label htmlFor={level.id} className="flex items-center cursor-pointer">
                    <span 
                      className={`h-5 w-5 border border-gray-300 rounded flex items-center justify-center mr-2 relative ${
                        selectedLightLevels.includes(level.value) ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <span 
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedLightLevels.includes(level.value) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">{level.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Water Needs Filter */}
          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Water Needs</h3>
            <div className="space-y-2">
              {waterNeeds.map((need) => (
                <div key={need.id} className="flex items-center">
                  <input
                    id={need.id}
                    type="checkbox"
                    className="filter-checkbox h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary hidden"
                    checked={selectedWaterNeeds.includes(need.value)}
                    onChange={() => handleWaterNeedsChange(need.value)}
                  />
                  <label htmlFor={need.id} className="flex items-center cursor-pointer">
                    <span 
                      className={`h-5 w-5 border border-gray-300 rounded flex items-center justify-center mr-2 relative ${
                        selectedWaterNeeds.includes(need.value) ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <span 
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedWaterNeeds.includes(need.value) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">{need.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          

          
          {/* Bloom Season Filter */}
          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Bloom Season</h3>
            <div className="space-y-2">
              {bloomSeasons.map((season) => (
                <div key={season.id} className="flex items-center">
                  <input
                    id={season.id}
                    type="checkbox"
                    className="filter-checkbox h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary hidden"
                    checked={selectedBloomSeasons.includes(season.value)}
                    onChange={() => handleBloomSeasonChange(season.value)}
                  />
                  <label htmlFor={season.id} className="flex items-center cursor-pointer">
                    <span 
                      className={`h-5 w-5 border border-gray-300 rounded flex items-center justify-center mr-2 relative ${
                        selectedBloomSeasons.includes(season.value) ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <span 
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedBloomSeasons.includes(season.value) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">{season.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Height Filter */}
          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-700 mb-3">Plant Height</h3>
            <div className="space-y-2">
              {heights.map((height) => (
                <div key={height.id} className="flex items-center">
                  <input
                    id={height.id}
                    type="checkbox"
                    className="filter-checkbox h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary hidden"
                    checked={selectedHeights.includes(height.value)}
                    onChange={() => handleHeightChange(height.value)}
                  />
                  <label htmlFor={height.id} className="flex items-center cursor-pointer">
                    <span 
                      className={`h-5 w-5 border border-gray-300 rounded flex items-center justify-center mr-2 relative ${
                        selectedHeights.includes(height.value) ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <span 
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedHeights.includes(height.value) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">{height.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* USDA Grow Zone Filter */}
          <div className="mb-6">
            <h3 className="font-medium text-sm text-gray-700 mb-3">USDA Grow Zone</h3>
            <p className="text-xs text-gray-500 mb-3">Select your hardiness zone</p>
            <div className="grid grid-cols-2 gap-2">
              {growZones.map((zone) => (
                <div key={zone.id} className="flex items-center">
                  <input
                    id={zone.id}
                    type="checkbox"
                    className="filter-checkbox h-4 w-4 border-gray-300 rounded text-primary focus:ring-primary hidden"
                    checked={selectedGrowZones.includes(zone.value)}
                    onChange={() => handleGrowZoneChange(zone.value)}
                  />
                  <label htmlFor={zone.id} className="flex items-center cursor-pointer">
                    <span 
                      className={`h-5 w-5 border border-gray-300 rounded flex items-center justify-center mr-2 relative ${
                        selectedGrowZones.includes(zone.value) ? 'bg-primary border-primary' : ''
                      }`}
                    >
                      <span 
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedGrowZones.includes(zone.value) ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path 
                            fillRule="evenodd" 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </span>
                    </span>
                    <span className="text-sm text-gray-700">{zone.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <Button 
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
