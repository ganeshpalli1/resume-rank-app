import React, { useState, useMemo } from "react";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ResumeDropzone from "@/components/ResumeDropzone";
import { Resume, ResumeScore, JobDescription } from "@/types/resume";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { analyzeResumes } from "@/services/resumeAnalysis";
import { ArrowLeft, ArrowRight, BarChart2, Briefcase, FileText, Users, PenTool, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Import the store we just created
import { useResumeStore } from "@/store/resumeStore";
import { analyzeJobDescription, JobDescriptionAnalysis, AnalyzedSection } from "@/services/jobDescriptionService";
import JobAnalysisDisplay from "@/components/JobAnalysisDisplay";

// Enhanced animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      stiffness: 70, 
      damping: 13,
      mass: 0.8
    } 
  }
};

const slideInFromRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      type: "spring", 
      stiffness: 80, 
      damping: 12 
    } 
  }
};

const slideInFromLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      type: "spring", 
      stiffness: 80, 
      damping: 12 
    } 
  }
};

const popIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 20
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.25
    }
  }
};

const cardHoverEffect = {
  rest: { scale: 1, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
  hover: { 
    scale: 1.015, 
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

const NewJobPost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appStage, setAppStage] = useState<'welcome' | 'job-description' | 'upload-resumes'>('welcome');
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [jobAnalysis, setJobAnalysis] = useState<JobDescriptionAnalysis | null>(null);
  const [analyzingJob, setAnalyzingJob] = useState(false);
  
  // Use the store to save resume analysis results
  const { 
    setResumeScores, 
    setErroredFiles, 
    setJobInfo, 
    setResumeCount,
    addJobAnalysis,
    clearCurrentJob
  } = useResumeStore();

  // Extract list of filenames with errors
  const erroredFiles = useMemo(() => {
    return resumes
      .filter(resume => resume.error)
      .map(resume => resume.fileName);
  }, [resumes]);

  const handleStartNewJob = () => {
    setAppStage('job-description');
  };

  const handleJobDescriptionSave = (jd: JobDescription) => {
    // Save the job description while preserving any existing data
    setJobDescription(prevJobDescription => {
      if (!prevJobDescription) {
        return jd;
      }
      
      // Preserve any existing data that might not be in the form
      return {
        ...jd,
        skills: jd.skills.length ? jd.skills : prevJobDescription.skills,
        requirements: jd.requirements.length ? jd.requirements : prevJobDescription.requirements,
        responsibilities: jd.responsibilities.length ? jd.responsibilities : prevJobDescription.responsibilities,
      };
    });
    
    // Clear any previous resume data
    setResumes([]);
    
    // Clear current job in the store
    clearCurrentJob();
    
    // Proceed to the resume upload stage
    setAppStage('upload-resumes');
    
    toast({
      title: "Job details saved",
      description: "Now upload resumes to analyze against this job description.",
    });
  };

  const handleAnalyzeJobDescription = async () => {
    if (!jobDescription) return;
    
    setAnalyzingJob(true);
    
    try {
      // Call the API to analyze the job description
      const analysisResult = await analyzeJobDescription({
        title: jobDescription.title,
        company: jobDescription.company || "",
        department: jobDescription.department,
        description: jobDescription.description,
        requiredExperience: jobDescription.experienceRequired,
        employmentType: jobDescription.employmentType,
        location: jobDescription.location,
        salaryRange: jobDescription.salary,
        applicationDeadline: jobDescription.applicationDeadline?.toISOString()
      });
      
      // Store the analysis result
      setJobAnalysis(analysisResult);
      
      // Extract skills and requirements from the analysis
      const extractedSkills: string[] = [];
      const extractedRequirements: string[] = [];
      
      analysisResult.sections.forEach(section => {
        // Extract skills from Technical Skills and similar sections
        if (section.section_name.toLowerCase().includes('skill')) {
          section.requirements.forEach(req => {
            // Clean up the requirement text to extract just the skill name
            const skill = req.replace(/^proficiency in /i, '')
              .replace(/^experience with /i, '')
              .replace(/^knowledge of /i, '')
              .trim();
            
            if (skill && !extractedSkills.includes(skill)) {
              extractedSkills.push(skill);
            }
          });
        }
        
        // Extract requirements from Requirements and Experience sections
        if (section.section_name.toLowerCase().includes('requirement') || 
            section.section_name.toLowerCase().includes('experience')) {
          section.requirements.forEach(req => {
            if (req && !extractedRequirements.includes(req)) {
              extractedRequirements.push(req);
            }
          });
        }
      });
      
      // Update job description with extracted information
      if (extractedSkills.length > 0 || extractedRequirements.length > 0) {
        setJobDescription(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            skills: extractedSkills.length > 0 ? extractedSkills : prev.skills,
            requirements: extractedRequirements.length > 0 ? extractedRequirements : prev.requirements
          };
        });
      }
      
      // Show the analysis modal
      setShowAnalysisModal(true);
      
      toast({
        title: "Job Analysis Complete",
        description: "AI-powered analysis has identified key skills and requirements."
      });
    } catch (error) {
      console.error("Error analyzing job description:", error);
      toast({
        title: "Analysis Error",
        description: "There was a problem analyzing the job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingJob(false);
    }
  };

  const handleResumeUpload = (uploadedResumes: Resume[]) => {
    // Add new resumes to the existing collection
    setResumes((prev) => [...prev, ...uploadedResumes]);
    
    // If we have received resumes, proceed to analyze them
    if (uploadedResumes.length > 0 && jobDescription) {
      analyzeNewResumes(uploadedResumes, jobDescription);
    }
  };

  const analyzeNewResumes = async (resumesToAnalyze: Resume[], jd: JobDescription) => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    
    try {
      const newScores = await analyzeResumes(resumesToAnalyze, jd);
      
      // Save the scores to the store
      setResumeScores(newScores);
      setErroredFiles(erroredFiles);
      setJobInfo(jd.title, jd.company || '');
      setResumeCount(resumesToAnalyze.length);
      
      // Save the analysis to store history
      addJobAnalysis();
      
      // Show success toast but don't navigate automatically
      if (newScores.length > 0) {
        // Mark analysis as complete
        setAnalysisComplete(true);
        
        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${newScores.length} resumes. You can view results using the "View Results" button.`,
          action: (
            <Button 
              onClick={() => navigate('/results')} 
              variant="outline" 
              className="bg-resume-primary text-white hover:bg-resume-primary/90 border-none"
            >
              View Results
            </Button>
          ),
          duration: 10000, // Give users more time to see the button
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

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-resume-background/40 to-resume-background/60"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Header with back button only */}
      <div className="px-6 py-6">
        {appStage === 'upload-resumes' && (
          <div className="flex items-start mb-4">
            <motion.button
              onClick={() => setAppStage('job-description')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-resume-primary text-resume-primary rounded-lg shadow-sm hover:bg-resume-primary/5 transition-all"
              whileHover={{ scale: 1.03, x: -2 }}
              whileTap={{ scale: 0.97 }}
              variants={slideInFromLeft}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </motion.button>
          </div>
        )}
        
        {appStage === 'job-description' && (
          <div className="flex items-start mb-4">
            <motion.button
              onClick={() => setAppStage('welcome')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-resume-primary text-resume-primary rounded-lg shadow-sm hover:bg-resume-primary/5 transition-all"
              whileHover={{ scale: 1.03, x: -2 }}
              whileTap={{ scale: 0.97 }}
              variants={slideInFromLeft}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Welcome Banner */}
        {appStage === 'welcome' && (
          <motion.div
            key="welcome-banner"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={slideIn}
            className="w-full min-h-[60vh] flex flex-col items-center justify-center"
          >
            <motion.div 
              variants={staggerContainer}
              className="w-full px-6 py-8"
            >
              <motion.div 
                className="flex justify-center mb-6"
                variants={popIn}
              >
                <div className="p-3 bg-resume-primary/10 rounded-full">
                  <Briefcase className="h-10 w-10 text-resume-primary" />
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-2xl md:text-3xl font-bold text-center mb-4 text-resume-text bg-gradient-to-r from-resume-primary to-resume-secondary bg-clip-text text-transparent"
                variants={popIn}
              >
                Create a New Job Posting
              </motion.h1>
              
              <motion.p 
                className="text-sm md:text-base text-gray-600 text-center mb-8 max-w-2xl mx-auto"
                variants={popIn}
              >
                Start by filling out the job details form to create a new job posting. This information will be used to match and rank resumes of potential candidates based on their skills, experience, and qualifications.
              </motion.p>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-4 md:px-12 lg:px-24"
                variants={staggerContainer}
              >
                <motion.div 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                  variants={popIn}
                  whileHover={{y: -5, transition: {duration: 0.2}}}
                >
                  <div className="p-2 bg-blue-50 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                    <PenTool className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">1. Describe the Job</h3>
                  <p className="text-xs text-gray-600">Fill out the job details including title, requirements, and other important information.</p>
                </motion.div>
                
                <motion.div 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                  variants={popIn}
                  whileHover={{y: -5, transition: {duration: 0.2}}}
                >
                  <div className="p-2 bg-green-50 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">2. Upload Resumes</h3>
                  <p className="text-xs text-gray-600">Upload candidate resumes to be analyzed and matched against your job requirements.</p>
                </motion.div>
                
                <motion.div 
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
                  variants={popIn}
                  whileHover={{y: -5, transition: {duration: 0.2}}}
                >
                  <div className="p-2 bg-purple-50 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">3. Review Rankings</h3>
                  <p className="text-xs text-gray-600">Get instant rankings of candidates based on their match with your job requirements.</p>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="flex justify-center"
                variants={popIn}
              >
                <Button 
                  onClick={handleStartNewJob}
                  className="bg-gradient-to-r from-resume-primary to-resume-secondary hover:from-resume-primary/90 hover:to-resume-secondary/90 text-white px-8 py-3 text-base rounded-lg shadow hover:shadow-md transition-all"
                  size="default"
                >
                  <span className="mr-2">Create New Job</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 1: Job Description Input */}
        {appStage === 'job-description' && (
          <motion.div 
            key="job-description"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={slideIn}
            className="w-full px-4"
          >
            <JobDescriptionInput 
              onJobDescriptionSave={handleJobDescriptionSave} 
              initialJobDescription={jobDescription}
            />
          </motion.div>
        )}

        {/* Step 2: Resume Upload */}
        {appStage === 'upload-resumes' && jobDescription && (
          <motion.div 
            key="upload-resumes"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            variants={slideIn}
            className="w-full px-4"
          >
            <div className="mb-6">
              {/* Job description header - always visible */}
              <motion.div 
              initial="rest"
              whileHover="hover"
              variants={cardHoverEffect}
              className="bg-white p-5 rounded-t-xl shadow-md border border-gray-200"
            >
                <div className="flex items-center">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="bg-resume-primary/10 p-2 rounded-lg"
                      whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
                    >
                      <BarChart2 className="h-5 w-5 text-resume-primary" />
                    </motion.div>
                    <h2 className="text-xl font-semibold text-resume-text bg-gradient-to-r from-resume-primary to-resume-secondary bg-clip-text text-transparent">Job Description Analysis</h2>
                  </div>
                </div>
              </motion.div>
              
              {/* Job details content - always visible */}
              <motion.div 
                className="bg-white p-5 rounded-b-xl shadow-md border-x border-b border-gray-200"
                variants={popIn}
              >
                {/* Consolidated job details in a single container */}
                <motion.div 
                  variants={staggerContainer}
                  className="space-y-5"
                >
                  {/* Job title and company */}
                  <div className="flex justify-between items-start">
                    <motion.h3 
                      className="font-semibold text-xl text-resume-text relative inline-block"
                      whileHover={{ 
                        color: "#4A6CF7",
                        transition: { duration: 0.3 }
                      }}
                    >
                      {jobDescription.title}
                      <motion.span 
                        className="absolute -bottom-1 left-0 h-0.5 bg-resume-primary/60" 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                      />
                    </motion.h3>
                    {jobDescription.company && (
                      <motion.span 
                        className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600"
                        whileHover={{ 
                          backgroundColor: "#f3f4ff", 
                          color: "#4A6CF7",
                          transition: { duration: 0.3 }
                        }}
                        initial={{ scale: 0.95, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        {jobDescription.company}
                      </motion.span>
                    )}
                  </div>

                  {/* All job details in a unified grid */}
                  <motion.div 
                    className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"
                    initial="rest"
                    whileHover="hover"
                    variants={cardHoverEffect}
                  >
                    {jobDescription.department && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Department:</span> 
                        <span className="text-gray-700">{jobDescription.department}</span>
                      </motion.div>
                    )}
                    {jobDescription.experienceRequired && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Experience:</span> 
                        <span className="text-gray-700">{jobDescription.experienceRequired}</span>
                      </motion.div>
                    )}
                    {jobDescription.employmentType && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Type:</span> 
                        <span className="text-gray-700">{jobDescription.employmentType}</span>
                      </motion.div>
                    )}
                    {jobDescription.location && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Location:</span> 
                        <span className="text-gray-700">{jobDescription.location}</span>
                      </motion.div>
                    )}
                    {jobDescription.salary && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Salary:</span> 
                        <span className="text-gray-700">{jobDescription.salary}</span>
                      </motion.div>
                    )}
                    {jobDescription.applicationDeadline && (
                      <motion.div 
                        className="flex items-start gap-2"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="font-medium text-resume-text">Deadline:</span> 
                        <span className="text-gray-700">{jobDescription.applicationDeadline.toLocaleDateString()}</span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Job description */}
                  <motion.div
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <h4 className="font-medium text-resume-text mb-2 bg-gradient-to-r from-resume-primary to-resume-secondary bg-clip-text text-transparent inline-block">Job Description</h4>
                    <motion.p 
                      className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg border-l-2 border-resume-primary/30"
                      initial="rest"
                      whileHover="hover"
                      variants={cardHoverEffect}
                    >
                      {jobDescription.description}
                    </motion.p>
                  </motion.div>
                  
                  {/* Skills section if available */}
                  {jobDescription.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-resume-text mb-2">Key Skills</h4>
                      <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                        {jobDescription.skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-gradient-to-r from-resume-primary/10 to-resume-secondary/10 text-resume-primary text-xs px-3 py-1.5 rounded-full border border-resume-primary/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Analyze button at the bottom corner of container */}
                  <div className="mt-6 flex justify-end">
                    <motion.button
                      className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-resume-primary to-resume-secondary text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: "0 8px 20px -5px rgba(0, 0, 0, 0.1), 0 6px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAnalyzeJobDescription}
                      disabled={analyzingJob}
                    >
                      {analyzingJob ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span className="relative">
                            Analyze Job Description
                            <motion.span 
                              className="absolute bottom-0 left-0 w-full h-0.5 bg-white/70"
                              initial={{ width: 0 }}
                              whileHover={{ width: "100%" }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            />
                          </span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div variants={popIn}>
              <ResumeDropzone 
                onResumeUpload={handleResumeUpload} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Job Analysis Modal */}
      {jobAnalysis && (
        <JobAnalysisDisplay
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          sections={jobAnalysis.sections}
          jobTitle={jobDescription?.title || "Job"}
        />
      )}
    </motion.div>
  );
};

export default NewJobPost; 