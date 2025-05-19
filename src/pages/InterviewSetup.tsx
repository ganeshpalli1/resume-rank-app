import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, Clock, Users, CheckCircle, AlertCircle, MapPin, Video, Phone, Link2, Mail, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/resumeStore";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

// Interview type label mapping
const interviewTypeLabels = {
  video: "Video Interview",
  phone: "Phone Interview",
  "in-person": "In-Person Interview",
  technical: "Technical Interview",
};

const InterviewSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentJobTitle, currentJobCompany } = useResumeStore();
  const [showSummary, setShowSummary] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    interviewDate: null as Date | null,
    interviewType: "video",
    interviewDuration: "30",
    interviewLocation: "",
    interviewLink: "",
    additionalNotes: "",
    interviewerName: "",
    interviewerRole: "",
    interviewerEmail: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInterviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setInterviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setInterviewForm((prev) => ({
      ...prev,
      interviewDate: date,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!interviewForm.interviewDate) {
      toast({
        title: "Missing information",
        description: "Please select an interview date.",
        variant: "destructive",
      });
      return;
    }

    // Save interview details if needed (could be added to the store)
    
    // Show the summary card
    setShowSummary(true);
    
    // Show success message
    toast({
      title: "Interview setup complete",
      description: "Your interview has been scheduled successfully.",
      variant: "default",
    });
  };

  const getInterviewLocationOrLink = () => {
    if (interviewForm.interviewType === "in-person") {
      return interviewForm.interviewLocation;
    } else {
      return interviewForm.interviewLink;
    }
  };

  const getInterviewTypeIcon = () => {
    switch (interviewForm.interviewType) {
      case "video":
        return <Video className="h-5 w-5 text-blue-500" />;
      case "phone":
        return <Phone className="h-5 w-5 text-green-500" />;
      case "in-person":
        return <MapPin className="h-5 w-5 text-amber-500" />;
      case "technical":
        return <FileText className="h-5 w-5 text-purple-500" />;
      default:
        return <Video className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-resume-background/40 to-resume-background/60 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-resume-text mb-8">Interview Setup</h2>
          
          <div className="mb-8">
            <h3 className="text-xl text-resume-text flex items-center mb-4">
              <Users className="mr-2 h-5 w-5 text-resume-primary" />
              Interview Details for {currentJobTitle} {currentJobCompany && `at ${currentJobCompany}`}
            </h3>
          </div>
          
          <AnimatePresence>
            {showSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
              >
                <Card className="bg-white shadow-lg border-resume-primary/20 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-resume-primary/10 to-resume-secondary/10 border-b border-resume-primary/20 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-resume-text flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Interview Scheduled
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 rounded-full" 
                      onClick={() => navigate("/results")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium text-resume-text">Interview Information</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-resume-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Date & Time</div>
                              <div className="text-gray-600">
                                {interviewForm.interviewDate 
                                  ? format(interviewForm.interviewDate, "MMMM d, yyyy 'at' h:mm a") 
                                  : "Not specified"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            {getInterviewTypeIcon()}
                            <div>
                              <div className="font-medium">Interview Type</div>
                              <div className="text-gray-600">
                                {interviewTypeLabels[interviewForm.interviewType as keyof typeof interviewTypeLabels]}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-resume-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Duration</div>
                              <div className="text-gray-600">{interviewForm.interviewDuration} minutes</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            {interviewForm.interviewType === "in-person" 
                              ? <MapPin className="h-5 w-5 text-resume-primary mt-0.5" />
                              : <Link2 className="h-5 w-5 text-resume-primary mt-0.5" />
                            }
                            <div>
                              <div className="font-medium">
                                {interviewForm.interviewType === "in-person" ? "Location" : "Meeting Link"}
                              </div>
                              <div className="text-gray-600">
                                {getInterviewLocationOrLink() || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium text-resume-text">Interviewer Details</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-resume-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Name</div>
                              <div className="text-gray-600">
                                {interviewForm.interviewerName || "Not specified"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-resume-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Role</div>
                              <div className="text-gray-600">
                                {interviewForm.interviewerRole || "Not specified"}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-resume-primary mt-0.5" />
                            <div>
                              <div className="font-medium">Email</div>
                              <div className="text-gray-600">
                                {interviewForm.interviewerEmail || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {interviewForm.additionalNotes && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="font-medium text-resume-text mb-2">Additional Notes</h4>
                        <p className="text-gray-600 whitespace-pre-line">{interviewForm.additionalNotes}</p>
                      </div>
                    )}
                    
                    <div className="mt-8 flex justify-end">
                      <Button 
                        onClick={() => navigate("/results")}
                        className="bg-resume-primary hover:bg-resume-secondary text-white"
                      >
                        Continue to Results
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-10"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                  {/* Interview Date & Time */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Label htmlFor="interviewDate" className="text-base font-medium block mb-1">
                        Interview Date & Time <span className="text-red-500">*</span>
                      </Label>
                      <DatePicker
                        id="interviewDate"
                        selected={interviewForm.interviewDate}
                        onSelect={handleDateChange}
                        showTimeSelect
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2">Select the date and time for the interview</p>
                    </div>
                  </div>

                  {/* Interview Type */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Label htmlFor="interviewType" className="text-base font-medium block mb-1">
                        Interview Type
                      </Label>
                      <Select 
                        value={interviewForm.interviewType}
                        onValueChange={(value) => handleSelectChange("interviewType", value)}
                      >
                        <SelectTrigger id="interviewType">
                          <SelectValue placeholder="Select interview type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Interview</SelectItem>
                          <SelectItem value="phone">Phone Interview</SelectItem>
                          <SelectItem value="in-person">In-Person Interview</SelectItem>
                          <SelectItem value="technical">Technical Interview</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interview Duration */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Label htmlFor="interviewDuration" className="text-base font-medium block mb-1">
                        Duration (minutes)
                      </Label>
                      <Select 
                        value={interviewForm.interviewDuration}
                        onValueChange={(value) => handleSelectChange("interviewDuration", value)}
                      >
                        <SelectTrigger id="interviewDuration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interview Location or Link */}
                  {interviewForm.interviewType === "in-person" ? (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="space-y-4">
                        <Label htmlFor="interviewLocation" className="text-base font-medium block mb-1">
                          Interview Location
                        </Label>
                        <Input
                          id="interviewLocation"
                          name="interviewLocation"
                          value={interviewForm.interviewLocation}
                          onChange={handleInputChange}
                          placeholder="Enter physical address"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <div className="space-y-4">
                        <Label htmlFor="interviewLink" className="text-base font-medium block mb-1">
                          Interview Link
                        </Label>
                        <Input
                          id="interviewLink"
                          name="interviewLink"
                          value={interviewForm.interviewLink}
                          onChange={handleInputChange}
                          placeholder="Enter meeting link (Zoom, Teams, etc.)"
                        />
                      </div>
                    </div>
                  )}

                  {/* Interviewer Name */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Label htmlFor="interviewerName" className="text-base font-medium block mb-1">
                        Interviewer Name
                      </Label>
                      <Input
                        id="interviewerName"
                        name="interviewerName"
                        value={interviewForm.interviewerName}
                        onChange={handleInputChange}
                        placeholder="Enter interviewer's name"
                      />
                    </div>
                  </div>

                  {/* Interviewer Role */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Label htmlFor="interviewerRole" className="text-base font-medium block mb-1">
                        Interviewer Role
                      </Label>
                      <Input
                        id="interviewerRole"
                        name="interviewerRole"
                        value={interviewForm.interviewerRole}
                        onChange={handleInputChange}
                        placeholder="Enter interviewer's role"
                      />
                    </div>
                  </div>

                  {/* Interviewer Email */}
                  <div className="bg-white rounded-lg p-6 shadow-sm md:col-span-2 lg:col-span-3">
                    <div className="space-y-4">
                      <Label htmlFor="interviewerEmail" className="text-base font-medium block mb-1">
                        Interviewer Email
                      </Label>
                      <Input
                        id="interviewerEmail"
                        name="interviewerEmail"
                        type="email"
                        value={interviewForm.interviewerEmail}
                        onChange={handleInputChange}
                        placeholder="Enter interviewer's email"
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="bg-white rounded-lg p-6 shadow-sm md:col-span-2 lg:col-span-3">
                    <div className="space-y-4">
                      <Label htmlFor="additionalNotes" className="text-base font-medium block mb-1">
                        Additional Notes
                      </Label>
                      <Textarea
                        id="additionalNotes"
                        name="additionalNotes"
                        value={interviewForm.additionalNotes}
                        onChange={handleInputChange}
                        placeholder="Enter any additional notes or instructions for the candidate"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 mt-10 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/resumes")}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Back to Resume Upload
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/results")}
                      className="flex items-center gap-2"
                    >
                      Skip
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-resume-primary hover:bg-resume-secondary text-white flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Complete Setup
                    </Button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default InterviewSetup; 