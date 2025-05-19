import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ResumeScore } from "@/types/resume";
import ScoreCard from "./ScoreCard";
import ResumeDetailView from "./ResumeDetailView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ChevronRight, Award, Search, Filter, FileText, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ResumeRankingProps {
  scores: ResumeScore[];
  erroredFiles?: string[];
}

const ResumeRanking: React.FC<ResumeRankingProps> = ({ scores, erroredFiles = [] }) => {
  const [sortedScores, setSortedScores] = useState<ResumeScore[]>([]);
  const [previousRanks, setPreviousRanks] = useState<Record<string, number>>({});
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCriteria, setFilterCriteria] = useState<string>("all");
  const [showRankChanges, setShowRankChanges] = useState<Record<string, boolean>>({});
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<string>("overall");

  // Function to truncate filename
  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename;
    
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    
    // Get filename without extension
    const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    
    // Calculate how many characters to keep
    const charsToKeep = maxLength - 3 - extension.length; // 3 for "..."
    
    if (charsToKeep < 5) return filename.substring(0, maxLength) + '...';
    
    // Return truncated name with extension
    return nameWithoutExt.substring(0, charsToKeep) + '...' + extension;
  };

  // Cache error file lookup for better performance
  const erroredFilesLookup = useMemo(() => {
    const lookup: Record<string, boolean> = {};
    erroredFiles.forEach(file => {
      lookup[file] = true;
    });
    return lookup;
  }, [erroredFiles]);

  // Compute score statistics for analytics
  const scoreStatistics = useMemo(() => {
    if (!scores.length) return { avg: 0, max: 0, min: 0, excellent: 0, good: 0, low: 0 };
    
    let total = 0;
    let max = 0;
    let min = 100;
    let excellent = 0;
    let good = 0;
    let low = 0;
    
    scores.forEach(score => {
      total += score.overallScore;
      max = Math.max(max, score.overallScore);
      min = Math.min(min, score.overallScore);
      
      if (score.overallScore >= 80) excellent++;
      else if (score.overallScore >= 60) good++;
      else low++;
    });
    
    return {
      avg: Math.round(total / scores.length),
      max,
      min,
      excellent,
      good,
      low
    };
  }, [scores]);

  // Set up the initial sorting (descending by default)
  useEffect(() => {
    if (scores.length) {
      // Store the previous ranks before sorting
      const currentRanks: Record<string, number> = {};
      sortedScores.forEach((score, index) => {
        currentRanks[score.resumeId] = index;
      });
      
      if (Object.keys(currentRanks).length) {
        setPreviousRanks(currentRanks);
        
        // Set up which scores should show rank changes
        const shouldShowChanges: Record<string, boolean> = {};
        sortedScores.forEach((score) => {
          if (currentRanks[score.resumeId] !== undefined && 
              currentRanks[score.resumeId] !== previousRanks[score.resumeId]) {
            shouldShowChanges[score.resumeId] = true;
          }
        });
        setShowRankChanges(shouldShowChanges);
        
        // Hide rank changes after 3 seconds
        setTimeout(() => {
          setShowRankChanges({});
        }, 3000);
      }

      // Filter scores based on search term and criteria
      let filtered = [...scores];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(score => 
          score.resumeName.toLowerCase().includes(searchLower) ||
          score.fileName.toLowerCase().includes(searchLower)
        );
        setIsFilterActive(true);
      } else if (filterCriteria !== "all") {
        setIsFilterActive(true);
      } else {
        setIsFilterActive(false);
      }
      
      if (filterCriteria !== "all") {
        if (filterCriteria === "excellent") {
          filtered = filtered.filter(score => score.overallScore >= 80);
        } else if (filterCriteria === "good") {
          filtered = filtered.filter(score => score.overallScore >= 60 && score.overallScore < 80);
        } else if (filterCriteria === "low") {
          filtered = filtered.filter(score => score.overallScore < 60);
        }
      }

      // Sort the filtered scores based on the selected criteria
      const sorted = filtered.sort((a, b) => {
        let valueA, valueB;
        
        switch (sortCriteria) {
          case "keyword":
            valueA = a.keywordMatch;
            valueB = b.keywordMatch;
            break;
          case "skills":
            valueA = a.skillsMatch;
            valueB = b.skillsMatch;
            break;
          case "experience":
            valueA = a.experienceMatch;
            valueB = b.experienceMatch;
            break;
          case "education":
            valueA = a.educationMatch;
            valueB = b.educationMatch;
            break;
          case "overall":
          default:
            valueA = a.overallScore;
            valueB = b.overallScore;
        }
        
        return sortAscending ? valueA - valueB : valueB - valueA;
      });
      
      setSortedScores(sorted);
    }
  }, [scores, sortAscending, searchTerm, filterCriteria, sortCriteria]);

  const toggleSortOrder = useCallback(() => {
    // Store current ranks before changing sort order
    const currentRanks: Record<string, number> = {};
    sortedScores.forEach((score, index) => {
      currentRanks[score.resumeId] = index;
    });
    
    setPreviousRanks(currentRanks);
    setSortAscending(prev => !prev);
  }, [sortedScores]);

  const handleCardClick = useCallback((resumeId: string) => {
    setSelectedResumeId(resumeId);
  }, []);

  const handleBackClick = useCallback(() => {
    setSelectedResumeId(null);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    setFilterCriteria(value || "all");
  }, []);
  
  const handleSortCriteriaChange = useCallback((value: string) => {
    setSortCriteria(value || "overall");
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterCriteria("all");
    setSortCriteria("overall");
    setIsFilterActive(false);
  }, []);

  if (scores.length === 0) return null;
  
  // Show detailed view if a resume is selected
  if (selectedResumeId) {
    const selectedResume = sortedScores.find(score => score.resumeId === selectedResumeId);
    if (selectedResume) {
      return <ResumeDetailView score={selectedResume} onBack={handleBackClick} />;
    }
  }

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card className="shadow-lg border-resume-border">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-1"
          >
            <CardTitle className="text-xl text-resume-text">
              Resume Rankings
            </CardTitle>
            {scores.length > 0 && (
              <div className="flex space-x-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-slate-100">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {scores.length} Resume{scores.length !== 1 ? 's' : ''}
                      </TooltipTrigger>
                      <TooltipContent>
                        Total resumes processed
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Badge>
                
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {scoreStatistics.excellent} Excellent
                      </TooltipTrigger>
                      <TooltipContent>
                        Resumes with 80% or higher match
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Badge>
                
                {erroredFiles.length > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {erroredFiles.length} Failed
                        </TooltipTrigger>
                        <TooltipContent>
                          {erroredFiles.length} resume{erroredFiles.length !== 1 ? 's' : ''} failed to process
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                )}
              </div>
            )}
          </motion.div>
          
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resumes..."
                className="search-input md:w-[220px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <span className="sr-only">Clear search</span>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ToggleGroup 
                type="single" 
                value={filterCriteria}
                onValueChange={handleFilterChange}
                className="filter-group"
              >
                <ToggleGroupItem value="all" aria-label="All resumes" className="filter-item">
                  All
                </ToggleGroupItem>
                <ToggleGroupItem value="excellent" aria-label="Excellent matches" className="filter-item">
                  Excellent
                </ToggleGroupItem>
                <ToggleGroupItem value="good" aria-label="Good matches" className="filter-item">
                  Good
                </ToggleGroupItem>
                <ToggleGroupItem value="low" aria-label="Low matches" className="filter-item">
                  Low
                </ToggleGroupItem>
              </ToggleGroup>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <ToggleGroup 
                type="single" 
                value={sortCriteria}
                onValueChange={handleSortCriteriaChange}
                className="filter-group"
              >
                <ToggleGroupItem value="overall" aria-label="Sort by overall score" className="filter-item">
                  Overall
                </ToggleGroupItem>
                <ToggleGroupItem value="keyword" aria-label="Sort by keyword match" className="filter-item">
                  Keyword
                </ToggleGroupItem>
                <ToggleGroupItem value="skills" aria-label="Sort by skills match" className="filter-item">
                  Skills
                </ToggleGroupItem>
              </ToggleGroup>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="border-resume-border text-resume-text hover:bg-resume-background"
              >
                {sortAscending ? (
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-4 w-4" /> Lowest First
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-4 w-4" /> Highest First
                  </div>
                )}
              </Button>
            </motion.div>

            {isFilterActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale:.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Filter className="h-4 w-4 mr-1" /> Clear filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {sortedScores.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center"
            >
              <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No resumes match your search criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters or search term</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {sortedScores.map((score, index) => (
                <motion.div
                  key={score.resumeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                  onClick={() => handleCardClick(score.resumeId)}
                  className="cursor-pointer"
                >
                  <Card className="overflow-hidden border-resume-border hover:shadow-md transition-shadow">
                    <div className="h-card">
                      {/* Left section with rank and name */}
                      <div className="h-card-rank">
                        <div className="flex items-center gap-3">
                          <div className="rank-badge">
                            {index + 1}
                            {showRankChanges[score.resumeId] && previousRanks[score.resumeId] !== undefined && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className={`rank-change ${
                                  previousRanks[score.resumeId] > index ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}
                              >
                                {previousRanks[score.resumeId] > index ? '↑' : '↓'}
                              </motion.div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h3 className="font-medium text-resume-text truncate">
                                {score.resumeName}
                              </h3>
                              {erroredFilesLookup[score.fileName] && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-3 w-3 ml-1 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      This resume had parsing issues. Results may be incomplete.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {truncateFilename(score.fileName, 30)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Middle section with score bars */}
                      <div className="h-card-content">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Keyword Match</span>
                              <span className="text-xs font-medium">{score.keywordMatch}%</span>
                            </div>
                            <div className="progress-container">
                              <div 
                                className={`h-full ${score.keywordMatch >= 80 ? 'bg-green-500' : score.keywordMatch >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${score.keywordMatch}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Skills Match</span>
                              <span className="text-xs font-medium">{score.skillsMatch}%</span>
                            </div>
                            <div className="progress-container">
                              <div 
                                className={`h-full ${score.skillsMatch >= 80 ? 'bg-green-500' : score.skillsMatch >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${score.skillsMatch}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Experience Match</span>
                              <span className="text-xs font-medium">{score.experienceMatch}%</span>
                            </div>
                            <div className="progress-container">
                              <div 
                                className={`h-full ${score.experienceMatch >= 80 ? 'bg-green-500' : score.experienceMatch >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${score.experienceMatch}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Education Match</span>
                              <span className="text-xs font-medium">{score.educationMatch}%</span>
                            </div>
                            <div className="progress-container">
                              <div 
                                className={`h-full ${score.educationMatch >= 80 ? 'bg-green-500' : score.educationMatch >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${score.educationMatch}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right section with overall score and evaluation */}
                      <div className="h-card-score">
                        <div className="flex items-center md:flex-col md:mb-3">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 260,
                              damping: 20,
                              delay: 0.5 
                            }}
                            className={`font-bold text-2xl relative ${score.overallScore >= 80 ? 'text-green-600' : score.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {score.overallScore}%
                            <div className="absolute inset-0 shimmer-effect pointer-events-none"></div>
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className={`ml-2 md:ml-0 md:mt-1 text-xs px-2 py-1 rounded-full ${getScoreBadgeClass(score.overallScore)}`}
                          >
                            {score.overallScore >= 80 ? 'Excellent' : score.overallScore >= 60 ? 'Good' : 'Low'} Match
                          </motion.div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="group text-resume-primary hover:text-resume-primary hover:bg-resume-primary/10"
                        >
                          <span className="sr-only md:not-sr-only md:mr-1">View</span>
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ResumeRanking;
