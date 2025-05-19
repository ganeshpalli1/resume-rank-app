import React from "react";
import { JobDescription } from "@/types/resume";
import ScoringWeightsInfo from "./ScoringWeightsInfo";

interface ResumeAnalysisHeaderProps {
  jobDescription: JobDescription;
  resumeCount: number;
}

const ResumeAnalysisHeader: React.FC<ResumeAnalysisHeaderProps> = ({
  jobDescription,
  resumeCount,
}) => {
  return (
    <div className="mb-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-resume-text mb-2">
        Resume Analysis
      </h1>
      <div className="bg-resume-background border border-resume-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h2 className="text-xl font-semibold text-resume-text">
              {jobDescription.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing {resumeCount} {resumeCount === 1 ? "resume" : "resumes"}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex items-center bg-resume-primary/10 text-resume-primary px-3 py-1 rounded-full text-sm font-medium">
              Real-time ATS Analysis
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-resume-text">
              Key Skills Required
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {jobDescription.skills.slice(0, 5).map((skill, index) => (
                <span
                  key={index}
                  className="bg-resume-primary/5 text-resume-text px-2 py-1 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {jobDescription.skills.length > 5 && (
                <span className="bg-resume-background text-resume-text px-2 py-1 rounded text-xs">
                  +{jobDescription.skills.length - 5} more
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-resume-text">
              Requirements
            </h3>
            <div className="mt-2">
              {jobDescription.requirements.slice(0, 2).map((req, index) => (
                <div
                  key={index}
                  className="text-xs text-muted-foreground mb-1"
                >
                  • {req}
                </div>
              ))}
              {jobDescription.requirements.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{jobDescription.requirements.length - 2} more requirements
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-resume-text">
              Job Description
            </h3>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
              {jobDescription.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Scoring Weights Info */}
      <div className="mt-4">
        <ScoringWeightsInfo />
      </div>
    </div>
  );
};

export default ResumeAnalysisHeader;
