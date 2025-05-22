import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, AlertTriangle, List, BarChart3, ChevronRight, Clock, Award, Users, FileText, Check, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useResumeStore } from "@/store/resumeStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Premium animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
};

const floatVariants: Variants = {
  hidden: { y: 0 },
  visible: {
    y: [0, -10, 0],
    transition: {
      repeat: Infinity,
      repeatType: "mirror",
      duration: 3,
      ease: "easeInOut"
    }
  }
};

const shimmerVariants: Variants = {
  hidden: { backgroundPosition: "200% 0" },
  visible: {
    backgroundPosition: ["-100%", "200%"],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "linear"
    }
  }
};

const pageTransitionVariants: Variants = {
  initial: { 
    opacity: 0,
    y: 20
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const Results = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("highest");
  const [showDetailed, setShowDetailed] = useState(false);
  const [fullDetailJobId, setFullDetailJobId] = useState<string | null>(null);
  
  const { 
    currentResumeScores: resumeScores, 
    currentErroredFiles: erroredFiles, 
    currentJobTitle: jobTitle, 
    currentJobCompany: jobCompany, 
    currentResumeCount: resumeCount,
    jobAnalyses
  } = useResumeStore();

  // Check if we have any analyses to show
  const hasAnalyses = resumeScores.length > 0 || jobAnalyses.length > 0;

  // Find the currently selected job analysis for full detail view
  const selectedJobAnalysis = fullDetailJobId ? 
    jobAnalyses.find(job => job.jobId === fullDetailJobId) : null;

  // If no analyses are available, show a message
  if (!hasAnalyses) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full py-8 px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Results</h2>
            
            <Card className="backdrop-blur-sm bg-white/80 p-8 text-center border border-slate-200/50 shadow-lg">
              <motion.div 
                className="mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.div
                  variants={floatVariants}
                  initial="hidden"
                  animate="visible"
                  className="mx-auto mb-4 w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center"
                >
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </motion.div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Resume Analysis Available</h3>
                <p className="text-slate-500">Upload resumes for a job posting to see analysis results here.</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg text-white px-6"
                  onClick={() => navigate("/resumes")}
                >
                  Create New Job Post
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If a job analysis is selected for full detail view
  if (fullDetailJobId && selectedJobAnalysis) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
        variants={pageTransitionVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="w-full py-8 px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <motion.button
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
              onClick={() => setFullDetailJobId(null)}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Results</span>
            </motion.button>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formatDate(selectedJobAnalysis.timestamp)}</span>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card className="backdrop-blur-sm bg-white/90 overflow-hidden border border-slate-200/50 shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">{selectedJobAnalysis.jobTitle}</h1>
                    {selectedJobAnalysis.jobCompany && (
                      <span className="text-lg text-slate-500">{selectedJobAnalysis.jobCompany}</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "bg-gradient-to-r px-4 py-1 border-none shadow-sm text-white text-sm",
                      selectedJobAnalysis.resumeScores.length > 0 && selectedJobAnalysis.resumeScores[0].overallScore >= 80 
                        ? "from-emerald-500 to-emerald-600" 
                        : selectedJobAnalysis.resumeScores.length > 0 && selectedJobAnalysis.resumeScores[0].overallScore >= 60 
                          ? "from-amber-500 to-amber-600" 
                          : "from-slate-400 to-slate-500"
                    )}
                  >
                    <Award className="h-4 w-4 mr-1.5" />
                    {selectedJobAnalysis.resumeScores.length > 0 
                      ? `Top Score: ${Math.max(...selectedJobAnalysis.resumeScores.map(s => s.overallScore))}%` 
                      : "No scores"}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{selectedJobAnalysis.resumeCount}</div>
                  <div className="text-xs text-blue-600/80 uppercase tracking-wide mt-1">Resumes</div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">
                    {selectedJobAnalysis.resumeScores.filter(score => score.overallScore >= 80).length}
                  </div>
                  <div className="text-xs text-emerald-600/80 uppercase tracking-wide mt-1">Excellent</div>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">
                    {selectedJobAnalysis.resumeScores.filter(score => score.overallScore >= 60 && score.overallScore < 80).length}
                  </div>
                  <div className="text-xs text-amber-600/80 uppercase tracking-wide mt-1">Good</div>
                </div>
              </div>
            </Card>
            
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">Resume Rankings</h2>
                
                {selectedJobAnalysis.erroredFiles.length > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                    {selectedJobAnalysis.erroredFiles.length} Failed
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                {selectedJobAnalysis.resumeScores
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .map((score, index) => (
                    <motion.div 
                      key={score.resumeId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {index + 1}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <h4 className="font-semibold text-slate-800 text-lg">{score.resumeName}</h4>
                          <div className="flex items-center text-sm text-slate-500">
                            <FileText className="h-4 w-4 mr-1.5" />
                            <span>{score.fileName}</span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "text-2xl font-bold rounded-full px-4 py-1",
                            score.overallScore >= 80 ? "text-emerald-600" : 
                            score.overallScore >= 60 ? "text-amber-600" : "text-slate-600"
                          )}>
                            {score.overallScore}%
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => navigate(`/interview-setup?resumeId=${score.resumeId}`)}
                          >
                            Send Interview Link
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 mt-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-500 font-medium">Keywords Match</span>
                            <span className="font-semibold">{score.keywordMatch}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                              style={{ width: `${score.keywordMatch}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${score.keywordMatch}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-slate-500 font-medium">Skills Match</span>
                            <span className="font-semibold">{score.skillsMatch}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                              style={{ width: `${score.skillsMatch}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${score.skillsMatch}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full py-8 px-4 md:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-800 relative inline-block">
            Results
            <motion.span 
              className="absolute bottom-0 left-0 h-1 bg-blue-500/60 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            />
          </h2>
        </motion.div>
        
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Display cards for all job analyses in the history */}
          {jobAnalyses.map((jobAnalysis) => (
            <motion.div
              key={jobAnalysis.jobId}
              variants={cardVariants}
              whileHover="hover"
              layout
            >
              <Card className="backdrop-blur-sm bg-white/90 overflow-hidden border border-slate-200/50 shadow hover:shadow-md transition-shadow duration-300">
                <div className="p-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{jobAnalysis.jobTitle}</h3>
                        {jobAnalysis.jobCompany && (
                          <span className="text-sm text-slate-500">{jobAnalysis.jobCompany}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2 md:mt-0">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{formatDate(jobAnalysis.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-700">{jobAnalysis.resumeCount}</div>
                      <div className="text-xs text-blue-600/80 uppercase tracking-wide">Resumes</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-emerald-700">
                        {jobAnalysis.resumeScores.filter(score => score.overallScore >= 80).length}
                      </div>
                      <div className="text-xs text-emerald-600/80 uppercase tracking-wide">Excellent</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-amber-700">
                        {jobAnalysis.resumeScores.filter(score => score.overallScore >= 60 && score.overallScore < 80).length}
                      </div>
                      <div className="text-xs text-amber-600/80 uppercase tracking-wide">Good</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "bg-gradient-to-r px-3 border-none shadow-sm text-white",
                          jobAnalysis.resumeScores.length > 0 && jobAnalysis.resumeScores[0].overallScore >= 80 
                            ? "from-emerald-500 to-emerald-600" 
                            : jobAnalysis.resumeScores.length > 0 && jobAnalysis.resumeScores[0].overallScore >= 60 
                              ? "from-amber-500 to-amber-600" 
                              : "from-slate-400 to-slate-500"
                        )}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {jobAnalysis.resumeScores.length > 0 
                          ? `Top Score: ${Math.max(...jobAnalysis.resumeScores.map(s => s.overallScore))}%` 
                          : "No scores"}
                      </Badge>
                      
                      {jobAnalysis.erroredFiles.length > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {jobAnalysis.erroredFiles.length} Failed
                        </Badge>
                      )}
                    </div>
                    
                    <motion.button
                      className="flex items-center gap-1 text-sm text-blue-600 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                      onClick={() => setFullDetailJobId(jobAnalysis.jobId)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          
          {/* Current analysis card (if not already in history) */}
          {resumeScores.length > 0 && !jobAnalyses.some(job => 
            job.jobTitle === jobTitle && job.jobCompany === jobCompany && 
            job.resumeScores.length === resumeScores.length
          ) && (
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              layout
            >
              <Card className="backdrop-blur-sm bg-white/90 overflow-hidden border border-slate-200/50 shadow hover:shadow-md transition-shadow duration-300">
                <div className="p-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 p-2 rounded-full">
                        <Check className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Current Analysis: {jobTitle}</h3>
                        {jobCompany && (
                          <span className="text-sm text-slate-500">{jobCompany}</span>
                        )}
                      </div>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 ml-0 md:ml-4 mt-2 md:mt-0 border-slate-200 hover:border-slate-300 shadow-sm"
                        onClick={() => setShowDetailed(!showDetailed)}
                      >
                        {showDetailed ? (
                          <>
                            <BarChart3 className="h-4 w-4 text-slate-500" />
                            <span>Summary</span>
                          </>
                        ) : (
                          <>
                            <List className="h-4 w-4 text-slate-500" />
                            <span>Detailed</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-700">{resumeCount}</div>
                      <div className="text-xs text-blue-600/80 uppercase tracking-wide">Resumes</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-emerald-700">
                        {resumeScores.filter(score => score.overallScore >= 80).length}
                      </div>
                      <div className="text-xs text-emerald-600/80 uppercase tracking-wide">Excellent</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-amber-700">
                        {resumeScores.filter(score => score.overallScore >= 60 && score.overallScore < 80).length}
                      </div>
                      <div className="text-xs text-amber-600/80 uppercase tracking-wide">Good</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "bg-gradient-to-r px-3 border-none shadow-sm text-white",
                        resumeScores.length > 0 && resumeScores[0].overallScore >= 80 
                          ? "from-emerald-500 to-emerald-600" 
                          : resumeScores.length > 0 && resumeScores[0].overallScore >= 60 
                            ? "from-amber-500 to-amber-600" 
                            : "from-slate-400 to-slate-500"
                      )}
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {resumeScores.length > 0 
                        ? `Top Score: ${Math.max(...resumeScores.map(s => s.overallScore))}%` 
                        : "No scores"}
                    </Badge>
                    
                    {erroredFiles.length > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 flex items-center ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {erroredFiles.length} Failed
                      </Badge>
                    )}
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {!showDetailed ? (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="max-h-96 overflow-y-auto px-4 pb-4"
                    >
                      <div className="space-y-2 mt-4">
                        {resumeScores
                          .sort((a, b) => b.overallScore - a.overallScore)
                          .slice(0, 3)
                          .map((score, idx) => (
                            <motion.div 
                              key={score.resumeId}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex items-center"
                            >
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
                                {idx + 1}
                              </div>
                              
                              <div className="flex-grow min-w-0">
                                <h4 className="font-medium text-slate-800 truncate">{score.resumeName}</h4>
                                <div className="text-xs text-slate-500 truncate">{score.fileName}</div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                <div className={cn(
                                  "text-lg font-bold",
                                  score.overallScore >= 80 ? "text-emerald-600" : 
                                  score.overallScore >= 60 ? "text-amber-600" : "text-slate-600"
                                )}>
                                  {score.overallScore}%
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0 ml-3">
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1"
                                  onClick={() => navigate(`/interview-setup?resumeId=${score.resumeId}`)}
                                >
                                  Send Interview
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="detailed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="max-h-96 overflow-y-auto px-4 pb-4"
                    >
                      <div className="space-y-2 mt-4">
                        {resumeScores
                          .sort((a, b) => b.overallScore - a.overallScore)
                          .map((score, index) => (
                            <motion.div 
                              key={score.resumeId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden"
                            >
                              <div className="flex items-center gap-3 p-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {index + 1}
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-medium text-slate-800 truncate">{score.resumeName}</h4>
                                  <div className="flex items-center text-xs text-slate-500">
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span className="truncate">{score.fileName}</span>
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0 flex items-center">
                                  <div className={cn(
                                    "text-lg font-bold",
                                    score.overallScore >= 80 ? "text-emerald-600" : 
                                    score.overallScore >= 60 ? "text-amber-600" : "text-slate-600"
                                  )}>
                                    {score.overallScore}%
                                  </div>
                                  
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white ml-3"
                                    onClick={() => navigate(`/interview-setup?resumeId=${score.resumeId}`)}
                                  >
                                    Send Interview
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                <div>
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-slate-500">Keywords</span>
                                    <span className="font-medium">{score.keywordMatch}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                                      style={{ width: `${score.keywordMatch}%` }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${score.keywordMatch}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1 text-xs">
                                    <span className="text-slate-500">Skills</span>
                                    <span className="font-medium">{score.skillsMatch}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500"
                                      style={{ width: `${score.skillsMatch}%` }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${score.skillsMatch}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Results; 