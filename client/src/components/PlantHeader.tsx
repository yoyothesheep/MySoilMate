import { PlantLeaf } from "./icons/PlantIcons";

interface PlantHeaderProps {}

export function PlantHeader({}: PlantHeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <PlantLeaf className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-gray-900">Garden Designer</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
