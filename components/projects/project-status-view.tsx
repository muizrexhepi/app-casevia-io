// app/dashboard/projects/[id]/project-status-view.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  Send,
  ArrowLeft,
  RefreshCw,
  Upload as UploadIcon,
} from "lucide-react";
import { Button } from "../ui/button";

interface ProjectStatusViewProps {
  project: any;
}

export function ProjectStatusView({
  project: initialProject,
}: ProjectStatusViewProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for status updates when processing
  useEffect(() => {
    const shouldPoll = ["uploading", "transcribing", "analyzing"].includes(
      project.status
    );

    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);

          // Stop polling if status is final
          if (["ready", "failed"].includes(data.project.status)) {
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project status:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [project.id, project.status]);

  const getStatusInfo = () => {
    switch (project.status) {
      case "uploading":
        return {
          icon: <Clock className="w-8 h-8 text-blue-600 animate-spin" />,
          title: "Uploading file...",
          description: "Securely uploading your file to cloud storage",
          progress: 25,
          color: "blue",
        };
      case "transcribing":
        return {
          icon: <FileText className="w-8 h-8 text-purple-600 animate-pulse" />,
          title: "Transcribing audio...",
          description: "Converting speech to text with speaker detection",
          progress: 50,
          color: "purple",
        };
      case "analyzing":
        return {
          icon: <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />,
          title: "Analyzing with AI...",
          description: "Extracting insights and generating your case study",
          progress: 75,
          color: "indigo",
        };
      case "ready":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          title: "Ready to review!",
          description: "Your case study has been generated",
          progress: 100,
          color: "green",
        };
      case "failed":
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-600" />,
          title: "Processing failed",
          description:
            project.errorMessage || "Something went wrong. Please try again.",
          progress: 0,
          color: "red",
        };
      default:
        return {
          icon: <Clock className="w-8 h-8 text-gray-400" />,
          title: "Processing...",
          description: "Your file is being processed",
          progress: 0,
          color: "gray",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRetry = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/retry`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to retry:", error);
    }
  };

  const handleViewCaseStudy = () => {
    router.push(`/dashboard/projects/${project.id}/case-study`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {project.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Created {formatDate(project.createdAt)}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 mb-6">
          <div className="flex items-start gap-6">
            <div className="shrink-0">{statusInfo.icon}</div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {statusInfo.title}
                </h2>
                {isPolling && (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-6">
                {statusInfo.description}
              </p>

              {/* Progress Bar */}
              {project.status !== "failed" && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {statusInfo.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 bg-linear-to-r ${
                        statusInfo.color === "blue"
                          ? "from-blue-500 to-blue-600"
                          : statusInfo.color === "purple"
                          ? "from-purple-500 to-purple-600"
                          : statusInfo.color === "indigo"
                          ? "from-indigo-500 to-indigo-600"
                          : "from-green-500 to-green-600"
                      }`}
                      style={{ width: `${statusInfo.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Processing Steps */}
              {project.status !== "failed" && project.status !== "ready" && (
                <div className="space-y-3">
                  <ProcessingStep
                    icon={<UploadIcon className="w-5 h-5" />}
                    label="Upload file"
                    isActive={project.status === "uploading"}
                    isComplete={["transcribing", "analyzing", "ready"].includes(
                      project.status
                    )}
                  />
                  <ProcessingStep
                    icon={<FileText className="w-5 h-5" />}
                    label="Transcribe audio"
                    isActive={project.status === "transcribing"}
                    isComplete={["analyzing", "ready"].includes(project.status)}
                  />
                  <ProcessingStep
                    icon={<Sparkles className="w-5 h-5" />}
                    label="AI analysis"
                    isActive={project.status === "analyzing"}
                    isComplete={project.status === "ready"}
                  />
                  <ProcessingStep
                    icon={<Send className="w-5 h-5" />}
                    label="Generate case study"
                    isActive={false}
                    isComplete={project.status === "ready"}
                  />
                </div>
              )}

              {/* Ready State - Show CTA */}
              {project.status === "ready" && (
                <div className="flex gap-3 mt-6">
                  <Button onClick={handleViewCaseStudy} size={"lg"}>
                    Review Case Study
                  </Button>
                  {project.transcript && (
                    <Button
                      size={"lg"}
                      variant={"outline"}
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${project.id}/transcript`
                        )
                      }
                    >
                      View Transcript
                    </Button>
                  )}
                </div>
              )}

              {/* Failed State - Show Retry */}
              {project.status === "failed" && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                  >
                    Retry Processing
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/projects/new")}
                    className="px-6 py-3 border border-slate-300 hover:border-slate-400 text-slate-700 font-medium rounded-lg transition-colors"
                  >
                    Upload New File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File Details */}
        <div className="bg-card rounded-xl shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">File Details</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-freground mb-1">File Name</p>
              <p className="text-sm font-medium text-foreground break-all">
                {project.fileName}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-freground mb-1">Duration</p>
              <p className="text-sm font-medium text-foreground">
                {formatDuration(project.durationSeconds)}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-freground mb-1">File Size</p>
              <p className="text-sm font-medium text-foreground">
                {formatFileSize(project.fileSize)}
              </p>
            </div>
          </div>

          {project.fileUrl && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-freground mb-2">File Location</p>
              <a
                href={project.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 break-all"
              >
                {project.fileUrl}
              </a>
            </div>
          )}
        </div>

        {/* Estimated Time */}
        {(project.status === "transcribing" ||
          project.status === "analyzing") && (
          <div className="p-4 bg-blue-50 border rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Estimated time remaining:</span>{" "}
              2-5 minutes
            </p>
            <p className="text-xs text-blue-700 mt-1">
              You can safely close this page. We'll email you when it's ready.
            </p>
          </div>
        )}

        {/* Transcript Preview (if available) */}
        {project.transcript && project.status === "ready" && (
          <div className="bg-card rounded-xl shadow-sm border p-6 mt-6">
            <h3 className="font-semibold text-foreground mb-4">
              Transcript Preview
            </h3>
            <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-accent-foreground whitespace-pre-wrap line-clamp-6">
                {project.transcript.substring(0, 500)}...
              </p>
            </div>
            <button
              onClick={() =>
                router.push(`/dashboard/projects/${project.id}/transcript`)
              }
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Full Transcript →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessingStep({
  icon,
  label,
  isActive,
  isComplete,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        isActive
          ? "text-blue-600"
          : isComplete
          ? "text-green-600"
          : "text-slate-300"
      }`}
    >
      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
