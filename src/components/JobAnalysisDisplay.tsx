import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnalyzedSection } from "@/services/jobDescriptionService";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobAnalysisDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  sections: AnalyzedSection[];
  jobTitle: string;
}

const JobAnalysisDisplay: React.FC<JobAnalysisDisplayProps> = ({
  isOpen,
  onClose,
  sections,
  jobTitle
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-resume-text">
            Job Analysis: {jobTitle}
          </DialogTitle>
          <DialogDescription>
            Detailed analysis of the job description powered by AI
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 mt-4">
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-resume-text mb-3 bg-gradient-to-r from-resume-primary to-resume-secondary bg-clip-text text-transparent">
                  {section.section_name}
                </h3>
                <ul className="space-y-2 pl-2">
                  {section.requirements.map((requirement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="text-resume-primary mt-1">•</span>
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            
            {sections.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No analysis data available
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobAnalysisDisplay; 