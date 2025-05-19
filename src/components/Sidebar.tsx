import React from "react";
import { Link } from "react-router-dom";
import { FileText, LayoutGrid, CheckCircle, List, Home, FileSearch } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-white text-gray-800 flex flex-col fixed left-0 top-0 shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-resume-primary">Resume Rank</h2>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <LayoutGrid className="mr-3 h-5 w-5 text-resume-primary" />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/resumes" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FileText className="mr-3 h-5 w-5 text-resume-primary" />
              <span>New Job</span>
            </Link>
          </li>
          <li>
            <Link to="/analytics" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <List className="mr-3 h-5 w-5 text-resume-primary" />
              <span>Job Posts</span>
            </Link>
          </li>
          <li>
            <Link to="/results" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <CheckCircle className="mr-3 h-5 w-5 text-resume-primary" />
              <span>Results</span>
            </Link>
          </li>
          <li>
            <Link to="/resume-parsing" className="flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <FileSearch className="mr-3 h-5 w-5 text-resume-primary" />
              <span>Resume Parsing</span>
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-resume-primary flex items-center justify-center mr-2 text-white">
            <span className="text-sm">U</span>
          </div>
          <div>
            <p className="text-sm font-medium">User</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 