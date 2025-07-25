import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plant } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface PlantPosition {
  id: number;
  x: number;
  y: number;
  plant: Plant;
  width: number;
  height: number;
  rotation: number;
}

interface GardenDesignerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlants: Plant[];
  onRemovePlant: (plantId: number) => void;
}

export function GardenDesignerPanel({ 
  isOpen, 
  onClose, 
  selectedPlants,
  onRemovePlant 
}: GardenDesignerPanelProps) {
  const [gardenPlants, setGardenPlants] = useState<PlantPosition[]>([]);
  const [activePlant, setActivePlant] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const gardenRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize garden with plants
  useEffect(() => {
    // Clear garden when panel is opened
    if (isOpen && gardenPlants.length === 0) {
      // Set canvas size based on container dimensions
      if (gardenRef.current) {
        const { width, height } = gardenRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: height - 100 }); // Subtract height for the palette area
      }
    }
  }, [isOpen, gardenPlants.length]);

  // Function to add a plant to the garden
  const addPlantToGarden = (plant: Plant) => {
    // Generate a random position within the canvas
    const width = Math.max(80, Math.min(120, plant.name.length * 5));
    const height = width;
    const x = Math.random() * (canvasSize.width - width);
    const y = Math.random() * (canvasSize.height - height);
    const rotation = Math.floor(Math.random() * 360);
    
    setGardenPlants([
      ...gardenPlants,
      {
        id: Date.now(), // Use timestamp as unique ID
        x,
        y,
        plant,
        width,
        height,
        rotation
      }
    ]);
  };

  // Function to start dragging a plant
  const startDrag = (e: React.MouseEvent, plantId: number) => {
    const plant = gardenPlants.find(p => p.id === plantId);
    if (!plant) return;
    
    setActivePlant(plantId);
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
    e.stopPropagation();
  };

  // Function to handle dragging
  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || activePlant === null) return;
    
    const gardenRect = gardenRef.current?.getBoundingClientRect();
    if (!gardenRect) return;
    
    const x = e.clientX - gardenRect.left - dragOffset.x;
    const y = e.clientY - gardenRect.top - dragOffset.y;
    
    setGardenPlants(plants => 
      plants.map(plant => 
        plant.id === activePlant
          ? {
              ...plant,
              x: Math.max(0, Math.min(x, canvasSize.width - plant.width)),
              y: Math.max(0, Math.min(y, canvasSize.height - plant.height))
            }
          : plant
      )
    );
  };

  // Function to end dragging
  const endDrag = () => {
    setIsDragging(false);
    setActivePlant(null);
  };

  // Function to rotate a plant
  const rotatePlant = (plantId: number) => {
    setGardenPlants(plants => 
      plants.map(plant => 
        plant.id === plantId
          ? { ...plant, rotation: (plant.rotation + 45) % 360 }
          : plant
      )
    );
  };

  // Function to remove a plant from the garden
  const removePlantFromGarden = (plantId: number) => {
    setGardenPlants(plants => plants.filter(plant => plant.id !== plantId));
  };

  // Function to clear the garden
  const clearGarden = () => {
    setGardenPlants([]);
  };

  // Function to handle background image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to remove background image
  const removeBackgroundImage = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Function to trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold text-gray-800">Garden Designer</h2>
          <Button variant="ghost" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Garden Canvas */}
          <div 
            ref={gardenRef}
            className="flex-1 relative bg-green-50 border-r overflow-hidden"
            onMouseMove={handleDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            <div className="p-4 bg-green-100 border-b flex items-center justify-between">
              <h3 className="font-medium text-green-800">Garden Layout</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={triggerFileInput}
                  className="text-xs flex items-center"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Background
                </Button>
                {backgroundImage && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeBackgroundImage}
                    className="text-xs flex items-center text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove Background
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearGarden}
                  className="text-xs flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Garden
                </Button>
              </div>
            </div>
            
            <div 
              className="garden-area relative overflow-hidden"
              style={{
                height: `${canvasSize.height}px`,
                width: `${canvasSize.width}px`,
                backgroundImage: backgroundImage 
                  ? `url(${backgroundImage})`
                  : 'linear-gradient(#ccdfcc 1px, transparent 1px), linear-gradient(90deg, #ccdfcc 1px, transparent 1px)',
                backgroundSize: backgroundImage ? 'cover' : '20px 20px',
                backgroundPosition: backgroundImage ? 'center' : 'initial',
                backgroundRepeat: backgroundImage ? 'no-repeat' : 'initial'
              }}
            >
              {gardenPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="absolute cursor-move transition-transform"
                  style={{
                    left: `${plant.x}px`,
                    top: `${plant.y}px`,
                    width: `${plant.width}px`,
                    height: `${plant.height}px`,
                    zIndex: activePlant === plant.id ? 10 : 1,
                    transform: `rotate(${plant.rotation}deg)`,
                  }}
                  onMouseDown={(e) => startDrag(e, plant.id)}
                >
                  <div className="plant-item relative flex flex-col items-center justify-center h-full rounded-full">
                    <div className="absolute inset-0 rounded-full bg-white border-2 border-green-400 shadow-md overflow-hidden">
                      <img 
                        src={`/api/plants/${plant.plant.id}/image`}
                        alt={plant.plant.name}
                        className="h-full w-full object-cover"
                        style={{
                          filter: 'saturate(1.2)',
                          opacity: 0.85
                        }}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src.includes('/api/plants/') && plant.plant.imageUrl) {
                            img.src = plant.plant.imageUrl;
                          } else {
                            img.src = 'https://via.placeholder.com/100x100?text=Plant';
                          }
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 text-center px-1 py-0.5 bg-black bg-opacity-50 rounded-b-full">
                      <span className="text-xs font-medium text-white truncate">{plant.plant.name}</span>
                    </div>
                    <div className="absolute top-0 right-0 flex gap-1">
                      <button 
                        className="h-5 w-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-200 transition-colors"
                        onClick={() => rotatePlant(plant.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button 
                        className="h-5 w-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-200 transition-colors"
                        onClick={() => removePlantFromGarden(plant.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Plant Palette */}
          <div className="w-64 bg-white p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-700 mb-4">Selected Plants</h3>
            {selectedPlants.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p>You haven't selected any plants yet.</p>
                <p className="text-sm mt-2">Browse the plant catalog and select plants to add to your garden.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPlants.map((plant) => (
                  <div key={plant.id} className="flex group relative bg-gray-50 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow cursor-pointer">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img 
                        src={`/api/plants/${plant.id}/image`}
                        alt={plant.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src.includes('/api/plants/') && plant.imageUrl) {
                            img.src = plant.imageUrl;
                          } else {
                            img.src = 'https://via.placeholder.com/100?text=Plant';
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 p-2">
                      <h4 className="text-sm font-medium text-gray-800">{plant.name}</h4>
                      <div className="mt-1 flex items-center gap-1">
                        <Badge variant="outline" className="px-1 py-0 text-xs">
                          {plant.lightLevel}
                        </Badge>
                        <Badge variant="outline" className="px-1 py-0 text-xs">
                          {plant.waterNeeds}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            variant="secondary"
                            className="h-8 text-xs"
                            onClick={() => addPlantToGarden(plant)}
                          >
                            Add to Garden
                          </Button>
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => onRemovePlant(plant.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Garden Tips</h4>
              <ul className="text-xs text-gray-600 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  Drag plants to position them in your garden.
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  Use the rotate button to change plant orientation.
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  Consider plant light requirements when placing.
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-1">•</span>
                  Group plants with similar water needs together.
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Hidden file input for background image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}