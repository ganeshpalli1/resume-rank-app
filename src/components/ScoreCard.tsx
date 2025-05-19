import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResumeScore } from "@/types/resume";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface ScoreCardProps {
  score: ResumeScore;
  rank: number;
  previousRank?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ 
  score, 
  rank, 
  previousRank 
}) => {
  const [showRankChange, setShowRankChange] = useState(false);

  useEffect(() => {
    // Show rank change animation if rank has changed
    if (previousRank !== undefined && rank !== previousRank) {
      setShowRankChange(true);
      const timer = setTimeout(() => {
        setShowRankChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rank, previousRank]);

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return "score-badge-high";
    if (score >= 60) return "score-badge-medium";
    return "score-badge-low";
  };

  const getColorClass = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const rankChange = previousRank !== undefined ? previousRank - rank : 0;
  const hasImproved = rankChange > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className="w-full"
    >
      <Card className="resume-card overflow-hidden border-resume-border hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="bg-resume-background p-4 flex items-center md:w-1/4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-resume-primary/10 text-resume-primary flex items-center justify-center font-bold relative">
                {rank + 1}
                {showRankChange && rankChange !== 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      hasImproved ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {hasImproved ? '↑' : '↓'}
                  </motion.div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-resume-text truncate">{score.resumeName}</h3>
                <p className="text-xs text-muted-foreground truncate">{score.fileName}</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-4 border-t md:border-t-0 md:border-l border-resume-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Keyword Match</span>
                  <span className="text-xs font-medium">{score.keywordMatch}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getColorClass(score.keywordMatch)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score.keywordMatch}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Skills Match</span>
                  <span className="text-xs font-medium">{score.skillsMatch}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getColorClass(score.skillsMatch)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score.skillsMatch}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Experience Match</span>
                  <span className="text-xs font-medium">{score.experienceMatch}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getColorClass(score.experienceMatch)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score.experienceMatch}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Education Match</span>
                  <span className="text-xs font-medium">{score.educationMatch}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${getColorClass(score.educationMatch)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score.educationMatch}%` }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                </div>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-3 pt-2 border-t border-resume-border">
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {score.evaluationDetails[0]}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    {score.evaluationDetails.map((detail, i) => (
                      <p key={i} className="text-sm">{detail}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="p-4 border-t md:border-t-0 md:border-l border-resume-border bg-white md:w-[120px] flex flex-row md:flex-col justify-between md:justify-center items-center">
            <motion.div 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260,
                damping: 20,
                delay: 0.5 
              }}
              className={`score-badge ${getScoreBadgeClass(score.overallScore)} animate-score-pulse`}
            >
              {score.overallScore}%
            </motion.div>
            
            <p className={`text-xs font-medium mt-2 ${
              score.overallScore >= 80 ? 'text-green-600' : 
              score.overallScore >= 60 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {score.overallScore >= 80 ? 'Excellent' : score.overallScore >= 60 ? 'Good' : 'Low'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ScoreCard;
