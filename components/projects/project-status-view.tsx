"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Upload as UploadIcon,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Calendar,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ProjectStatusViewProps {
  project: any;
}

export function ProjectStatusView({
  project: initialProject,
}: ProjectStatusViewProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [isPolling, setIsPolling] = useState(false);

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

          if (["ready", "failed"].includes(data.project.status)) {
            clearInterval(pollInterval);
            setIsPolling(false);

            if (data.project.status === "ready") {
              toast.success("Your case study is ready!", {
                action: {
                  label: "View",
                  onClick: () =>
                    router.push(`/dashboard/projects/${project.id}/case-study`),
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch project status:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [project.id, project.status, router]);

  const getStatusInfo = () => {
    switch (project.status) {
      case "uploading":
        return {
          icon: <Clock className="w-12 h-12 text-blue-600" />,
          title: "Uploading file",
          description: "Securely uploading your file to cloud storage",
          progress: 25,
          color: "blue",
          badge: "Uploading",
        };
      case "transcribing":
        return {
          icon: <FileText className="w-12 h-12 text-purple-600" />,
          title: "Transcribing audio",
          description: "Converting speech to text with speaker detection",
          progress: 50,
          color: "purple",
          badge: "Transcribing",
        };
      case "analyzing":
        return {
          icon: <Sparkles className="w-12 h-12 text-indigo-600" />,
          title: "Analyzing with AI",
          description: "Extracting insights and generating your case study",
          progress: 75,
          color: "indigo",
          badge: "Analyzing",
        };
      case "ready":
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
          title: "Case study ready",
          description:
            "Your case study has been generated and is ready to review",
          progress: 100,
          color: "green",
          badge: "Ready",
        };
      case "failed":
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-600" />,
          title: "Processing failed",
          description:
            project.errorMessage || "Something went wrong. Please try again.",
          progress: 0,
          color: "red",
          badge: "Failed",
        };
      default:
        return {
          icon: <Clock className="w-12 h-12 text-muted-foreground" />,
          title: "Processing",
          description: "Your file is being processed",
          progress: 0,
          color: "gray",
          badge: "Processing",
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
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRetry = async () => {
    const retryToast = toast.loading("Retrying processing...");

    try {
      const response = await fetch(`/api/projects/${project.id}/retry`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        toast.success("Processing restarted!", { id: retryToast });
      } else {
        throw new Error("Failed to retry");
      }
    } catch (error) {
      toast.error("Failed to retry processing", { id: retryToast });
    }
  };

  return (
    <div className="container max-w-6xl py-8 mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                {project.title}
              </h1>
              <StatusBadge status={project.status} label={statusInfo.badge} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.createdAt)}</span>
              </div>
              {isPolling && (
                <div className="flex items-center gap-1.5 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auto-updating</span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download file
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="rounded-xl border bg-card p-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="shrink-0 p-3 rounded-xl bg-muted">
                {statusInfo.icon}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {statusInfo.title}
                </h2>
                <p className="text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </div>

            {/* Progress Section */}
            {project.status !== "failed" && (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-medium text-foreground">
                      Progress
                    </span>
                    <span className="font-semibold text-foreground">
                      {statusInfo.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-2.5 rounded-full transition-all duration-500",
                        project.status === "uploading" && "bg-blue-600",
                        project.status === "transcribing" && "bg-purple-600",
                        project.status === "analyzing" && "bg-indigo-600",
                        project.status === "ready" && "bg-green-600"
                      )}
                      style={{ width: `${statusInfo.progress}%` }}
                    />
                  </div>
                </div>

                {/* Processing Steps */}
                {project.status !== "ready" && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <ProcessingStep
                      icon={<UploadIcon className="w-5 h-5" />}
                      label="Upload"
                      isActive={project.status === "uploading"}
                      isComplete={[
                        "transcribing",
                        "analyzing",
                        "ready",
                      ].includes(project.status)}
                    />
                    <ProcessingStep
                      icon={<FileText className="w-5 h-5" />}
                      label="Transcribe"
                      isActive={project.status === "transcribing"}
                      isComplete={["analyzing", "ready"].includes(
                        project.status
                      )}
                    />
                    <ProcessingStep
                      icon={<Sparkles className="w-5 h-5" />}
                      label="Analyze"
                      isActive={project.status === "analyzing"}
                      isComplete={project.status === "ready"}
                    />
                    <ProcessingStep
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      label="Complete"
                      isActive={false}
                      isComplete={project.status === "ready"}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              {project.status === "ready" && (
                <>
                  <Button
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${project.id}/case-study`
                      )
                    }
                    size="lg"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review Case Study
                  </Button>
                  {project.transcript && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/dashboard/projects/${project.id}/transcript`
                        )
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Transcript
                    </Button>
                  )}
                </>
              )}

              {project.status === "failed" && (
                <>
                  <Button onClick={handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Processing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/projects/new")}
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    New Upload
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Estimated Time */}
          {(project.status === "transcribing" ||
            project.status === "analyzing") && (
            <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Estimated time remaining: 2-5 minutes
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    You can safely close this page. We'll email you when it's
                    ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Details */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold text-foreground mb-4">File Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">File Name</p>
                <p className="text-sm font-medium text-foreground break-all">
                  {project.fileName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDuration(project.durationSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    File Size
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatFileSize(project.fileSize)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div className="rounded-xl border bg-muted/50 p-6">
            <h3 className="font-semibold text-foreground mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>AI transcription with speaker detection</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Smart analysis of key insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Professional case study generation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Social media post drafts</span>
              </li>
            </ul>
          </div>
        </div>
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
      className={cn(
        "flex items-center gap-2.5 p-3 rounded-lg border transition-all",
        isActive &&
          "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        isComplete &&
          "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
        !isActive && !isComplete && "bg-muted/50 border-transparent"
      )}
    >
      <div
        className={cn(
          "transition-colors",
          isActive && "text-blue-600 dark:text-blue-400",
          isComplete && "text-green-600 dark:text-green-400",
          !isActive && !isComplete && "text-muted-foreground"
        )}
      >
        {isComplete ? <CheckCircle2 className="w-5 h-5" /> : icon}
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          isActive && "text-blue-900 dark:text-blue-100",
          isComplete && "text-green-900 dark:text-green-100",
          !isActive && !isComplete && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const variants = {
    uploading: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    transcribing:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    analyzing:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
    ready: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <Badge
      variant="secondary"
      className={cn("text-xs", variants[status as keyof typeof variants])}
    >
      {label}
    </Badge>
  );
}
