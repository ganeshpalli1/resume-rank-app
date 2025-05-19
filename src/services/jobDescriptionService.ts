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
  const cleanDescription = description.toLowerCase();
  
  // List of common technical skills to look for - expanded list
  const commonSkills = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Ruby", "PHP", "Swift", "Kotlin", 
    "Go", "Rust", "Scala", "Perl", "R", "MATLAB", "Bash", "PowerShell", "Objective-C", "Dart",
    
    // Frontend Technologies
    "React", "Angular", "Vue", "Next.js", "Gatsby", "Svelte", "jQuery", "Bootstrap", "Tailwind", 
    "Material UI", "HTML", "CSS", "SASS", "LESS", "Redux", "MobX", "Storybook", "Webpack", "Babel", 
    "ESLint", "Jest", "Cypress", "Enzyme", "RTL", "Vite", "Chakra UI", "Ant Design", "Emotion",
    
    // Backend Technologies
    "Node.js", "Express", "Django", "Flask", "Spring", "ASP.NET", "Laravel", "Ruby on Rails", 
    "FastAPI", "Nest.js", "GraphQL", "REST API", "gRPC", "WebSockets", "Socket.IO", "Kafka", 
    "RabbitMQ", "Redis", "Celery", "Tornado", "Koa", "Hapi", "WebRTC",
    
    // Databases
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Oracle", "Firebase", "DynamoDB", 
    "Cassandra", "Redis", "Elasticsearch", "Neo4j", "MariaDB", "CouchDB", "Fauna", "Supabase", 
    "PlanetScale", "Prisma", "Sequelize", "TypeORM", "Mongoose", "Knex",
    
    // Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", 
    "Terraform", "Ansible", "Puppet", "Chef", "Pulumi", "Heroku", "Vercel", "Netlify", "Cloudflare", 
    "Firebase", "Nginx", "Apache", "Serverless", "AWS Lambda", "Azure Functions", "GCP Functions",
    "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence", "CircleCI", "Travis CI", "ArgoCD", "Helm",
    
    // AI, ML, Data Science
    "Machine Learning", "AI", "Artificial Intelligence", "Data Science", "NLP", "Computer Vision", 
    "Deep Learning", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Keras", "OpenCV", 
    "NLTK", "spaCy", "Transformers", "Hugging Face", "MLOps", "Data Mining", "Data Visualization",
    "Jupyter", "Tableau", "Power BI", "D3.js", "Matplotlib", "Seaborn", "YOLO", "GPT", "BERT",
    
    // Mobile Development
    "iOS", "Android", "React Native", "Flutter", "Xamarin", "Ionic", "Swift", "Kotlin", "Objective-C", 
    "Java", "Mobile UI/UX", "SwiftUI", "Jetpack Compose", "Cordova", "Electron", "Progressive Web Apps",
    "XCode", "Android Studio", "Mobile Testing", "TestFlight", "Firebase",
    
    // Web3, Blockchain
    "Blockchain", "Ethereum", "Solidity", "Smart Contracts", "Web3.js", "DApps", "NFT", "Cryptocurrency",
    "Rust", "Solana", "Polygon", "Hardhat", "Truffle", "Ganache", "IPFS", "MetaMask",
    
    // Design & UX
    "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "UI/UX", "User Experience", 
    "User Interface", "Design Systems", "Wireframing", "Prototyping", "User Research", "Usability Testing",
    
    // Testing & QA
    "Testing", "QA", "Jest", "Mocha", "Cypress", "Selenium", "TestRail", "TestCafe", "Appium", 
    "TDD", "BDD", "Playwright", "Puppeteer", "JUnit", "PyTest", "Cucumber", "Jasmine", "Karma", 
    "Performance Testing", "Load Testing", "A/B Testing", "End-to-End Testing", "Unit Testing",
    
    // Project Management, Methodologies & Soft Skills
    "Agile", "Scrum", "Kanban", "Waterfall", "SAFe", "Lean", "Product Management", "Project Management",
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Critical Thinking", "Jira",
    "Confluence", "Trello", "Asana", "Monday.com", "ClickUp", "Notion",
    
    // Network & Security
    "Cybersecurity", "Network Security", "Penetration Testing", "Ethical Hacking", "OWASP", 
    "Authentication", "Authorization", "OAuth", "JWT", "HTTPS", "SSL/TLS", "VPN", "Firewall", 
    "SOC", "SIEM", "CISSP", "CEH", "CompTIA", "Security+", "Cryptography",
    
    // Desktop & Systems
    "Windows", "Linux", "macOS", "Unix", "Shell Scripting", "PowerShell", "Bash", "System Administration",
    "Desktop Applications", "Qt", "WPF", "Electron", "GTK", "Embedded Systems", "IoT",
    
    // Big Data
    "Big Data", "Hadoop", "Spark", "Kafka", "Hive", "Pig", "Data Warehousing", "ETL", "Data Pipeline",
    "Data Lake", "Data Engineering", "Airflow", "Snowflake", "Redshift", "BigQuery", "Databricks",
    
    // Domain Specific
    "Fintech", "Healthtech", "Edtech", "E-commerce", "Gaming", "AR/VR", "3D Programming", "Unity",
    "Unreal Engine", "Computer Graphics", "Digital Transformation", "CMS", "Salesforce", "SAP", "ERP",
    "CRM", "SEO", "Digital Marketing", "Content Management", "Video Processing"
  ];

  // Extract skills using multiple approaches
  const extractedSkills = new Set<string>();

  // 1. Direct matching with common skills list (case-insensitive)
  commonSkills.forEach(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\b`, 'i');
    if (pattern.test(cleanDescription)) {
      extractedSkills.add(skill);
    }
    
    // Also check plural forms of skills
    const pluralPattern = new RegExp(`\\b${skill.replace(/\./g, '\\.').replace(/\//g, '\\/')}s\\b`, 'i');
    if (pluralPattern.test(cleanDescription)) {
      extractedSkills.add(skill);
    }
  });

  // 2. Find skills mentioned in common skill-indicating phrases
  const skillPhrases = [
    /proficiency (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /experience (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /knowledge of ([\w\s\.\/#+-]+)/gi,
    /familiar with ([\w\s\.\/#+-]+)/gi,
    /skills (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /expertise (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /competency (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /background (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /working with ([\w\s\.\/#+-]+)/gi,
    /proficient (?:in|with) ([\w\s\.\/#+-]+)/gi,
    /understanding of ([\w\s\.\/#+-]+)/gi,
    /ability to (use|work with|develop with|code in) ([\w\s\.\/#+-]+)/gi
  ];

  skillPhrases.forEach(phrase => {
    const matches = description.matchAll(phrase);
    for (const match of matches) {
      if (match && match[1]) {
        // Extract potential skill
        const potentialSkill = match[1].trim().replace(/\.$/, '').replace(/,$/, '').replace(/\s+/g, ' ');
        
        // Check if it's a known skill or contains known skills
        for (const skill of commonSkills) {
          if (potentialSkill.toLowerCase().includes(skill.toLowerCase())) {
            extractedSkills.add(skill);
          }
        }
      }
    }
  });

  // 3. Extract skills from list indicators (bullet points, numbered lists)
  const listItemPattern = /[-•*]\s+([\w\s\.\/#+-]+)/g;
  const listMatches = description.matchAll(listItemPattern);
  
  for (const match of listMatches) {
    if (match && match[1]) {
      const listItem = match[1].trim();
      // Check if list item contains a known skill
      for (const skill of commonSkills) {
        if (listItem.toLowerCase().includes(skill.toLowerCase())) {
          extractedSkills.add(skill);
        }
      }
    }
  }
  
  // 4. Find skills mentioned in technical requirement sections
  const requirementSections = [
    /technical (?:requirements|skills|qualifications)[\s\n:]*([^]*?)(?:\n\n|\n\r\n|$)/i,
    /required (?:technical)? skills[\s\n:]*([^]*?)(?:\n\n|\n\r\n|$)/i,
    /skills and qualifications[\s\n:]*([^]*?)(?:\n\n|\n\r\n|$)/i
  ];
  
  requirementSections.forEach(sectionPattern => {
    const sectionMatch = description.match(sectionPattern);
    if (sectionMatch && sectionMatch[1]) {
      const sectionText = sectionMatch[1];
      // Check for skills in this section
      for (const skill of commonSkills) {
        const skillPattern = new RegExp(`\\b${skill.replace(/\./g, '\\.').replace(/\//g, '\\/')}\\b`, 'i');
        if (skillPattern.test(sectionText)) {
          extractedSkills.add(skill);
        }
      }
    }
  });

  return Array.from(extractedSkills);
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