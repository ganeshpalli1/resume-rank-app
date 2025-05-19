import React, { useState } from "react";
import { FileSearch, ChevronRight, Calendar, Clock, Users, FileText, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResumeDropzone from "@/components/ResumeDropzone";
import ResumeRanking from "@/components/ResumeRanking";
import { Resume, ResumeScore, JobDescription } from "@/types/resume";
import { useToast } from "@/components/ui/use-toast";
import { analyzeResumes } from "@/services/resumeAnalysis";
import { motion, AnimatePresence } from "framer-motion";

// Mock data for analysis sessions
const mockSessions = [
  {
    id: "session-1",
    jobTitle: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    date: new Date(2023, 7, 15),
    resumeCount: 30,
    topScore: 92,
    avgScore: 72,
  },
  {
    id: "session-2",
    jobTitle: "UX/UI Designer",
    company: "DesignHub",
    date: new Date(2023, 7, 10),
    resumeCount: 25,
    topScore: 88,
    avgScore: 67,
  },
  {
    id: "session-3",
    jobTitle: "Product Manager",
    company: "SaaS Solutions",
    date: new Date(2023, 7, 5),
    resumeCount: 18,
    topScore: 95,
    avgScore: 76,
  }
];

// Mock data for resume scores in a session
const mockResumeScores: ResumeScore[] = [
  {
    resumeId: "resume-1",
    resumeName: "John Smith",
    fileName: "john_smith_resume.pdf",
    overallScore: 92,
    keywordMatch: 85,
    skillsMatch: 95,
    experienceMatch: 90,
    educationMatch: 88,
    evaluationDetails: ["Good match for the position", "5+ years of relevant experience"],
    scoreDetails: [
      {
        category: "Skills",
        matches: ["React", "TypeScript", "Redux"],
        misses: ["Vue.js"]
      }
    ]
  },
  {
    resumeId: "resume-2",
    resumeName: "Sarah Johnson",
    fileName: "sarah_johnson.pdf",
    overallScore: 86,
    keywordMatch: 80,
    skillsMatch: 88,
    experienceMatch: 85,
    educationMatch: 90,
    evaluationDetails: ["Good match for the position", "4 years of relevant experience"],
    scoreDetails: [
      {
        category: "Skills",
        matches: ["React", "JavaScript", "CSS"],
        misses: ["TypeScript", "Redux"]
      }
    ]
  },
  {
    resumeId: "resume-3",
    resumeName: "Michael Brown",
    fileName: "michael_brown_resume.docx",
    overallScore: 78,
    keywordMatch: 70,
    skillsMatch: 80,
    experienceMatch: 82,
    educationMatch: 75,
    evaluationDetails: ["Moderate match for the position", "3 years of relevant experience"],
    scoreDetails: [
      {
        category: "Skills",
        matches: ["JavaScript", "HTML", "CSS"],
        misses: ["React", "TypeScript", "Redux"]
      }
    ]
  }
];

const ResumeParsing = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleResumeUpload = (resumes: Resume[]) => {
    if (resumes.length > 0) {
      setIsUploading(true);
      
      // Show toast notification
      toast({
        title: "Processing resumes",
        description: `Analyzing ${resumes.length} resumes. This might take a moment.`,
      });
      
      // Simulate analysis delay
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: "Analysis complete",
          description: `Successfully analyzed ${resumes.length} resumes.`,
        });
        
        // In a real implementation, we would save the analysis results
        // and update the sessions list
      }, 2000);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSession(sessionId);
  };
  
  const handleBackClick = () => {
    setSelectedSession(null);
  };

  // Formatting helper function
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // If a session is selected, show the resume rankings
  if (selectedSession) {
    // Find the session (would normally fetch from API)
    const session = mockSessions.find(s => s.id === selectedSession);
    
    if (!session) return null;
    
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={handleBackClick}
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Sessions
          </Button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-resume-text mb-2">
              {session.jobTitle}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-resume-primary" />
                {formatDate(session.date)}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-resume-primary" />
                {session.resumeCount} resumes
              </div>
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 mr-1 text-resume-primary" />
                Avg score: {session.avgScore}%
              </div>
              {session.company && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-resume-primary" />
                  {session.company}
                </div>
              )}
            </div>
          </div>
          
          <ResumeRanking scores={mockResumeScores} />
        </div>
      </div>
    );
  }

  // Main session list view
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-resume-primary/10 p-2 rounded-lg">
            <FileSearch className="h-6 w-6 text-resume-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-resume-text">Resume Parsing</h1>
        </div>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-6">
            Upload and analyze resumes to extract key information automatically.
            Past analysis sessions are shown below.
          </p>
          
          <ResumeDropzone onResumeUpload={handleResumeUpload} />
        </div>
        
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-resume-text mb-4">Recent Analysis Sessions</h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnimatePresence>
              {mockSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}
                  className="cursor-pointer"
                  onClick={() => handleSessionClick(session.id)}
                >
                  <Card className="border-resume-border hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-medium text-lg">{session.jobTitle}</h3>
                        <div className="bg-resume-primary/10 text-resume-primary text-sm px-2 py-1 rounded-full">
                          {session.topScore}% top score
                        </div>
                      </div>
                      
                      <div className="text-sm mb-4">{session.company}</div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(session.date)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {session.resumeCount} resumes
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="mt-4 ml-auto flex items-center">
                        View Results
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {mockSessions.length === 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-600">No analysis sessions yet. Upload resumes to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeParsing; 