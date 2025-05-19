import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface AnalyzedSection {
  section_name: string;
  requirements: string[];
}

export interface JobDescriptionAnalysis {
  sections: AnalyzedSection[];
}

// Updated interface for complete job data
export interface CompleteJobData {
  title: string;
  company: string;
  department?: string;
  description: string;
  requiredExperience?: string;
  employmentType?: string;
  location?: string;
  salaryRange?: string;
  applicationDeadline?: string;
}

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
      console.warn(`Job description API request failed (attempt ${attempt + 1}/${maxRetries}):`, error);
      
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

// Function to extract common skills from job description text
const extractCommonSkills = (description: string): string[] => {
  // List of common technical skills to look for
  const commonSkills = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Ruby", "PHP", "Swift", "Kotlin", 
    "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "Spring", "ASP.NET",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "SQL", "NoSQL", "MongoDB",
    "PostgreSQL", "MySQL", "GraphQL", "REST API", "Microservices", "DevOps", "Agile", "Scrum",
    "HTML", "CSS", "SASS", "LESS", "Tailwind", "Bootstrap", "Redux", "Next.js", "Gatsby",
    "Machine Learning", "AI", "Data Science", "Big Data", "Hadoop", "Spark", "TensorFlow",
    "Blockchain", "IoT", "AR/VR", "Mobile Development", "iOS", "Android", "React Native",
    "Flutter", "UI/UX", "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator",
    "Testing", "Jest", "Mocha", "Cypress", "Selenium", "TDD", "BDD"
  ];

  // Simple extraction based on case-insensitive matching
  const extractedSkills = commonSkills.filter(skill => 
    new RegExp(`\\b${skill.replace(/\./g, '\\.')}\\b`, 'i').test(description)
  );

  return extractedSkills;
};

// Function to extract likely requirements from text
const extractRequirements = (description: string): string[] => {
  const requirements: string[] = [];
  
  // Split by newlines and look for bullet points or numbered lists
  const lines = description.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match lines that start with bullets, asterisks, dashes, or numbers
    if (/^[\•\-\*\d\.]+\s+/.test(trimmedLine) && trimmedLine.length > 10) {
      // Clean up the requirement text
      let requirement = trimmedLine.replace(/^[\•\-\*\d\.]+\s+/, '');
      requirement = requirement.charAt(0).toUpperCase() + requirement.slice(1);
      requirements.push(requirement);
    }
    // Also look for lines containing "required", "requirement", "must have", etc.
    else if (
      /\b(required|requirement|must have|minimum|qualification|experience in)\b/i.test(trimmedLine) && 
      trimmedLine.length > 15
    ) {
      requirements.push(trimmedLine);
    }
  }
  
  return requirements;
};

// Generate a fallback analysis if the API fails
const generateFallbackAnalysis = (jobData: CompleteJobData): JobDescriptionAnalysis => {
  // Extract skills and requirements using client-side logic
  const skills = extractCommonSkills(jobData.description);
  const extractedRequirements = extractRequirements(jobData.description);
  
  // Use extracted requirements
  const allRequirements = [...extractedRequirements];
  
  const sections: AnalyzedSection[] = [];
  
  // Create skills section if skills were found
  if (skills.length > 0) {
    sections.push({
      section_name: "Technical Skills",
      requirements: skills.map(skill => `Proficiency in ${skill}`)
    });
  }
  
  // Add extracted requirements if found
  if (allRequirements.length > 0) {
    sections.push({
      section_name: "Requirements",
      requirements: allRequirements
    });
  }
  
  // Add job details section
  const jobDetails: string[] = [];
  if (jobData.title) jobDetails.push(`Title: ${jobData.title}`);
  if (jobData.company) jobDetails.push(`Company: ${jobData.company}`);
  if (jobData.department) jobDetails.push(`Department: ${jobData.department}`);
  if (jobData.requiredExperience) jobDetails.push(`Required Experience: ${jobData.requiredExperience}`);
  if (jobData.employmentType) jobDetails.push(`Employment Type: ${jobData.employmentType}`);
  if (jobData.location) jobDetails.push(`Location: ${jobData.location}`);
  if (jobData.salaryRange) jobDetails.push(`Salary Range: ${jobData.salaryRange}`);
  if (jobData.applicationDeadline) jobDetails.push(`Application Deadline: ${jobData.applicationDeadline}`);
  
  if (jobDetails.length > 0) {
    sections.push({
      section_name: "Job Details",
      requirements: jobDetails
    });
  }
  
  // Add default sections if we couldn't extract enough information
  if (sections.length === 0 || allRequirements.length === 0) {
    sections.push({
      section_name: "Work Experience",
      requirements: [
        "Relevant work experience in the field",
        "Experience with industry-standard tools and practices"
      ]
    });
    
    if (skills.length === 0) {
      sections.push({
        section_name: "Technical Skills",
        requirements: [
          "Programming skills relevant to the position",
          "Technical knowledge appropriate for the role"
        ]
      });
    }
    
    sections.push({
      section_name: "Education",
      requirements: [
        "Bachelor's degree in a relevant field",
        "Advanced degree or equivalent experience"
      ]
    });
  }
  
  // Always add a note about fallback mode
  sections.push({
    section_name: "Note",
    requirements: [
      "This is a limited analysis generated client-side.",
      "For better results, please ensure the API server is running."
    ]
  });
  
  return { sections };
};

export const analyzeJobDescription = async (jobData: CompleteJobData): Promise<JobDescriptionAnalysis> => {
  try {
    // Use retry mechanism for resilience
    const response = await retryRequest(() => 
      axios.post(`${API_BASE_URL}/analyze-job-description`, jobData, {
        timeout: 30000, // 30 seconds timeout
      })
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error analyzing job description:', error);
    
    // Check if it's a connection error (API not running)
    if (error.code === 'ERR_NETWORK') {
      // Generate a more helpful fallback with client-side analysis
      const fallbackAnalysis = generateFallbackAnalysis(jobData);
      
      // Add API connection error message
      fallbackAnalysis.sections.unshift({
        section_name: 'API Connection Error',
        requirements: [
          'Failed to connect to the analysis API server.',
          'Please make sure the Python API server is running:',
          '1. Open a terminal and navigate to the project folder',
          '2. Run: python src/services/jobDescriptionAnalyzer.py',
          '3. Try analyzing the job description again'
        ]
      });
      
      return fallbackAnalysis;
    }
    
    // Return a fallback analysis with an error message
    return generateFallbackAnalysis(jobData);
  }
}; 