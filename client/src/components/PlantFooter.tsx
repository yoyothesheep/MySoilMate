import { PlantLeaf } from "./icons/PlantIcons";

export function PlantFooter() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <PlantLeaf className="text-primary h-5 w-5 mr-2" />
            <span className="text-gray-900 font-medium">PlantViz</span>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} PlantViz. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
