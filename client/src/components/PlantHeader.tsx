import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PlantLeaf } from "./icons/PlantIcons";
import { Button } from "@/components/ui/button";

interface PlantHeaderProps {
  onSearch: (search: string) => void;
  onOpenGardenDesigner: () => void;
}

export function PlantHeader({ onSearch, onOpenGardenDesigner }: PlantHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <PlantLeaf className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-gray-900">Garden Designer</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-2xl px-4 md:px-8">
            <div className="relative w-full mt-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                type="text"
                className="block w-full pl-10 pr-3 py-2 rounded-md text-sm bg-neutral-light border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Search garden plants by name or features..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <Button 
              onClick={onOpenGardenDesigner}
              className="flex items-center px-3 py-2 bg-primary text-white hover:bg-primary-dark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Design My Garden
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
