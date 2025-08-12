import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { SunIcon, DropletIcon, TemperatureIcon, HumidityIcon, CheckCircleIcon, WarningIcon } from "./icons/PlantIcons";
import { MapPin, Upload } from "lucide-react";
import { addPlantToCollection } from "@/lib/plantData";
import { useToast } from "@/hooks/use-toast";
import { PlantImageUpload } from "./PlantImageUpload";

interface PlantDetailModalProps {
  plant: Plant & { 
    plantZones?: Array<{ zone: { zone: string } }>;
    plantLightLevels?: Array<{ lightLevel: { level: string } }>;
    plantBloomSeasons?: Array<{ bloomSeason: { season: string } }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onAddToGarden?: (plant: Plant) => void;
}

export function PlantDetailModal({ plant, isOpen, onClose, onAddToGarden }: PlantDetailModalProps) {
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const { toast } = useToast();
  
  if (!isOpen) return null;
  
  const handleAddToCollection = async () => {
    setIsAddingToCollection(true);
    try {
      await addPlantToCollection(plant.id);
      toast({
        title: "Success!",
        description: `${plant.name} has been added to your collection.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add plant to your collection.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const handleAddToGarden = () => {
    if (onAddToGarden) {
      onAddToGarden(plant);
      onClose(); // Close modal after adding to garden
    }
  };
  
  // Parse care instructions and common issues into array items
  const careInstructions = plant.careInstructions?.split('.').filter(item => item.trim()) || [];
  const commonIssues = plant.commonIssues?.split('.').filter(item => item.trim().length > 0) || [];
  
  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button 
              type="button" 
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 relative">
              <img 
                src={`/api/plants/${plant.id}/image`}
                alt={plant.name} 
                className="h-64 md:h-full w-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src.includes('/api/plants/') && plant.imageUrl) {
                    img.src = plant.imageUrl;
                  } else {
                    img.src = 'https://via.placeholder.com/400x500?text=Plant+Image+Unavailable';
                  }
                }}
              />
              
              {/* Image upload button overlay */}
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                onClick={() => setShowImageUpload(!showImageUpload)}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              
              {/* Image upload component */}
              {showImageUpload && (
                <div className="absolute inset-0 bg-white/95 p-4 flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <PlantImageUpload
                      plantId={plant.id}
                      onImageUploaded={() => {
                        setShowImageUpload(false);
                        // Force image refresh by updating the src with timestamp
                        const img = document.querySelector(`img[alt="${plant.name}"]`) as HTMLImageElement;
                        if (img) {
                          img.src = `/api/plants/${plant.id}/image?t=${Date.now()}`;
                        }
                        toast({
                          title: "Image updated",
                          description: "Plant image has been updated successfully.",
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 p-6 custom-scrollbar" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{plant.name}</h3>
              <p className="text-sm italic text-gray-600 mb-4">{plant.scientificName}</p>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-4">{plant.description}</p>
              </div>
              
              {/* Plant Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                
                {/* Light Levels */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <SunIcon className="text-yellow-500 mr-2 h-5 w-5" />
                    Light Requirements
                  </div>
                  <p className="text-sm text-gray-600">
                    {plant.plantLightLevels?.length ? 
                      plant.plantLightLevels.map(pll => pll.lightLevel.level).join(', ') : 
                      'Light information not available'
                    }
                  </p>
                </div>
                
                {/* Water Needs */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <DropletIcon className="text-blue-500 mr-2 h-5 w-5" />
                    Water Needs
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {plant.waterNeeds || 'Water information not available'}
                  </p>
                </div>
                
                {/* Plant Size */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0V6a2 2 0 01-2 2H6a2 2 0 01-2-2V4m3 0h8M9 12v6m6-6v6" />
                    </svg>
                    Plant Size
                  </div>
                  <p className="text-sm text-gray-600">
                    Height: {plant.height || 'Not specified'}<br/>
                    Width: {plant.width || 'Not specified'}
                  </p>
                </div>
                
                {/* Bloom Seasons */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <svg className="w-5 h-5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Bloom Seasons
                  </div>
                  <p className="text-sm text-gray-600">
                    {plant.plantBloomSeasons?.length ? 
                      plant.plantBloomSeasons.map(pbs => pbs.bloomSeason.season).join(', ') : 
                      'Bloom season not specified'
                    }
                  </p>
                </div>
                
                {/* Hardiness Zones */}
                <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <MapPin className="text-green-600 mr-2 h-5 w-5" />
                    Hardiness Zones
                  </div>
                  <p className="text-sm text-gray-600">
                    {plant.plantZones?.length ? 
                      `USDA Zones ${plant.plantZones.map(pz => pz.zone.zone).join(', ')}` : 
                      'Zone information not available'
                    }
                  </p>
                </div>
                
              </div>
              
              {careInstructions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Care Instructions</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {careInstructions.map((instruction, index) => (
                      instruction.trim() && (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="text-primary mt-0.5 mr-2 h-5 w-5" />
                          <span>{instruction.trim()}</span>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}
              
              {commonIssues.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Common Issues</h4>
                  <div className="space-y-3 text-sm">
                    {commonIssues.map((issue, index) => {
                      const [title, description] = issue.split(':').map(s => s.trim());
                      if (!title) return null;
                      
                      return (
                        <div key={index} className="flex items-start">
                          <WarningIcon className="text-yellow-500 mt-0.5 mr-2 h-5 w-5" />
                          <div>
                            <p className="font-medium text-gray-700">{title}</p>
                            {description && <p className="text-gray-600">{description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                {onAddToGarden ? (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={handleAddToGarden}
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Garden Design
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 justify-center px-4 py-2 text-sm font-medium border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={handleAddToCollection}
                    disabled={isAddingToCollection}
                  >
                    {isAddingToCollection ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                    Add to My Collection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
