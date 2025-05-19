from fastapi import FastAPI, Body, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import openai
import os
import json
import base64
import tempfile
import PyPDF2
import docx2txt
import re
import spacy
from datetime import datetime
import uuid
import httpx

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure OpenAI configuration
endpoint = ""
api_key = ""
api_version = "2024-02-15-preview"
deployment_name = "gpt-4o"

# Initialize the Azure OpenAI client
client = openai.AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=api_key,
    api_version=api_version,
    http_client=httpx.Client()
)

# Try to load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except:
    import subprocess
    subprocess.call([
        "python", "-m", "spacy", "download", "en_core_web_sm"
    ])
    nlp = spacy.load("en_core_web_sm")

# Data Models
class JobDescriptionRequest(BaseModel):
    title: str
    company: str  
    department: Optional[str] = None
    description: str
    requiredExperience: Optional[str] = None
    employmentType: Optional[str] = None
    location: Optional[str] = None
    salaryRange: Optional[str] = None
    applicationDeadline: Optional[str] = None
    jobRequirements: Optional[str] = None
    jobResponsibilities: Optional[str] = None

class AnalyzedSection(BaseModel):
    section_name: str
    requirements: List[str]

class JobDescriptionAnalysis(BaseModel):
    sections: List[AnalyzedSection]

class Resume(BaseModel):
    id: str
    name: str
    fileName: str
    uploadDate: str
    content: str
    base64Data: Optional[str] = None

class JobDescription(BaseModel):
    title: str
    description: str
    skills: List[str]
    requirements: List[str]

class ResumeScoreDetail(BaseModel):
    category: str
    score: int
    matches: List[str]
    misses: List[str]
    feedback: str
    contexts: Optional[Dict[str, List[str]]] = None

class ResumeScore(BaseModel):
    resumeId: str
    resumeName: str
    fileName: str
    overallScore: int
    keywordMatch: int
    skillsMatch: int
    experienceMatch: int
    educationMatch: int
    evaluationDetails: List[str]
    scoreDetails: List[ResumeScoreDetail]

class ResumeAnalysisRequest(BaseModel):
    jobDescription: JobDescription
    resumes: List[Resume]

# Helper Functions for Resume Analysis
def extract_text_from_pdf(pdf_file):
    """Extract text from a PDF file."""
    try:
        # First attempt: Standard parsing with strict=False
        pdf_reader = PyPDF2.PdfReader(pdf_file, strict=False)
        text = ""
        for page in pdf_reader.pages:
            try:
                text += page.extract_text() + "\n"
            except Exception as e:
                print(f"Error extracting text from page: {str(e)}")
                continue
        
        if text.strip():
            return text
            
        # If we failed to extract any text, the PDF might be corrupted
        raise Exception("No text extracted from PDF")
    except Exception as e:
        print(f"Error reading PDF file: {str(e)}")
        
        # Second attempt: Try a more permissive approach
        try:
            # Reopen the file and try with special handling for startxref errors
            pdf_file.seek(0)
            
            # Read the file content
            pdf_content = pdf_file.read()
            
            # Fix common issues with startxref pointers
            try:
                # Clean the content for PyPDF2 - this helps with some corrupted PDFs
                if b"startxref" in pdf_content:
                    # Ensure the file has an EOF marker
                    if not pdf_content.strip().endswith(b"%%EOF"):
                        pdf_content = pdf_content + b"\n%%EOF"
                        
                # Write the cleaned content to a temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                    temp_file.write(pdf_content)
                    temp_path = temp_file.name
                
                # Try to read with the cleaned file
                with open(temp_path, 'rb') as fixed_file:
                    pdf_reader = PyPDF2.PdfReader(fixed_file, strict=False)
                    text = ""
                    for i in range(len(pdf_reader.pages)):
                        try:
                            page = pdf_reader.pages[i]
                            extracted = page.extract_text()
                            if extracted:
                                text += extracted + "\n"
                        except Exception as page_error:
                            print(f"Error on page {i}: {str(page_error)}")
                            continue
                
                # Clean up the temporary file
                try:
                    os.unlink(temp_path)
                except:
                    pass
                    
                if text.strip():
                    return text
            except Exception as repair_error:
                print(f"Repair attempt failed: {str(repair_error)}")
                
            # Third attempt: Try to extract text directly using a more basic approach
            pdf_file.seek(0)
            content = pdf_file.read()
            
            # Look for text using a simple pattern matching approach
            import re
            text_chunks = re.findall(b'\\(([^)]+)\\)', content)
            extracted_text = b""
            for chunk in text_chunks:
                if len(chunk) > 4:  # Avoid short chunks that are likely not text
                    try:
                        # Try to decode as ASCII or UTF-8
                        decoded = chunk.decode('utf-8', errors='ignore')
                        if any(c.isalpha() for c in decoded):
                            extracted_text += chunk + b" "
                    except:
                        pass
            
            if extracted_text:
                try:
                    return extracted_text.decode('utf-8', errors='ignore')
                except:
                    pass
            
            return "Could not extract text from PDF due to file corruption or format issues."
        except Exception as third_error:
            print(f"All recovery attempts failed: {str(third_error)}")
            return "Could not extract text from PDF due to file corruption or format issues."

def extract_text_from_docx(docx_file):
    """Extract text from a DOCX file."""
    text = docx2txt.process(docx_file)
    return text

def extract_text_from_resume(file_path, file_extension):
    """Extract text based on file type."""
    if file_extension.lower() == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_extension.lower() in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    else:
        return ""

def calculate_keyword_match(resume_text, job_description_text):
    """Calculate keyword match score based on important terms in job description."""
    # Use NLP to extract important keywords from job description
    job_doc = nlp(job_description_text.lower())
    resume_doc = nlp(resume_text.lower())
    
    # Extract nouns, proper nouns, and adjectives as keywords
    job_keywords = [token.text for token in job_doc if token.pos_ in ['NOUN', 'PROPN', 'ADJ'] 
                    and not token.is_stop and len(token.text) > 2]
    
    # Count unique keywords
    unique_keywords = set(job_keywords)
    matches = []
    
    for keyword in unique_keywords:
        if keyword in resume_text.lower():
            matches.append(keyword)
    
    # Calculate score (0-100)
    if len(unique_keywords) == 0:
        return 0, [], list(unique_keywords)
    
    score = min(100, int((len(matches) / len(unique_keywords)) * 100))
    misses = [k for k in unique_keywords if k not in matches]
    
    return score, matches, misses

def calculate_skills_match(resume_text, required_skills):
    """Calculate skills match score based on required skills."""
    if not resume_text or not required_skills:
        return 0, [], required_skills

    matches = []
    resume_lower = resume_text.lower()
    
    # Common technology abbreviations and their full forms
    tech_synonyms = {
        "js": ["javascript"],
        "ts": ["typescript"],
        "py": ["python"],
        "react": ["reactjs", "react.js", "react js"],
        "react native": ["reactnative"],
        "node": ["node.js", "nodejs", "node js"],
        "vue": ["vuejs", "vue.js", "vue js"],
        "angular": ["angularjs", "angular.js", "angular js"],
        "ai": ["artificial intelligence"],
        "ml": ["machine learning"],
        "dl": ["deep learning"],
        "db": ["database"],
        "ui": ["user interface"],
        "ux": ["user experience"],
        "aws": ["amazon web services"],
        "gcp": ["google cloud platform", "google cloud"],
        "azure": ["microsoft azure"],
        "k8s": ["kubernetes"],
        "ci/cd": ["ci", "cd", "continuous integration", "continuous deployment", "continuous delivery"],
        "oop": ["object oriented programming", "object-oriented programming"],
        ".net": ["dotnet", "dot net", "asp.net", "asp net"],
        "c#": ["csharp", "c sharp"],
        "java": ["java programming", "core java"],
        "nlp": ["natural language processing"]
    }
    
    # Convert skill variations to standard forms
    skill_variations = {}
    
    # Build a comprehensive synonym map
    for skill in required_skills:
        skill_lower = skill.lower().strip()
        # Add the original skill
        if skill_lower not in skill_variations:
            skill_variations[skill_lower] = skill
            
        # Add variations with spaces, hyphens, dots
        variations = [
            skill_lower.replace(' ', ''),  # Remove spaces
            skill_lower.replace(' ', '-'),  # Replace spaces with hyphens
            skill_lower.replace(' ', '.'),  # Replace spaces with dots
            skill_lower.replace('-', ' '),  # Replace hyphens with spaces
            skill_lower.replace('.', ' '),  # Replace dots with spaces
        ]
        
        for variation in variations:
            if variation and variation != skill_lower:
                skill_variations[variation] = skill
                
        # Add known synonyms
        skill_key = skill_lower.strip()
        if skill_key in tech_synonyms:
            for synonym in tech_synonyms[skill_key]:
                skill_variations[synonym] = skill
                
        # Also check if this skill is a synonym for other skills
        for tech, synonyms in tech_synonyms.items():
            if skill_lower in synonyms:
                skill_variations[tech] = skill
    
    # Check for skills in resume using better pattern matching
    for skill_var, original_skill in skill_variations.items():
        # Escape special regex characters
        pattern = re.escape(skill_var)
        
        # Different matching patterns
        patterns = [
            r'\b' + pattern + r'\b',  # Exact word boundary match
            r'\b' + pattern + r's\b',  # Plural form
            r'\b' + pattern + r'ing\b',  # Gerund form
            r'\b' + pattern + r'[\-\s]based\b',  # For "X-based" pattern
            r'\b' + pattern + r'[\-\s]related\b',  # For "X-related" pattern
            r'\bexperience\s+(?:with|in|using)?\s+' + pattern + r'\b',  # "experience with X" pattern
            r'\bknowledge\s+of\s+' + pattern + r'\b',  # "knowledge of X" pattern
            r'\bproficient\s+(?:with|in)?\s+' + pattern + r'\b',  # "proficient in X" pattern
            r'\bskills?\s+(?:with|in)?\s+' + pattern + r'\b',  # "skills in X" pattern
        ]
        
        # Check all patterns
        for p in patterns:
            if re.search(p, resume_lower, re.IGNORECASE):
                if original_skill not in matches:
                    matches.append(original_skill)
                break
    
    # Also check for exact skills to catch anything missed
    for skill in required_skills:
        skill_clean = skill.lower().strip()
        # Look for the skill as a whole word or phrase
        if skill not in matches and re.search(r'\b' + re.escape(skill_clean) + r'\b', resume_lower):
            matches.append(skill)
    
    # Calculate score (0-100)
    if not required_skills:
        return 0, [], required_skills
    
    score = min(100, int((len(matches) / len(required_skills)) * 100))
    misses = [s for s in required_skills if s not in matches]
    
    # Provide more detailed context about matches
    detailed_matches = []
    for match in matches:
        detailed_matches.append(match)
    
    return score, detailed_matches, misses

def extract_experience_info(resume_text):
    """Extract years of experience from resume text."""
    experience_patterns = [
        r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:work\s+)?experience',
        r'experience\s*:?\s*(\d+)\+?\s*years?',
        r'(?:professional|work)\s+experience\s*:?\s*(\d+)\+?\s*years?',
        r'worked\s+(?:for|as)(?:\s+an?)?(?:\s+\w+){1,4}\s+(?:for|over)\s+(\d+)\+?\s*years?'
    ]
    
    # Try to find years of experience
    for pattern in experience_patterns:
        matches = re.findall(pattern, resume_text, re.IGNORECASE)
        if matches:
            try:
                return int(matches[0])
            except:
                pass
    
    # If explicit year count not found, estimate from work history
    job_patterns = [
        r'(\d{4})\s*-\s*(?:present|current|now|\d{4})',
        r'(\d{2}/\d{4})\s*-\s*(?:present|current|now|\d{2}/\d{4})'
    ]
    
    all_years = []
    for pattern in job_patterns:
        matches = re.findall(pattern, resume_text, re.IGNORECASE)
        for match in matches:
            try:
                if '/' in match:  # MM/YYYY format
                    year = int(match.split('/')[1])
                else:
                    year = int(match)
                all_years.append(year)
            except:
                pass
    
    if all_years:
        return max(datetime.now().year - min(all_years), 1)
    
    return 0  # No experience info found

def calculate_experience_match(resume_text, job_requirements):
    """Calculate experience match score based on job requirements."""
    # Extract years of experience from resume
    resume_years = extract_experience_info(resume_text)
    
    # Look for required years of experience in job requirements
    required_years = 0
    for req in job_requirements:
        req_lower = req.lower()
        year_patterns = [
            r'(\d+)\+?\s*years',
            r'(\d+)\+?\s*\+\s*years',
            r'minimum\s+(?:of\s+)?(\d+)',
            r'at\s+least\s+(\d+)'
        ]
        
        for pattern in year_patterns:
            matches = re.findall(pattern, req_lower)
            if matches:
                try:
                    required_years = max(required_years, int(matches[0]))
                except:
                    pass
    
    # If no explicit year requirement, default to 2 years
    if required_years == 0:
        required_years = 2
    
    # Calculate score (0-100)
    if resume_years >= required_years:
        score = 100
    elif resume_years >= required_years * 0.7:
        score = 80
    elif resume_years >= required_years * 0.5:
        score = 60
    elif resume_years > 0:
        score = 40
    else:
        score = 20
    
    matches = [f"{resume_years} years of experience"]
    misses = []
    
    if resume_years < required_years:
        misses.append(f"Required {required_years} years, found {resume_years}")
    
    return score, matches, misses

def calculate_education_match(resume_text, job_requirements):
    """Calculate education match score based on education requirements."""
    # Define education levels and corresponding keywords
    education_levels = {
        "phd": ["phd", "ph.d", "doctor of philosophy", "doctorate"],
        "masters": ["master", "ms", "m.s", "m.a", "mba", "m.b.a"],
        "bachelors": ["bachelor", "bs", "b.s", "b.a", "undergraduate degree"],
        "associate": ["associate", "a.s", "a.a"],
        "certificate": ["certificate", "certification", "certified"],
        "high school": ["high school", "hs", "diploma", "ged"]
    }
    
    # Look for required education level in job requirements
    required_level = None
    for req in job_requirements:
        req_lower = req.lower()
        for level, keywords in education_levels.items():
            if any(keyword in req_lower for keyword in keywords):
                required_level = level
                break
        if required_level:
            break
    
    # If no explicit education requirement, default to bachelors
    if not required_level:
        required_level = "bachelors"
    
    # Determine resume education level
    resume_level = None
    resume_lower = resume_text.lower()
    
    # Check in order of highest to lowest level
    for level in ["phd", "masters", "bachelors", "associate", "certificate", "high school"]:
        keywords = education_levels[level]
        if any(re.search(r'\b' + re.escape(keyword) + r'\b', resume_lower) for keyword in keywords):
            resume_level = level
            break
    
    # Calculate score (0-100)
    education_rank = {
        "phd": 6,
        "masters": 5,
        "bachelors": 4,
        "associate": 3,
        "certificate": 2,
        "high school": 1,
        None: 0
    }
    
    required_rank = education_rank.get(required_level, 4)  # Default to bachelor's if unknown
    resume_rank = education_rank.get(resume_level, 0)
    
    if resume_rank >= required_rank:
        score = 100
    elif resume_rank > 0:
        # Partial credit for having some education below requirement
        score = int(min(90, 50 + 50 * (resume_rank / required_rank)))
    else:
        score = 0
    
    matches = []
    misses = []
    
    if resume_level:
        matches.append(f"{resume_level.title()} degree")
    else:
        misses.append("No education information found")
    
    if resume_rank < required_rank:
        misses.append(f"Required {required_level.title()}, found {'None' if not resume_level else resume_level.title()}")
    
    return score, matches, misses

def extract_resume_sections(resume_text):
    """Extract different sections from a resume."""
    # Define common section headers in resumes
    section_headers = {
        'education': ['education', 'academic background', 'academic qualifications', 'qualifications', 'degrees'],
        'experience': ['experience', 'work experience', 'employment history', 'work history', 'professional experience', 'career history'],
        'skills': ['skills', 'technical skills', 'core skills', 'competencies', 'expertise', 'technical expertise', 'proficiencies'],
        'projects': ['projects', 'personal projects', 'academic projects', 'key projects', 'project experience', 'project work'],
        'achievements': ['achievements', 'accomplishments', 'awards', 'honors', 'recognitions'],
        'certifications': ['certifications', 'certificates', 'professional certifications', 'accreditations'],
        'summary': ['summary', 'professional summary', 'profile', 'about me', 'career objective', 'objective', 'career summary']
    }
    
    # Initialize sections dictionary
    sections = {
        'education': "",
        'experience': "",
        'skills': "",
        'projects': "",
        'achievements': "",
        'certifications': "",
        'summary': "",
        'other': ""  # For text not categorized into specific sections
    }
    
    # Split resume into lines
    lines = resume_text.split('\n')
    
    # Initialize variables to track current section
    current_section = 'other'
    section_content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this line is a section header
        found_header = False
        for section, headers in section_headers.items():
            # Look for section headers (case insensitive)
            if any(header.lower() in line.lower() for header in headers) and len(line) < 50:
                # If we were collecting content for a previous section, save it
                if section_content:
                    sections[current_section] += "\n".join(section_content) + "\n"
                    section_content = []
                
                # Switch to new section
                current_section = section
                found_header = True
                break
        
        # If not a header, add to current section content
        if not found_header:
            section_content.append(line)
    
    # Add the last section content
    if section_content:
        sections[current_section] += "\n".join(section_content)
    
    return sections

def analyze_resume_projects(resume_text):
    """Analyze projects mentioned in the resume to extract skills and experience."""
    sections = extract_resume_sections(resume_text)
    projects_text = sections['projects']
    
    if not projects_text:
        # Try to find projects in experience section if not found in dedicated section
        experience_text = sections['experience']
        
        # Look for project indicators in experience
        project_indicators = ['project:', 'project -', 'project name:', 'developed', 'implemented', 'created', 'built']
        for indicator in project_indicators:
            if indicator.lower() in experience_text.lower():
                projects_text = experience_text
                break
    
    project_skills = []
    project_descriptions = []
    
    if projects_text:
        # Split by potential project separators
        project_chunks = re.split(r'\n(?=[\•\-\*]\s+|[A-Z][a-z]+\s+[Pp]roject:?|[Pp]roject\s+\d+:?)', projects_text)
        
        for chunk in project_chunks:
            if len(chunk.strip()) > 20:  # Ignore very short chunks
                project_descriptions.append(chunk.strip())
                
                # Extract technical terms that might be skills
                doc = nlp(chunk)
                for token in doc:
                    if token.pos_ in ['NOUN', 'PROPN'] and len(token.text) > 2 and not token.is_stop:
                        potential_skill = token.text.lower()
                        project_skills.append(potential_skill)
    
    return project_descriptions, project_skills

def extract_contextual_skills(resume_text, job_skills):
    """
    Extract skills from the resume with context awareness.
    Looks for skills in different sections and understands the context they're mentioned in.
    """
    # Get resume sections
    sections = extract_resume_sections(resume_text)
    
    # Extract projects and their skills
    project_descriptions, project_skills = analyze_resume_projects(resume_text)
    
    # Create a dictionary to track where skills are found and their context
    skill_contexts = {}
    
    # Common technology abbreviations and their full forms
    tech_synonyms = {
        "js": ["javascript"],
        "ts": ["typescript"],
        "py": ["python"],
        "react": ["reactjs", "react.js", "react js"],
        "react native": ["reactnative"],
        "node": ["node.js", "nodejs", "node js"],
        "vue": ["vuejs", "vue.js", "vue js"],
        "angular": ["angularjs", "angular.js", "angular js"],
        "ai": ["artificial intelligence"],
        "ml": ["machine learning"],
        "dl": ["deep learning"],
        "db": ["database"],
        "ui": ["user interface"],
        "ux": ["user experience"],
        "aws": ["amazon web services"],
        "gcp": ["google cloud platform", "google cloud"],
        "azure": ["microsoft azure"],
        "k8s": ["kubernetes"],
        "ci/cd": ["ci", "cd", "continuous integration", "continuous deployment", "continuous delivery"],
        "oop": ["object oriented programming", "object-oriented programming"],
        ".net": ["dotnet", "dot net", "asp.net", "asp net"],
        "c#": ["csharp", "c sharp"],
        "java": ["java programming", "core java"],
        "nlp": ["natural language processing"]
    }
    
    # Build a dictionary of skill variations for each job skill
    skill_variations = {}
    for skill in job_skills:
        skill_lower = skill.lower().strip()
        # Add the original skill
        if skill_lower not in skill_variations:
            skill_variations[skill_lower] = skill
            
        # Add variations with spaces, hyphens, dots
        variations = [
            skill_lower.replace(' ', ''),  # Remove spaces
            skill_lower.replace(' ', '-'),  # Replace spaces with hyphens
            skill_lower.replace(' ', '.'),  # Replace spaces with dots
            skill_lower.replace('-', ' '),  # Replace hyphens with spaces
            skill_lower.replace('.', ' '),  # Replace dots with spaces
        ]
        
        for variation in variations:
            if variation and variation != skill_lower:
                skill_variations[variation] = skill
                
        # Add known synonyms
        skill_key = skill_lower.strip()
        if skill_key in tech_synonyms:
            for synonym in tech_synonyms[skill_key]:
                skill_variations[synonym] = skill
                
        # Also check if this skill is a synonym for other skills
        for tech, synonyms in tech_synonyms.items():
            if skill_lower in synonyms:
                skill_variations[tech] = skill
    
    # Analysis patterns for each section
    section_patterns = {
        'experience': [
            r'(?:used|utilized|developed with|worked with|experienced in|expertise in)\s+([\w\s\.\-\,\/]+)',
            r'(?:proficient in|experience with|knowledge of)\s+([\w\s\.\-\,\/]+)'
        ],
        'skills': [
            r'[\•\-\*]\s*([\w\s\.\-\,\/]+)',
            r'([\w\s\.\-\,\/]+?)(?:[\:\,]|\s+and\s+)'
        ],
        'projects': [
            r'(?:using|with|built with|developed with|implemented using)\s+([\w\s\.\-\,\/]+)',
            r'(?:technologies|tech stack|tools|frameworks|languages)(?:\s+used)?(?:\s+include)?(?:\s*:)?\s+([\w\s\.\-\,\/]+)'
        ],
        'education': [
            r'(?:studied|coursework in|focused on|specialized in)\s+([\w\s\.\-\,\/]+)'
        ]
    }
    
    # Analyze each section for skills with context
    for section_name, section_text in sections.items():
        if not section_text:
            continue
            
        # Check for direct skill mentions in this section
        for skill_var, original_skill in skill_variations.items():
            # Escape special regex characters
            pattern = re.escape(skill_var)
            
            # Different matching patterns based on section
            if section_name in section_patterns:
                matched = False
                
                # Try section-specific patterns first
                for p in section_patterns[section_name]:
                    matches = re.findall(p, section_text, re.IGNORECASE)
                    for match in matches:
                        if isinstance(match, str) and skill_var in match.lower():
                            if original_skill not in skill_contexts:
                                skill_contexts[original_skill] = []
                            context = f"Found in {section_name} section: '{match.strip()}'"
                            if context not in skill_contexts[original_skill]:
                                skill_contexts[original_skill].append(context)
                            matched = True
                
                # Also try direct word boundary match
                if not matched:
                    if re.search(r'\b' + pattern + r'\b', section_text, re.IGNORECASE):
                        if original_skill not in skill_contexts:
                            skill_contexts[original_skill] = []
                        context = f"Mentioned in {section_name} section"
                        if context not in skill_contexts[original_skill]:
                            skill_contexts[original_skill].append(context)
            else:
                # For sections without specific patterns, use simple word boundary match
                if re.search(r'\b' + pattern + r'\b', section_text, re.IGNORECASE):
                    if original_skill not in skill_contexts:
                        skill_contexts[original_skill] = []
                    context = f"Mentioned in {section_name} section"
                    if context not in skill_contexts[original_skill]:
                        skill_contexts[original_skill].append(context)
    
    # Also analyze project descriptions specifically
    for i, project in enumerate(project_descriptions):
        for skill_var, original_skill in skill_variations.items():
            pattern = re.escape(skill_var)
            if re.search(r'\b' + pattern + r'\b', project, re.IGNORECASE):
                if original_skill not in skill_contexts:
                    skill_contexts[original_skill] = []
                    
                # Capture a brief project context
                project_brief = project[:100] + "..." if len(project) > 100 else project
                context = f"Used in project: '{project_brief}'"
                if context not in skill_contexts[original_skill]:
                    skill_contexts[original_skill].append(context)
    
    # Return matched skills with their contexts
    matched_skills = list(skill_contexts.keys())
    return matched_skills, skill_contexts

def enhanced_skills_match(resume_text, required_skills):
    """Enhanced skills match with context awareness from different resume sections."""
    if not resume_text or not required_skills:
        return 0, [], [], {}
    
    # Get contextual skills extraction
    matched_skills, skill_contexts = extract_contextual_skills(resume_text, required_skills)
    
    # Calculate score (0-100)
    if not required_skills:
        return 0, [], required_skills, {}
    
    score = min(100, int((len(matched_skills) / len(required_skills)) * 100))
    misses = [s for s in required_skills if s not in matched_skills]
    
    return score, matched_skills, misses, skill_contexts

@app.post("/analyze-job-description", response_model=JobDescriptionAnalysis)
async def analyze_job_description(request: JobDescriptionRequest = Body(...)):
    """
    Analyze a job description and extract sections, requirements, and skills.
    Now includes analysis of all job fields, not just the description.
    """
    try:
        # Combine all fields into a comprehensive prompt
        all_fields_text = f"""
        Job Title: {request.title}
        Company: {request.company}
        """
        
        if request.department:
            all_fields_text += f"Department: {request.department}\n"
        
        all_fields_text += f"\nJob Description:\n{request.description}\n"
        
        if request.requiredExperience:
            all_fields_text += f"\nRequired Experience: {request.requiredExperience}\n"
            
        if request.employmentType:
            all_fields_text += f"Employment Type: {request.employmentType}\n"
            
        if request.location:
            all_fields_text += f"Location: {request.location}\n"
            
        if request.salaryRange:
            all_fields_text += f"Salary Range: {request.salaryRange}\n"
            
        if request.applicationDeadline:
            all_fields_text += f"Application Deadline: {request.applicationDeadline}\n"
        
        if request.jobRequirements:
            all_fields_text += f"\nJob Requirements:\n{request.jobRequirements}\n"
            
        if request.jobResponsibilities:
            all_fields_text += f"\nJob Responsibilities:\n{request.jobResponsibilities}\n"
        
        # Send the comprehensive job data for analysis
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": """
                You are an AI assistant specialized in analyzing job descriptions.
                Your task is to extract key sections, requirements, and skills from a job description.
                Parse all fields provided including job title, company, department, experience, employment type, 
                location, salary, requirements, and responsibilities.
                
                Focus particularly on extracting technical skills, programming languages, frameworks, tools,
                and specific competencies mentioned in the job. Don't miss any technical skills.
                
                Organize the content into relevant sections such as:
                1. Technical Skills (list ALL technologies, languages, frameworks, tools mentioned)
                2. Soft Skills (communication, teamwork, etc.)
                3. Experience Requirements (years needed, domain knowledge)
                4. Education Requirements (degrees, certifications)
                5. Job Responsibilities (daily tasks, deliverables)
                6. Company Information (culture, benefits)
                7. Compensation & Benefits
                8. Job Details (location, employment type)
                
                For each section, provide a list of clear, concise points. 
                For skills sections, list each skill separately and include all technical skills mentioned.
                """
                },
                {"role": "user", "content": all_fields_text}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        analysis_text = response.choices[0].message.content.strip()
        
        # Parse the analysis text into sections
        sections = []
        current_section = None
        current_requirements = []
        
        for line in analysis_text.split('\n'):
            stripped_line = line.strip()
            
            # Check if this is a section header
            if (stripped_line and 
                (stripped_line.endswith(':') or 
                 any(stripped_line.startswith(prefix) for prefix in ['#', '##', '**']) or
                 stripped_line.isupper())):
                
                # Save previous section if it exists
                if current_section and current_requirements:
                    sections.append({
                        "section_name": current_section,
                        "requirements": current_requirements
                    })
                    
                # Start new section
                current_section = stripped_line.rstrip(':').replace('#', '').replace('*', '').strip()
                current_requirements = []
                
            # Check if this is a requirement (bullet point)
            elif stripped_line.startswith(('-', '•', '*', '>', '·')) and stripped_line[1:].strip():
                requirement = stripped_line[1:].strip()
                if requirement and current_section:
                    current_requirements.append(requirement)
                    
            # Check if this might be a numbered requirement
            elif re.match(r'^\d+[\.\)]', stripped_line) and stripped_line[2:].strip():
                requirement = re.sub(r'^\d+[\.\)]', '', stripped_line).strip()
                if requirement and current_section:
                    current_requirements.append(requirement)
            
            # Check for "keyword:" format
            elif ':' in stripped_line and not current_section:
                parts = stripped_line.split(':', 1)
                if len(parts) == 2 and parts[0].strip() and parts[1].strip():
                    # This might be a requirement in "key: value" format
                    requirement = stripped_line
                    if current_section:
                        current_requirements.append(requirement)
        
        # Add the last section if it exists
        if current_section and current_requirements:
            sections.append({
                "section_name": current_section,
                "requirements": current_requirements
            })
            
        # If no sections were found, try a different approach to parse the text
        if not sections:
            # Simple alternative parsing approach
            current_section = "General Requirements"
            current_requirements = []
            
            for line in analysis_text.split('\n'):
                stripped_line = line.strip()
                if stripped_line and len(stripped_line) > 10 and not stripped_line.isupper():
                    current_requirements.append(stripped_line)
            
            if current_requirements:
                sections.append({
                    "section_name": current_section,
                    "requirements": current_requirements
                })
        
        # Additional processing for technical skills
        technical_skills = []
        for section in sections:
            # If this is a skills section, extract individual skills
            if 'skill' in section["section_name"].lower() or 'technolog' in section["section_name"].lower():
                for req in section["requirements"]:
                    # Try to extract individual skills from comma-separated lists or multi-skill requirements
                    if ',' in req:
                        # Split by comma and process each item
                        parts = [p.strip() for p in req.split(',')]
                        for part in parts:
                            if part and len(part) > 1:  # Skip empty or single-char parts
                                technical_skills.append(part)
                    else:
                        # Handle skill requirements without commas
                        technical_skills.append(req)
        
        # If we found technical skills, add them as a separate section if not already present
        if technical_skills and not any('technical skill' in s["section_name"].lower() for s in sections):
            sections.append({
                "section_name": "Individual Technical Skills",
                "requirements": technical_skills
            })
        
        # Return the analysis
        return {"sections": sections}
        
    except Exception as e:
        print(f"Error analyzing job description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-resumes", response_model=List[ResumeScore])
async def analyze_resumes(request: ResumeAnalysisRequest = Body(...)):
    try:
        job_description = request.jobDescription
        resumes = request.resumes
        
        # Validate and preprocess job description
        if not job_description.skills or len(job_description.skills) == 0:
            # Extract skills from job description if none were provided
            # This could happen if the job description wasn't analyzed separately before
            extracted_skills = []
            
            # Extract skills that are explicitly mentioned with common phrases
            skill_phrases = [
                r'proficiency (?:in|with) ([\w\s\./]+)',
                r'experience (?:in|with) ([\w\s\./]+)',
                r'knowledge of ([\w\s\./]+)',
                r'familiar with ([\w\s\./]+)', 
                r'skills (?:in|with) ([\w\s\./]+)',
                r'expertise (?:in|with) ([\w\s\./]+)'
            ]
            
            for pattern in skill_phrases:
                matches = re.findall(pattern, job_description.description, re.IGNORECASE)
                for match in matches:
                    # Clean up and add to extracted skills
                    skill = match.strip().rstrip('.,:;')
                    if len(skill) > 2:  # Ignore very short matches
                        extracted_skills.append(skill)
            
            # Also extract technical terms that might be skills
            doc = nlp(job_description.description)
            for ent in doc.ents:
                if ent.label_ in ['ORG', 'PRODUCT', 'WORK_OF_ART'] and len(ent.text) > 2:
                    extracted_skills.append(ent.text)
            
            # Add common programming languages and frameworks if they appear
            common_tech = [
                "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Ruby", "PHP", 
                "React", "Angular", "Vue", "Node.js", "Django", "Flask", "Express", 
                "AWS", "Azure", "GCP", "SQL", "NoSQL", "MongoDB"
            ]
            
            for tech in common_tech:
                if re.search(r'\b' + re.escape(tech) + r'\b', job_description.description, re.IGNORECASE):
                    extracted_skills.append(tech)
            
            # Remove duplicates and update job description
            job_description.skills = list(set(extracted_skills))
        
        results = []
        
        # Process each resume
        for resume in resumes:
            resume_text = resume.content
            
            # If we have base64 data, try to extract text from the file
            if resume.base64Data:
                try:
                    # Decode base64 data
                    file_data = base64.b64decode(resume.base64Data.split(',')[1] if ',' in resume.base64Data else resume.base64Data)
                    
                    # Determine file extension
                    file_extension = os.path.splitext(resume.fileName)[1]
                    
                    # Create a temporary file to process
                    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                        temp_file.write(file_data)
                        temp_file_path = temp_file.name
                    
                    try:
                        # Extract text based on file type
                        extracted_text = extract_text_from_resume(temp_file_path, file_extension)
                        
                        # If we got text from the file, use it instead of the provided content
                        if extracted_text and extracted_text.strip() and not extracted_text.startswith("Could not extract"):
                            resume_text = extracted_text
                    except Exception as extraction_error:
                        print(f"Error extracting text from file: {str(extraction_error)}")
                        # Continue with the provided content if extraction fails
                    
                    # Clean up the temporary file
                    try:
                        os.unlink(temp_file_path)
                    except:
                        pass  # Ignore errors during temp file cleanup
                        
                except Exception as e:
                    print(f"Error processing base64 data: {str(e)}")
                    # Continue with the provided content if extraction fails
            
            # Get resume sections for better analysis
            resume_sections = extract_resume_sections(resume_text)
            project_descriptions, project_skills = analyze_resume_projects(resume_text)
            
            # Calculate keyword match
            keyword_score, keyword_matches, keyword_misses = calculate_keyword_match(
                resume_text, job_description.description
            )
            
            # Ensure we have skills to match against
            if not job_description.skills:
                # If still no skills, use a general fallback
                job_description.skills = ["Programming", "Development", "Software", "Web", "Mobile", "Cloud"]
            
            # Use our enhanced skills match function for better context-aware matching
            skills_score, skills_matches, skills_misses, skills_contexts = enhanced_skills_match(
                resume_text, job_description.skills
            )
            
            # Log values for debugging
            print(f"Resume: {resume.fileName}")
            print(f"Skills to match: {job_description.skills}")
            print(f"Skills matched: {skills_matches}")
            print(f"Skills score: {skills_score}")
            
            # Calculate experience match with added context from projects
            experience_text = resume_sections['experience']
            if project_descriptions:
                # Add project information to experience assessment
                combined_experience = experience_text + "\n" + "\n".join(project_descriptions)
                experience_score, experience_matches, experience_misses = calculate_experience_match(
                    combined_experience, job_description.requirements
                )
            else:
                experience_score, experience_matches, experience_misses = calculate_experience_match(
                    resume_text, job_description.requirements
                )
            
            education_score, education_matches, education_misses = calculate_education_match(
                resume_text, job_description.requirements
            )
            
            # Calculate overall score (weighted average)
            overall_score = int(
                keyword_score * 0.05 +
                skills_score * 0.45 +
                experience_score * 0.35 +
                education_score * 0.15
            )
            
            # Generate evaluation details
            evaluation_details = []
            
            # Keyword match evaluation
            if keyword_score >= 80:
                evaluation_details.append(f"Excellent keyword match with the job description. The resume contains most of the important terms required.")
            elif keyword_score >= 60:
                evaluation_details.append(f"Good keyword match found. Consider adding more specific terms from the job description.")
            else:
                evaluation_details.append(f"Low keyword match. The resume lacks many important terms from the job description.")
            
            # Skills match evaluation with context information
            if skills_score >= 80:
                evaluation_details.append(f"Excellent skills alignment. The resume demonstrates proficiency in {len(skills_matches)} of {len(job_description.skills)} required skills.")
            elif skills_score >= 60:
                evaluation_details.append(f"Good skills match, but some key skills could be highlighted more prominently. Found {len(skills_matches)} of {len(job_description.skills)} required skills.")
            else:
                evaluation_details.append(f"Low skills match. Only found {len(skills_matches)} of {len(job_description.skills)} required skills.")
            
            # Add project insight
            if project_descriptions:
                num_projects = len(project_descriptions)
                evaluation_details.append(f"Resume includes {num_projects} projects that demonstrate practical application of skills.")
            
            # Experience match evaluation
            if experience_score >= 80:
                evaluation_details.append(f"Work experience aligns very well with the job requirements.")
            elif experience_score >= 60:
                evaluation_details.append(f"Relevant work experience found, but could better highlight achievements related to the requirements.")
            else:
                evaluation_details.append(f"Experience seems insufficient compared to job requirements. Consider highlighting relevant projects or achievements.")
            
            # Education match evaluation
            if education_score >= 80:
                evaluation_details.append(f"Education background is a great match for this role.")
            elif education_score >= 60:
                evaluation_details.append(f"Educational qualifications meet basic requirements, but could highlight relevant coursework or certifications.")
            else:
                evaluation_details.append(f"Educational background may need supplementing with relevant certifications or courses for this role.")
            
            # Enhanced skills details with context
            detailed_skill_feedback = []
            for skill in skills_matches:
                if skill in skills_contexts:
                    contexts = skills_contexts[skill]
                    if contexts:
                        # Use the first context for each skill (we will include others in the detailed view)
                        detailed_skill_feedback.append(f"{skill}: {contexts[0]}")
            
            if detailed_skill_feedback:
                evaluation_details.append("Skill context analysis: " + "; ".join(detailed_skill_feedback[:3]) + 
                                        (f" and {len(detailed_skill_feedback) - 3} more" if len(detailed_skill_feedback) > 3 else ""))
            
            # Create detailed score breakdowns
            # Enhanced skills details to include the context information
            skills_detail_matches = []
            for skill in skills_matches:
                if skill in skills_contexts:
                    contexts = skills_contexts[skill]
                    if contexts:
                        # Include skill with its first context
                        skills_detail_matches.append(f"{skill} ({contexts[0]})")
                    else:
                        skills_detail_matches.append(skill)
                else:
                    skills_detail_matches.append(skill)
            
            score_details = [
                {
                    "category": "Keywords",
                    "score": keyword_score,
                    "matches": keyword_matches[:10],  # Limit to top 10
                    "misses": keyword_misses[:10],   # Limit to top 10
                    "feedback": evaluation_details[0]
                },
                {
                    "category": "Skills",
                    "score": skills_score,
                    "matches": skills_detail_matches,
                    "misses": skills_misses,
                    "feedback": evaluation_details[1] if len(evaluation_details) > 1 else "",
                    "contexts": skills_contexts   # Add the skill contexts to the Skills detail
                },
                {
                    "category": "Experience",
                    "score": experience_score,
                    "matches": experience_matches,
                    "misses": experience_misses,
                    "feedback": evaluation_details[-3] if len(evaluation_details) >= 3 else ""
                },
                {
                    "category": "Education",
                    "score": education_score,
                    "matches": education_matches,
                    "misses": education_misses,
                    "feedback": evaluation_details[-2] if len(evaluation_details) >= 2 else ""
                }
            ]
            
            # Add contextual information about projects if available
            if project_descriptions:
                project_highlights = []
                for i, project in enumerate(project_descriptions[:3]):  # Include up to 3 projects
                    # Truncate long project descriptions
                    brief = project[:100] + "..." if len(project) > 100 else project
                    project_highlights.append(brief)
                
                score_details.append({
                    "category": "Projects",
                    "score": min(100, 60 + len(project_descriptions) * 10),  # More projects = higher score
                    "matches": project_highlights,
                    "misses": [],
                    "feedback": f"Resume includes {len(project_descriptions)} projects demonstrating practical skills application."
                })
            
            # Create the resume score object
            resume_score = {
                "resumeId": resume.id,
                "resumeName": resume.name,
                "fileName": resume.fileName,
                "overallScore": overall_score,
                "keywordMatch": keyword_score,
                "skillsMatch": skills_score,
                "experienceMatch": experience_score,
                "educationMatch": education_score,
                "evaluationDetails": evaluation_details,
                "scoreDetails": score_details
            }
            
            results.append(resume_score)
        
        # Sort results by overall score (highest first)
        results.sort(key=lambda x: x["overallScore"], reverse=True)
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resumes: {str(e)}")

@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    temp_file_path = None
    try:
        # Create a temporary file to store the uploaded content
        file_extension = os.path.splitext(file.filename)[1]
        
        try:
            # Read file content
            content = await file.read()
            
            # Check for common PDF errors in content
            if file_extension.lower() == '.pdf' and b'startxref' in content:
                print("Detected potential PDF with startxref - applying special handling")
                # Ensure proper EOF marking
                if not content.strip().endswith(b"%%EOF"):
                    content = content + b"\n%%EOF"
            
            # Write to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            # Extract text based on file type
            resume_text = extract_text_from_resume(temp_file_path, file_extension)
        except Exception as e:
            print(f"Error processing file: {str(e)}")
            # Check if it's a startxref error
            if "startxref" in str(e).lower():
                return {
                    "error": "The PDF file appears to be corrupted (incorrect startxref pointer). Please try another PDF file or convert this file to a different format."
                }
            return {"error": f"Error processing the uploaded file: {str(e)}"}
        finally:
            # Clean up the temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass  # Ignore cleanup errors
        
        if not resume_text or not resume_text.strip() or resume_text.startswith("Could not extract"):
            return {"error": "Could not extract text from the uploaded file. The file might be corrupted or password-protected."}
        
        # Generate a unique ID and create Resume object
        resume_id = str(uuid.uuid4())
        name = os.path.splitext(file.filename)[0]
        
        resume = {
            "id": resume_id,
            "name": name,
            "fileName": file.filename,
            "uploadDate": datetime.now().isoformat(),
            "content": resume_text
        }
        
        return resume
    
    except Exception as e:
        error_msg = str(e)
        print(f"Exception in parse_resume: {error_msg}")
        # Check for common PDF errors
        if "startxref" in error_msg.lower():
            return {
                "error": "The PDF file appears to be corrupted (incorrect startxref pointer). Please try another PDF file or convert this file to a different format."
            }
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {error_msg}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False) 