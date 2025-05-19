export interface Resume {
  id: string;
  name: string;
  fileName: string;
  uploadDate: Date;
  content: string;
  file?: File;
  base64Data?: string;
  error?: string;
  partial?: boolean;
  processingMetadata?: {
    processingTime?: number;
    parsingMethod?: string;
    contentConfidence?: number;
  };
}

export interface ResumeScoreDetail {
  category: string;
  score?: number;
  matches: string[];
  misses: string[];
  feedback?: string;
  contexts?: {
    [skill: string]: string[];
  };
}

export interface ResumeScore {
  resumeId: string;
  resumeName: string;
  fileName: string;
  overallScore: number;
  keywordMatch: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  evaluationDetails: string[];
  scoreDetails: ResumeScoreDetail[];
  partial?: boolean;
  hadErrors?: boolean;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  department?: string;
  description: string;
  skills: string[];
  requirements: string[];
  responsibilities?: string[];
  location?: string;
  salary?: string;
  experienceRequired?: string;
  employmentType?: string;
  applicationDeadline?: Date;
  postDate?: Date;
  contactInfo?: string;
  preprocessed?: boolean;
  processingTimestamp?: string;
}

export interface ResumeAnalysisRequest {
  jobDescription: JobDescription;
  resumes: Resume[];
}

export interface FailedFile {
  name: string;
  error: string;
}

export interface ScoreAnalysis {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
