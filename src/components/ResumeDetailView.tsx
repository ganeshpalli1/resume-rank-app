import React, { useState } from "react";
import { ResumeScore } from "@/types/resume";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { generateScoreAnalysis } from "@/services/resumeAnalysis";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResumeDetailViewProps {
  score: ResumeScore;
  onBack: () => void;
}

const ResumeDetailView: React.FC<ResumeDetailViewProps> = ({ score, onBack }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Generate strengths and weaknesses based on scores
  const analysis = generateScoreAnalysis(score);
  
  // Check if this resume had processing errors
  const hasError = score.evaluationDetails.some(detail => detail.startsWith('Error:'));
  const errorDetail = hasError ? score.evaluationDetails.find(detail => detail.startsWith('Error:')) : null;
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };
  
  return (
    <Card className="shadow-lg border-resume-border animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2" 
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rankings
          </Button>
          <CardTitle className="text-2xl text-resume-text">
            {score.resumeName}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {score.fileName}
          </p>
        </div>
        <div className={`score-badge score-badge-${
          score.overallScore >= 80 ? "high" : score.overallScore >= 60 ? "medium" : "low"
        } text-lg px-4 py-2 animate-score-pulse`}>
          {score.overallScore}%
        </div>
      </CardHeader>

      <CardContent>
        {hasError && errorDetail && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>
              {errorDetail.replace('Error: ', '')}
              {errorDetail.includes('startxref') && (
                <div className="mt-2 text-sm">
                  This resume could not be properly analyzed due to PDF corruption. 
                  The analysis results shown below are estimations only. 
                  For better results, try uploading a different file format or regenerating this PDF.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
              
              <div className="space-y-4">
                {score.scoreDetails ? (
                  // Use scoreDetails if available
                  score.scoreDetails.map((detail, index) => (
                    <div key={index} className="space-y-2">
                      <div
                        className="bg-resume-background rounded-lg p-3 cursor-pointer border border-resume-border hover:bg-resume-background/80 transition-colors"
                        onClick={() => toggleCategory(detail.category)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{detail.category}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${
                              detail.score >= 80 ? 'text-green-600' : 
                              detail.score >= 60 ? 'text-amber-600' : 
                              'text-red-600'
                            }`}>
                              {detail.score}%
                            </span>
                            {expandedCategory === detail.category ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        
                        <Progress 
                          value={detail.score} 
                          className="h-2 bg-gray-200 mt-2" 
                          style={{
                            "--progress-width": `${detail.score}%`,
                          } as React.CSSProperties}
                          // @ts-ignore - custom class
                          className="h-2 bg-gray-200 mt-2 animate-progress-fill" 
                        />
                      </div>
                      
                      {expandedCategory === detail.category && (
                        <div className="p-3 bg-white rounded-lg border border-resume-border ml-2 animate-expand">
                          <p className="text-sm mb-3 text-resume-text">
                            {detail.feedback}
                          </p>
                          
                          {detail.matches.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold uppercase text-green-700 mb-1">Matches</h4>
                              <div className="grid grid-cols-2 gap-1">
                                {detail.matches.map((match, midx) => (
                                  <div 
                                    key={midx} 
                                    className="flex items-center text-xs bg-green-50 p-1 px-2 rounded"
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-600 mr-1 shrink-0" />
                                    <span className="truncate">{match}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {detail.misses.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold uppercase text-red-700 mb-1">Missing</h4>
                              <div className="grid grid-cols-2 gap-1">
                                {detail.misses.map((miss, midx) => (
                                  <div 
                                    key={midx} 
                                    className="flex items-center text-xs bg-red-50 p-1 px-2 rounded"
                                  >
                                    <XCircle className="h-3 w-3 text-red-600 mr-1 shrink-0" />
                                    <span className="truncate">{miss}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // Fallback if scoreDetails isn't available
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Keyword Match</span>
                        <span className="text-sm font-bold">{score.keywordMatch}%</span>
                      </div>
                      <Progress value={score.keywordMatch} className="h-2 bg-gray-200" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Skills Match</span>
                        <span className="text-sm font-bold">{score.skillsMatch}%</span>
                      </div>
                      <Progress value={score.skillsMatch} className="h-2 bg-gray-200" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Experience Match</span>
                        <span className="text-sm font-bold">{score.experienceMatch}%</span>
                      </div>
                      <Progress value={score.experienceMatch} className="h-2 bg-gray-200" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Education Match</span>
                        <span className="text-sm font-bold">{score.educationMatch}%</span>
                      </div>
                      <Progress value={score.educationMatch} className="h-2 bg-gray-200" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Evaluation Details</h3>
            <div className="space-y-4">
              {score.evaluationDetails.map((detail, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-resume-background rounded-lg border border-resume-border animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="text-sm">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-resume-border">
          <h3 className="text-lg font-semibold mb-4">Analysis & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-resume-success/10 rounded-lg">
              <h4 className="font-medium mb-2 text-green-700">Strengths</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-resume-danger/10 rounded-lg">
              <h4 className="font-medium mb-2 text-red-700">Weaknesses</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-resume-primary/10 rounded-lg">
              <h4 className="font-medium mb-2 text-resume-primary">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeDetailView;
