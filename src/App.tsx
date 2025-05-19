import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import NewJobPost from "./pages/NewJobPost";
import JobPosts from "./pages/JobPosts";
import Results from "./pages/Results";
import ResumeParsing from "./pages/ResumeParsing";
import InterviewSetup from "./pages/InterviewSetup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/resumes" element={<NewJobPost />} />
            <Route path="/analytics" element={<JobPosts />} />
            <Route path="/results" element={<Results />} />
            <Route path="/interview-setup" element={<InterviewSetup />} />
            <Route path="/job-details/:jobId" element={<NewJobPost />} />
            <Route path="/job-posts" element={<JobPosts />} />
            <Route path="/job-post/new" element={<NewJobPost />} />
            <Route path="/resume-parsing" element={<ResumeParsing />} />
            <Route path="/legacy" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
