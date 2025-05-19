import { create } from 'zustand';
import { ResumeScore } from '@/types/resume';

// Interface for a single job analysis with its resume scores
interface JobAnalysis {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  resumeScores: ResumeScore[];
  erroredFiles: string[];
  resumeCount: number;
  timestamp: Date;
}

interface ResumeStoreState {
  // Current job being analyzed
  currentResumeScores: ResumeScore[];
  currentErroredFiles: string[];
  currentJobTitle: string;
  currentJobCompany: string;
  currentResumeCount: number;
  
  // List of all job analyses (history)
  jobAnalyses: JobAnalysis[];
  
  // Actions for current job
  setResumeScores: (scores: ResumeScore[]) => void;
  setErroredFiles: (erroredFiles: string[]) => void;
  setJobInfo: (title: string, company: string) => void;
  setResumeCount: (count: number) => void;
  
  // Actions for job history
  addJobAnalysis: () => void;
  clearCurrentJob: () => void;
  clearAllJobs: () => void;
}

export const useResumeStore = create<ResumeStoreState>((set, get) => ({
  // Current job state
  currentResumeScores: [],
  currentErroredFiles: [],
  currentJobTitle: '',
  currentJobCompany: '',
  currentResumeCount: 0,
  
  // History of all job analyses
  jobAnalyses: [],
  
  // Current job actions
  setResumeScores: (scores) => set({ currentResumeScores: scores }),
  setErroredFiles: (erroredFiles) => set({ currentErroredFiles: erroredFiles }),
  setJobInfo: (title, company) => set({ currentJobTitle: title, currentJobCompany: company }),
  setResumeCount: (count) => set({ currentResumeCount: count }),
  
  // Save current job analysis to history
  addJobAnalysis: () => {
    const { 
      currentResumeScores, 
      currentErroredFiles, 
      currentJobTitle, 
      currentJobCompany, 
      currentResumeCount 
    } = get();
    
    // Only add if there are actual results
    if (currentResumeScores.length > 0) {
      const newJobAnalysis: JobAnalysis = {
        jobId: `job-${Date.now()}`, // Generate a unique ID
        jobTitle: currentJobTitle,
        jobCompany: currentJobCompany,
        resumeScores: [...currentResumeScores],
        erroredFiles: [...currentErroredFiles],
        resumeCount: currentResumeCount,
        timestamp: new Date()
      };
      
      set((state) => ({
        jobAnalyses: [...state.jobAnalyses, newJobAnalysis]
      }));
    }
  },
  
  // Clear current job data
  clearCurrentJob: () => set({
    currentResumeScores: [],
    currentErroredFiles: [],
    currentJobTitle: '',
    currentJobCompany: '',
    currentResumeCount: 0
  }),
  
  // Clear all job history
  clearAllJobs: () => set({
    jobAnalyses: [],
    currentResumeScores: [],
    currentErroredFiles: [],
    currentJobTitle: '',
    currentJobCompany: '',
    currentResumeCount: 0
  })
})); 