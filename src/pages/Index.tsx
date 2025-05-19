import React, { useState, useMemo } from "react";
import ResumeDropzone from "@/components/ResumeDropzone";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import { Resume, ResumeScore, JobDescription } from "@/types/resume";
import { analyzeResumes } from "@/services/resumeAnalysis";
import ResumeRanking from "@/components/ResumeRanking";
import { Loader } from "lucide-react";
import ResumeAnalysisHeader from "@/components/ResumeAnalysisHeader";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [resumeScores, setResumeScores] = useState<ResumeScore[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const [appStage, setAppStage] = useState<'job-description' | 'upload-resumes' | 'analysis'>('job-description');

  // Extract list of filenames with errors
  const erroredFiles = useMemo(() => {
    return resumes
      .filter(resume => resume.error)
      .map(resume => resume.fileName);
  }, [resumes]);

  const handleResumeUpload = (uploadedResumes: Resume[]) => {
    // Add new resumes to the existing collection
    setResumes((prev) => [...prev, ...uploadedResumes]);
    
    // If we have received resumes, proceed to analyze them
    if (uploadedResumes.length > 0 && jobDescription) {
      analyzeNewResumes(uploadedResumes, jobDescription);
      setAppStage('analysis');
    }
  };

  const handleJobDescriptionSave = async (jd: JobDescription) => {
    setJobDescription(jd);
    setAppStage('upload-resumes');
    
    toast({
      title: "Job description analyzed",
      description: "Now upload resumes to analyze against this job description.",
    });
  };

  const analyzeNewResumes = async (resumesToAnalyze: Resume[], jd: JobDescription) => {
    setIsAnalyzing(true);
    
    try {
      const newScores = await analyzeResumes(resumesToAnalyze, jd);
      setResumeScores((prev) => [...prev, ...newScores]);
      
      if (newScores.length > 0) {
        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${newScores.length} resumes.`,
        });
      }

      // If there were errors, show a summary toast
      const erroredResumes = resumesToAnalyze.filter(resume => resume.error);
      if (erroredResumes.length > 0) {
        toast({
          title: "Some resumes had issues",
          description: `${erroredResumes.length} out of ${resumesToAnalyze.length} resumes had processing issues but were analyzed with limited data.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error analyzing resumes:", error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the resumes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetFlow = () => {
    setAppStage('job-description');
    setResumes([]);
    setResumeScores([]);
    setJobDescription(null);
  };

  return (
    <div className="min-h-screen bg-resume-background/50">
      <div className="w-full py-4 px-4 md:px-6">
        <h2 className="text-2xl font-bold text-resume-text mb-6">New Job Post</h2>

        {/* Step 1: Job Description Input (Always visible in step 1) */}
        {appStage === 'job-description' && (
          <div className="w-full">
            <JobDescriptionInput onJobDescriptionSave={handleJobDescriptionSave} />
          </div>
        )}

        {/* Step 2: Resume Upload (Only visible after job description is analyzed) */}
        {appStage === 'upload-resumes' && jobDescription && (
          <div className="w-full">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-resume-text mb-2">Job Description Summary</h2>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-medium text-lg">{jobDescription.title}</h3>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">{jobDescription.description.substring(0, 150)}...</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobDescription.skills.slice(0, 5).map((skill, index) => (
                    <span key={index} className="bg-resume-primary/10 text-resume-primary text-xs px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                  {jobDescription.skills.length > 5 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{jobDescription.skills.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ResumeDropzone onResumeUpload={handleResumeUpload} />
          </div>
        )}

        {/* Step 3: Analysis Results (Only visible after resumes are uploaded and analyzed) */}
        {appStage === 'analysis' && jobDescription && (
          <div className="w-full">
            <ResumeAnalysisHeader 
              jobDescription={jobDescription}
              resumeCount={resumes.length}
            />
            {isAnalyzing ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <Loader className="h-12 w-12 text-resume-primary animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium text-resume-text">
                    Analyzing resumes...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a moment as we evaluate each resume against the job requirements
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <ResumeRanking scores={resumeScores} erroredFiles={erroredFiles} />
                <div className="mt-8 flex justify-between">
                  <button 
                    onClick={resetFlow}
                    className="text-sm text-resume-primary hover:underline"
                  >
                    Start Over
                  </button>
                  <ResumeDropzone onResumeUpload={handleResumeUpload} />
                </div>
              </div>
            )}
          </div>
        )}

        {isAnalyzing && !resumeScores.length && (
          <div className="mt-12 flex items-center justify-center p-12">
            <div className="text-center">
              <Loader className="h-12 w-12 text-resume-primary animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-resume-text">
                Analyzing resumes...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a moment as we evaluate each resume against the job requirements
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
