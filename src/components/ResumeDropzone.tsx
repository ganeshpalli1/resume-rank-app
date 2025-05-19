import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader, Upload, X, FolderOpen, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Resume } from "@/types/resume";
import { parseResumeFile } from "@/services/resumeAnalysis";
import { useNavigate } from "react-router-dom";

interface ResumeDropzoneProps {
  onResumeUpload: (resumes: Resume[]) => void;
}

const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onResumeUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [processingFile, setProcessingFile] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "application/pdf" || 
                  file.type === "application/msword" || 
                  file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      if (files.length === 0) {
        toast({
          title: "Invalid file format",
          description: "Please upload PDF or Word documents only.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFiles((prev) => [...prev, ...files]);
    },
    [toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const files = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf" || 
                  file.type === "application/msword" || 
                  file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      if (files.length === 0) {
        toast({
          title: "Invalid file format",
          description: "Please upload PDF or Word documents only.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFiles((prev) => [...prev, ...files]);
    },
    [toast]
  );

  const handleDirectoryInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const files = Array.from(e.target.files).filter(
        (file) => file.type === "application/pdf" || 
                  file.type === "application/msword" || 
                  file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      if (files.length === 0) {
        toast({
          title: "No valid files found",
          description: "No PDF or Word documents were found in the selected folder.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Folder selected",
        description: `${files.length} resume ${files.length === 1 ? 'file' : 'files'} found.`,
      });

      setUploadedFiles((prev) => [...prev, ...files]);
    },
    [toast]
  );

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one resume file to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setIsProcessing(true);
    setProcessedCount(0);
    
    try {
      const processedResumes: Resume[] = [];
      const failedFiles: {name: string, error: string}[] = [];
      
      // Process files one by one
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setProcessingFile(file.name);
        
        // Parse the resume using our API
        try {
          const parsedResume = await parseResumeFile(file);
          
          // Check if there was an error returned from the API
          if (parsedResume.error) {
            const errorMsg = parsedResume.error;
            console.error(`Error processing ${file.name}: ${errorMsg}`);
            
            // Add to failed files list
            failedFiles.push({
              name: file.name,
              error: errorMsg
            });
            
            // Create a fallback resume object
            processedResumes.push({
              id: `resume-${Date.now()}-${i}`,
              name: file.name.split('.')[0],
              fileName: file.name,
              uploadDate: new Date(),
              content: errorMsg.includes("startxref") 
                ? `PDF parsing error: This file appears to be corrupted.` 
                : `Failed to process ${file.name}. ${errorMsg}`,
              file,
              error: errorMsg
            });
            
            // Show error toast for startxref errors specifically
            if (errorMsg.includes("startxref")) {
              toast({
                title: "PDF Parsing Error",
                description: `${file.name} could not be processed due to PDF corruption. The file has incorrect startxref pointers.`,
                variant: "destructive",
              });
            }
          } else {
            // Add file reference for potential later processing
            parsedResume.file = file;
            processedResumes.push(parsedResume);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          failedFiles.push({
            name: file.name,
            error: errorMessage
          });
          
          // Create a fallback resume object if parsing fails
          processedResumes.push({
            id: `resume-${Date.now()}-${i}`,
            name: file.name.split('.')[0],
            fileName: file.name,
            uploadDate: new Date(),
            content: `Failed to process ${file.name}. The file might be corrupted or password protected.`,
            file,
            error: errorMessage
          });
        }
        
        setProcessedCount(i + 1);
      }
      
      // Only proceed if we have at least one successfully processed resume
      if (processedResumes.length > 0) {
        // Send all processed resumes at once
        onResumeUpload(processedResumes);
        
        let toastMessage = `${processedResumes.length - failedFiles.length} of ${processedResumes.length} ${processedResumes.length === 1 ? 'resume' : 'resumes'} processed successfully`;
        if (failedFiles.length > 0) {
          toastMessage += `, ${failedFiles.length} ${failedFiles.length === 1 ? 'file' : 'files'} had issues`;
        }
        
        toast({
          title: failedFiles.length > 0 ? "Partial success" : "Resumes uploaded successfully",
          description: toastMessage,
          variant: failedFiles.length > 0 ? "default" : "default",
        });
        
        // If there are multiple failed files, show a summary
        if (failedFiles.length > 1) {
          toast({
            title: "Multiple files failed",
            description: `${failedFiles.length} files could not be processed properly. Common issues include corrupted PDFs or password protection.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: "None of the selected files could be processed. They might be corrupted or password protected.",
          variant: "destructive",
        });
      }
      
      // Clear the uploaded files
      setUploadedFiles([]);
      setProcessingFile(null);

      // Navigate to the interview-setup page
      navigate("/interview-setup");
    } catch (error) {
      console.error("Error processing resumes:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem processing your resumes.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setProcessedCount(0);
      setProcessingFile(null);
    }
  }, [uploadedFiles, onResumeUpload, toast, navigate]);

  return (
    <Card className="shadow-lg border-resume-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-resume-text">
          Upload Resumes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div
          className={`resume-drop-area ${isDragging ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-resume-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-resume-primary animate-bounce" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop your resume files here, or select files/folder
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="relative border-resume-primary text-resume-primary hover:bg-resume-primary/10"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                Select Files
                <input
                  id="file-input"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.doc,.docx"
                  multiple
                  onChange={handleFileInput}
                />
              </Button>
              
              <Button
                variant="outline"
                className="relative border-resume-primary text-resume-primary hover:bg-resume-primary/10"
                onClick={() => document.getElementById("directory-input")?.click()}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Select Folder
                <input
                  id="directory-input"
                  type="file"
                  className="sr-only"
                  /* @ts-expect-error webkitdirectory is not in TypeScript's HTMLInputElement */
                  webkitdirectory="true"
                  directory=""
                  multiple
                  onChange={handleDirectoryInput}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOC, DOCX
            </p>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 animate-slide-up">
            <h4 className="text-sm font-medium mb-3">Selected Files ({uploadedFiles.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {uploadedFiles.slice(0, 10).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2 bg-resume-background rounded-md border border-resume-border animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-resume-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-resume-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-slate-200"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {uploadedFiles.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{uploadedFiles.length - 10} more files selected
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              {isProcessing ? (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">
                      Processing {processingFile ? `"${processingFile}"` : ''}...
                    </span>
                    <span className="text-sm font-medium">
                      {processedCount}/{uploadedFiles.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-resume-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(processedCount / uploadedFiles.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Extracting and analyzing resume content...
                  </p>
                </div>
              ) : (
                <Button 
                  className="bg-resume-primary hover:bg-resume-secondary text-white"
                  onClick={processFiles}
                  disabled={isUploading}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeDropzone;
