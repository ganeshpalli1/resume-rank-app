import { Resume, ResumeScore, JobDescription, ScoreAnalysis } from "@/types/resume";
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Retry mechanism for API requests
const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError;
};

// Function to parse a resume file and extract text
export const parseResumeFile = async (file: File): Promise<Resume> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add file metadata to help with parsing
    formData.append('filename', file.name);
    formData.append('filetype', file.type);
    formData.append('filesize', file.size.toString());

    // Use retry mechanism for resilience
    const response = await retryRequest(() => 
      axios.post(`${API_BASE_URL}/parse-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout
      })
    );

    // Check if the response contains an error field
    if (response.data && response.data.error) {
      console.error('Error parsing resume:', response.data.error);
      return {
        id: `resume-${Date.now()}`,
        name: file.name.split('.')[0],
        fileName: file.name,
        uploadDate: new Date(),
        content: response.data.partial_content || 'Error parsing resume content',
        error: response.data.error,
        partial: response.data.partial_content ? true : false
      };
    }

    return response.data;
  } catch (error) {
    console.error('Error parsing resume:', error);
    
    // Fallback to client-side handling if API fails
    const base64Data = await fileToBase64(file);
    
    return {
      id: `resume-${Date.now()}`,
      name: file.name.split('.')[0],
      fileName: file.name,
      uploadDate: new Date(),
      content: `Failed to parse resume content. Using fallback.`,
      base64Data,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Cache for analyzed job descriptions to avoid redundant processing
const jobDescriptionCache: Map<string, any> = new Map();

// Function to pre-process job description for analysis
const prepareJobDescription = async (jobDescription: JobDescription): Promise<JobDescription> => {
  // Create a cache key based on description content
  const cacheKey = jobDescription.id || jobDescription.title;
  
  // Return cached result if available
  if (jobDescriptionCache.has(cacheKey)) {
    console.log('Using cached job description analysis');
    return jobDescriptionCache.get(cacheKey);
  }
  
  try {
    // Perform client-side preprocessing if needed
    const enhancedJobDescription = {
      ...jobDescription,
      preprocessed: true,
      processingTimestamp: new Date().toISOString()
    };
    
    // Cache the result
    jobDescriptionCache.set(cacheKey, enhancedJobDescription);
    return enhancedJobDescription;
  } catch (error) {
    console.error('Error preprocessing job description:', error);
    return jobDescription;
  }
};

// Function to batch process resumes for more efficient API calls
const batchProcessResumes = async (
  resumes: Resume[],
  jobDescription: JobDescription,
  batchSize: number = 5
): Promise<ResumeScore[]> => {
  const results: ResumeScore[] = [];
  
  // Process resumes in batches
  for (let i = 0; i < resumes.length; i += batchSize) {
    const batch = resumes.slice(i, i + batchSize);
    
    try {
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(resumes.length/batchSize)}`);
      
      // Process this batch
      const response = await retryRequest(() => 
        axios.post(`${API_BASE_URL}/analyze-resumes`, {
          jobDescription,
          resumes: batch
        }, {
          timeout: 60000 // 60 seconds timeout for batch processing
        })
      );
      
      // Add results from this batch
      results.push(...response.data);
    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, error);
      
      // Create fallback results for this batch
      const fallbackResults = await Promise.all(
        batch.map(resume => createFallbackResult(resume, jobDescription))
      );
      
      results.push(...fallbackResults);
    }
  }
  
  return results;
};

// Helper function to create a fallback result for a resume
const createFallbackResult = async (
  resume: Resume, 
  jobDescription: JobDescription
): Promise<ResumeScore> => {
  // Generate deterministic but reasonable mock scores based on the resume content
  const contentLength = resume.content ? resume.content.length : 0;
  const hasError = resume.error ? true : false;
  
  // Base scores modified by content length (more content usually means better match)
  // But penalize errors
  const baseScore = Math.min(45 + (contentLength / 500), 70);
  const penaltyFactor = hasError ? 0.7 : 1.0;
  
  // Generate somewhat different scores for each category
  const keywordMatch = Math.round((baseScore + 10) * penaltyFactor);
  const skillsMatch = Math.round((baseScore - 5) * penaltyFactor);
  const experienceMatch = Math.round((baseScore + 5) * penaltyFactor);
  const educationMatch = Math.round((baseScore - 10) * penaltyFactor);
  
  // Overall score with realistic weighting
  const overallScore = Math.round(
    keywordMatch * 0.05 +
    skillsMatch * 0.45 +
    experienceMatch * 0.35 +
    educationMatch * 0.15
  );
  
  return {
    resumeId: resume.id,
    resumeName: resume.name,
    fileName: resume.fileName,
    overallScore: Math.max(20, Math.min(overallScore, 75)), // Ensure score is between 20-75 for fallbacks
    keywordMatch: Math.max(15, Math.min(keywordMatch, 80)),
    skillsMatch: Math.max(15, Math.min(skillsMatch, 80)),
    experienceMatch: Math.max(15, Math.min(experienceMatch, 80)),
    educationMatch: Math.max(15, Math.min(educationMatch, 80)),
    evaluationDetails: [
      hasError ? `Warning: This resume had processing issues. Results may be incomplete.` :
                `Note: This analysis is an estimate as the resume could not be fully processed.`,
      `Analyzed content length: ${contentLength} characters`,
      `File name: ${resume.fileName}`
    ],
    scoreDetails: [
      {
        category: "Keywords",
        matches: ["Limited analysis available"],
        misses: ["Full keyword matching unavailable"]
      },
      {
        category: "Skills",
        matches: ["Limited analysis available"],
        misses: ["Full skills matching unavailable"]
      }
    ]
  };
};

// Main function to analyze resumes against a job description
export const analyzeResumes = async (
  resumes: Resume[],
  jobDescription: JobDescription
): Promise<ResumeScore[]> => {
  try {
    // Prepare enhanced job description
    const enhancedJobDescription = await prepareJobDescription(jobDescription);

    // For files that don't have base64Data, try to process them properly
    const processedResumes = await Promise.all(
      resumes.map(async (resume) => {
        if (!resume.base64Data && resume.file) {
          try {
            const base64Data = await fileToBase64(resume.file);
            return { ...resume, base64Data };
          } catch (e) {
            console.error(`Error converting file to base64: ${e}`);
            return resume; // Return the resume without base64Data if conversion fails
          }
        }
        return resume;
      })
    );

    // Separate resumes with and without errors for different processing paths
    const validResumes = processedResumes.filter(resume => !resume.error);
    const errorResumes = processedResumes.filter(resume => resume.error);
    
    // If all resumes have errors, return fallback results
    if (validResumes.length === 0 && processedResumes.length > 0) {
      console.warn("All resumes have errors, using fallback implementation");
      return Promise.all(errorResumes.map(resume => createFallbackResult(resume, enhancedJobDescription)));
    }

    // Process valid resumes in batches for better performance
    const validResults = validResumes.length > 0 ? 
      await batchProcessResumes(validResumes, enhancedJobDescription) : [];

    // Create fallback results for resumes with errors
    const errorResults = await Promise.all(
      errorResumes.map(resume => createFallbackResult(resume, enhancedJobDescription))
    );
    
    // Combine and sort all results
    const allResults = [...validResults, ...errorResults]
      .sort((a, b) => b.overallScore - a.overallScore);
    
    return allResults;
  } catch (error) {
    console.error('Error analyzing resumes:', error);
    
    // Complete fallback to local processing
    return Promise.all(resumes.map(resume => createFallbackResult(resume, jobDescription)));
  }
};

// Get a detailed analysis of a specific resume score
export const generateScoreAnalysis = (score: ResumeScore): ScoreAnalysis => {
  // Extract score details
  const { overallScore, keywordMatch, skillsMatch, experienceMatch, educationMatch } = score;
  
  let analysis: ScoreAnalysis = {
    overallAssessment: "",
    strengths: [],
    weaknesses: [],
    recommendations: []
  };
  
  // Overall assessment
  if (overallScore >= 80) {
    analysis.overallAssessment = "Excellent match for the position. This candidate meets or exceeds most requirements.";
  } else if (overallScore >= 65) {
    analysis.overallAssessment = "Good match for the position. This candidate meets many key requirements.";
  } else if (overallScore >= 50) {
    analysis.overallAssessment = "Moderate match for the position. This candidate meets some requirements but has notable gaps.";
  } else {
    analysis.overallAssessment = "Limited match for the position. This candidate may need significant additional qualifications.";
  }
  
  // Determine strengths (scores >= 70)
  if (keywordMatch >= 70) {
    analysis.strengths.push("Strong keyword relevance to the job description");
  }
  if (skillsMatch >= 70) {
    analysis.strengths.push("Impressive skills alignment with job requirements");
  }
  if (experienceMatch >= 70) {
    analysis.strengths.push("Relevant experience level for the position");
  }
  if (educationMatch >= 70) {
    analysis.strengths.push("Education credentials match or exceed requirements");
  }
  
  // Determine weaknesses (scores < 50)
  if (keywordMatch < 50) {
    analysis.weaknesses.push("Resume lacks key terminology relevant to the position");
  }
  if (skillsMatch < 50) {
    analysis.weaknesses.push("Skills gap compared to job requirements");
  }
  if (experienceMatch < 50) {
    analysis.weaknesses.push("Experience level may be insufficient for the role");
  }
  if (educationMatch < 50) {
    analysis.weaknesses.push("Educational qualifications may not meet requirements");
  }
  
  // Generate recommendations
  if (keywordMatch < 60) {
    analysis.recommendations.push("Update resume to include more industry-specific terminology from the job description");
  }
  if (skillsMatch < 60) {
    analysis.recommendations.push("Highlight technical or soft skills that align with the job requirements");
  }
  if (experienceMatch < 60) {
    analysis.recommendations.push("Emphasize relevant work experience and accomplishments related to the role");
  }
  if (educationMatch < 60) {
    analysis.recommendations.push("Consider additional certifications or training to strengthen qualifications");
  }
  
  // If generally good but not great, add general optimization advice
  if (overallScore >= 50 && overallScore < 75) {
    analysis.recommendations.push("Tailor the resume structure and content specifically for this type of position");
  }
  
  return analysis;
};

// Mock function for testing - moved here to be properly typed and more realistic
export const mockAnalyzeResumes = async (
  resumes: Resume[],
  jobDescription: JobDescription
): Promise<ResumeScore[]> => {
  return Promise.all(resumes.map(resume => createFallbackResult(resume, jobDescription)));
};
