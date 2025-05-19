import React from "react";
import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-10 flex items-center justify-between px-4 md:pl-64">
      <div className="flex items-center md:hidden">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 mx-4">
        <h1 className="text-lg font-semibold text-resume-primary hidden md:block">Resume Rank</h1>
      </div>
      
      <div className="flex items-center">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="ml-4 flex items-center">
          <div className="w-8 h-8 rounded-full bg-resume-primary flex items-center justify-center text-white">
            <span className="text-sm">U</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 