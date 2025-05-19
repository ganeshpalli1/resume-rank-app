import React from "react";

const JobPosts = () => {
  return (
    <div className="min-h-screen bg-resume-background/50">
      <div className="w-full py-4 px-4 md:px-6">
        <h2 className="text-2xl font-bold text-resume-text mb-6">Job Posts</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No job posts available yet. Create your first job post by clicking on "New Job" in the sidebar.</p>
        </div>
      </div>
    </div>
  );
};

export default JobPosts; 