import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { SunIcon, DropletIcon, TemperatureIcon, HumidityIcon, CheckCircleIcon, WarningIcon } from "./icons/PlantIcons";
import { MapPin, Upload } from "lucide-react";
import { addPlantToCollection } from "@/lib/plantData";
import { useToast } from "@/hooks/use-toast";
import { PlantImageUpload } from "./PlantImageUpload";

// Component for handling plant image display with object storage
function PlantImage({ plantId, plant, className }: { plantId: number; plant: any; className: string }) {
  const [imageUrl, setImageUrl] = useState<string>('');
  
  useEffect(() => {
    if (plant.imageStoragePath) {
      fetch(`/api/plants/${plantId}/image`)
        .then(res => res.json())
        .then(data => setImageUrl(data.imageUrl))
        .catch(() => setImageUrl('https://via.placeholder.com/400x500?text=Plant+Image+Unavailable'));
    } else if (plant.imageUrl) {
      setImageUrl(plant.imageUrl);
    } else {
      setImageUrl('https://via.placeholder.com/400x500?text=Plant+Image+Unavailable');
    }
  }, [plantId, plant.imageStoragePath, plant.imageUrl]);

  return (
    <img 
      src={imageUrl}
      alt={plant.name} 
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=Plant+Image+Unavailable';
      }}
    />
  );
}

interface PlantDetailModalProps {
  plant: Plant & { 
    growZones?: Array<{ zone: string }>;
    imageStoragePath?: string;
    imageMimeType?: string;
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
              <PlantImage plantId={plant.id} plant={plant} className="h-64 md:h-full w-full object-cover" />
              
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
                        // Optionally refresh the plant data here
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
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <SunIcon className="text-yellow-500 mr-2 h-5 w-5" />
                    Light
                  </div>
                  <p className="text-sm text-gray-600">
                    {plant.lightLevel === 'low' ? 'Low light. Can tolerate shady conditions.' :
                     plant.lightLevel === 'medium' ? 'Medium to bright indirect light. Avoid direct sunlight.' :
                     'Bright indirect light. Some direct morning sun is beneficial.'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <DropletIcon className="text-blue-500 mr-2 h-5 w-5" />
                    Water
                  </div>
                  <p className="text-sm text-gray-600">
                    {plant.waterNeeds === 'low' ? 'Water when the soil is completely dry. Drought tolerant.' :
                     plant.waterNeeds === 'medium' ? 'Water when the top 1-2 inches of soil are dry. Reduce watering in winter.' :
                     'Keep soil consistently moist but not soggy. Water when the top soil feels slightly dry.'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <MapPin className="text-green-600 mr-2 h-5 w-5" />
                    USDA Grow Zone
                  </div>
                  <p className="text-sm text-gray-600">
                    Zones {plant.growZones ? plant.growZones.map(gz => gz.zone).join(', ') : 'N/A'}. This plant is suitable for these USDA hardiness zones.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <TemperatureIcon className="text-red-500 mr-2 h-5 w-5" />
                    Temperature
                  </div>
                  <p className="text-sm text-gray-600">{plant.temperature || 'Prefers temperatures between 65-80°F (18-27°C). Avoid cold drafts and sudden temperature changes.'}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <div className="flex items-center text-gray-700 font-medium mb-2">
                    <HumidityIcon className="text-green-500 mr-2 h-5 w-5" />
                    Humidity
                  </div>
                  <p className="text-sm text-gray-600">{plant.humidity || 'Adapts to normal outdoor humidity levels. Consider additional watering during dry periods.'}</p>
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
