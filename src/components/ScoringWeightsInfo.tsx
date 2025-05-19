import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

const ScoringWeightsInfo = () => {
  const weights = [
    { name: "Skills Match", percentage: 45, color: "bg-blue-500" },
    { name: "Experience Match", percentage: 35, color: "bg-green-500" },
    { name: "Education Match", percentage: 15, color: "bg-purple-500" },
    { name: "Keyword Match", percentage: 5, color: "bg-amber-500" }
  ];

  return (
    <Card className="shadow-sm border-resume-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-resume-text flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Scoring Criteria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Resumes are evaluated using the following weighted criteria:
        </p>
        <div className="space-y-3">
          {weights.map((weight) => (
            <div key={weight.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{weight.name}</span>
                <span className="text-sm text-muted-foreground">{weight.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div 
                  className={`h-full ${weight.color}`} 
                  style={{ width: `${weight.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoringWeightsInfo; 