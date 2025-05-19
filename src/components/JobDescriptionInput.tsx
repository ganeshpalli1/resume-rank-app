import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { JobDescription } from "@/types/resume";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JobDescriptionInputProps {
  onJobDescriptionSave: (jobDescription: JobDescription) => void;
  initialJobDescription?: JobDescription | null;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  onJobDescriptionSave,
  initialJobDescription = null,
}) => {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requiredExperience, setRequiredExperience] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // Pre-populate form when initial data is available
  useEffect(() => {
    if (initialJobDescription) {
      setTitle(initialJobDescription.title || "");
      setCompany(initialJobDescription.company || "");
      setDepartment(initialJobDescription.department || "");
      setDescription(initialJobDescription.description || "");
      setRequiredExperience(initialJobDescription.experienceRequired || "");
      setEmploymentType(initialJobDescription.employmentType || "");
      setLocation(initialJobDescription.location || "");
      setSalaryRange(initialJobDescription.salary || "");
      
      if (initialJobDescription.applicationDeadline) {
        const date = new Date(initialJobDescription.applicationDeadline);
        // Format date as YYYY-MM-DD for input type="date"
        const formattedDate = date.toISOString().split('T')[0];
        setApplicationDeadline(formattedDate);
      } else {
        setApplicationDeadline("");
    }
    }
  }, [initialJobDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create a basic skills and requirements arrays
    const skills: string[] = initialJobDescription?.skills || [];
    const requirements: string[] = initialJobDescription?.requirements || [];
    const responsibilities: string[] = initialJobDescription?.responsibilities || [];

    // Create the job description object
    const jobDescription: JobDescription = {
      id: initialJobDescription?.id || `job-${Date.now()}`,
      title,
      company: company || "Not Specified",
      department: department || undefined,
      description,
      skills,
      requirements,
      responsibilities,
      location: location || undefined,
      salary: salaryRange || undefined,
      experienceRequired: requiredExperience || undefined,
      employmentType: employmentType || undefined,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
    };

    // Pass the job description to the parent component
    onJobDescriptionSave(jobDescription);
  };

  return (
    <Card className="shadow-lg border-resume-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-resume-text">
          Job Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-1 text-resume-text"
            >
                Job Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
                placeholder="e.g. Senior Software Engineer"
              required
            />
            </div>

            <div>
              <label
                htmlFor="department"
                className="block text-sm font-medium mb-1 text-resume-text"
              >
                Department
              </label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium mb-1 text-resume-text"
            >
              Company Name
            </label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
              placeholder="e.g. Acme Corporation"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1 text-resume-text"
            >
              Job Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] border-resume-border focus:border-resume-primary focus:ring-resume-primary"
              placeholder="Enter detailed job description"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="requiredExperience"
                className="block text-sm font-medium mb-1 text-resume-text"
              >
                Required Experience <span className="text-red-500">*</span>
              </label>
              <Input
                id="requiredExperience"
                value={requiredExperience}
                onChange={(e) => setRequiredExperience(e.target.value)}
                className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
                placeholder="e.g. 3+ years"
                required
              />
            </div>

            <div>
              <label
                htmlFor="employmentType"
                className="block text-sm font-medium mb-1 text-resume-text"
              >
                Employment Type <span className="text-red-500">*</span>
              </label>
              <Select value={employmentType} onValueChange={setEmploymentType} required>
                <SelectTrigger className="border-resume-border focus:border-resume-primary focus:ring-resume-primary">
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium mb-1 text-resume-text"
              >
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
                placeholder="e.g. New York, NY"
                required
              />
            </div>

            <div>
              <label
                htmlFor="salaryRange"
                className="block text-sm font-medium mb-1 text-resume-text"
              >
                Salary Range
              </label>
              <Input
                id="salaryRange"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
                placeholder="e.g. $100,000 - $120,000/year"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="applicationDeadline"
              className="block text-sm font-medium mb-1 text-resume-text"
            >
              Application Deadline
            </label>
            <Input
              id="applicationDeadline"
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className="border-resume-border focus:border-resume-primary focus:ring-resume-primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-resume-primary hover:bg-resume-secondary text-white transition-all duration-300 transform hover:scale-105 group flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobDescriptionInput;
