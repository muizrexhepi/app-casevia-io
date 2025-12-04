"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Film,
  FileAudio,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  X,
  HardDrive,
  Clock,
  Zap,
} from "lucide-react";
import { Plan } from "@/lib/constants/plans";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadFormProps {
  organizationId: string;
  currentPlan: Plan;
  limits: any;
}

export function UploadForm({
  organizationId,
  currentPlan,
  limits,
}: UploadFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validation, setValidation] = useState({ duration: 0, sizeMB: 0 });

  const usagePercentage =
    (limits.caseStudiesUsed / currentPlan.limits.caseStudies) * 100;

  // --- Logic Preserved Exactly As Provided ---

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = async (selectedFile: File) => {
    const sizeMB = Number((selectedFile.size / (1024 * 1024)).toFixed(2));

    let duration = 0;
    try {
      duration = selectedFile.type.startsWith("video/")
        ? await getVideoDuration(selectedFile)
        : await getAudioDuration(selectedFile);
    } catch (err) {
      toast.error("Failed to read file metadata. Please try another file.");
      return false;
    }

    setValidation({ duration, sizeMB });

    if (limits.caseStudiesUsed >= currentPlan.limits.caseStudies) {
      toast.error(
        `You've reached your monthly limit of ${currentPlan.limits.caseStudies} case studies.`,
        {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/settings/billing"),
          },
        }
      );
      return false;
    }

    if (duration > currentPlan.limits.videoLength) {
      toast.error(
        `Video length (${duration} min) exceeds your plan limit of ${currentPlan.limits.videoLength} minutes.`,
        {
          action: {
            label: "Upgrade",
            onClick: () => router.push("/settings/billing"),
          },
        }
      );
      return false;
    }

    const newStorageUsed = limits.storageUsedMb + sizeMB;
    if (newStorageUsed > currentPlan.limits.storage) {
      toast.error(
        `This upload would exceed your storage limit of ${currentPlan.limits.storage} MB.`,
        {
          description: `Current usage: ${limits.storageUsedMb} MB`,
          action: {
            label: "Upgrade",
            onClick: () => router.push("/settings/billing"),
          },
        }
      );
      return false;
    }

    return true;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const minutes = Math.ceil(video.duration / 60);
        resolve(minutes);
      };
      video.onerror = () => reject(new Error("Failed to load video"));
      video.src = URL.createObjectURL(file);
    });
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        const minutes = Math.ceil(audio.duration / 60);
        resolve(minutes);
      };
      audio.onerror = () => reject(new Error("Failed to load audio"));
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      const validTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
      ];

      if (!validTypes.includes(droppedFile.type)) {
        toast.error(
          "Please upload a valid video (.mp4, .mov, .avi) or audio (.mp3, .wav) file"
        );
        return;
      }

      const isValid = await validateFile(droppedFile);
      if (isValid) {
        setFile(droppedFile);
        toast.success("File validated successfully!");
      }
    },
    [limits, currentPlan]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isValid = await validateFile(selectedFile);
    if (isValid) {
      setFile(selectedFile);
      toast.success("File validated successfully!");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const uploadToast = toast.loading("Uploading file...", {
      description: "This may take a moment",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duration", validation.duration.toString());

      const response = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Upload successful!", {
        id: uploadToast,
        description: "Processing your file...",
      });

      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong", {
        id: uploadToast,
      });
      setUploading(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-0 py-2"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Projects
          </button>

          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              New Case Study
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Upload your customer interview recording to automatically generate
              a detailed case study, transcript, and key insights.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Upload Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div
              className={cn(
                "relative group border rounded-xl bg-card transition-all duration-200 overflow-hidden",
                isDragging
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:border-primary/50 hover:shadow-sm",
                file ? "border-solid" : "border-dashed"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleFileInput}
                accept="video/mp4,video/quicktime,video/x-msvideo,audio/mpeg,audio/wav,audio/mp3"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                disabled={uploading || !!file} // Disable input if file is selected (use remove button instead)
              />

              {!file ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Drag and drop your file here
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                    Supports MP4, MOV, AVI, MP3, WAV up to{" "}
                    {currentPlan.limits.videoLength} minutes.
                  </p>
                  <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                    or click to browse
                  </span>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                        file.type.startsWith("video/")
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      )}
                    >
                      {file.type.startsWith("video/") ? (
                        <Film className="w-6 h-6" />
                      ) : (
                        <FileAudio className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-base font-medium text-foreground truncate pr-4">
                          {file.name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Prevent input click
                            setFile(null);
                          }}
                          disabled={uploading}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-2 z-30 relative"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" />
                          {validation.sizeMB} MB
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />~
                          {validation.duration} mins
                        </span>
                      </div>

                      {uploading ? (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-primary font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading & Processing...
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary animate-progress origin-left"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Ready to upload
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setFile(null)}
                disabled={!file || uploading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-medium text-primary-foreground shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                  !file || uploading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {uploading ? "Processing..." : "Create Case Study"}
              </button>
            </div>
          </div>

          {/* Sidebar - Plan Limits & Info */}
          <div className="space-y-6">
            {/* Plan Usage Widget */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <h3 className="font-medium text-sm text-foreground">
                    Plan Usage
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {currentPlan.name} Plan
                  </p>
                </div>
                <button
                  onClick={() => router.push("/settings/billing")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Upgrade
                </button>
              </div>

              <div className="space-y-4">
                {/* Case Study Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Case Studies</span>
                    <span
                      className={cn(
                        "font-medium",
                        usagePercentage >= 90
                          ? "text-destructive"
                          : "text-foreground"
                      )}
                    >
                      {limits.caseStudiesUsed} /{" "}
                      {currentPlan.limits.caseStudies}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        usagePercentage >= 90
                          ? "bg-destructive"
                          : usagePercentage >= 70
                          ? "bg-amber-500"
                          : "bg-primary"
                      )}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Storage & Video Limits */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Video Limit
                    </p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-muted-foreground" />
                      {currentPlan.limits.videoLength} mins
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Storage
                    </p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
                      {(limits.storageUsedMb / 1024).toFixed(1)} GB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Why use AI Case Studies?
              </h4>
              <div className="bg-muted/30 border border-transparent hover:border-border rounded-lg p-3 transition-colors">
                <div className="flex gap-3">
                  <div className="p-1.5 bg-background rounded-md shadow-sm border shrink-0 h-fit">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Instant Analysis
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Turn raw interviews into structured insights in minutes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 border border-transparent hover:border-border rounded-lg p-3 transition-colors">
                <div className="flex gap-3">
                  <div className="p-1.5 bg-background rounded-md shadow-sm border shrink-0 h-fit">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Sales Ready
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get professional assets ready to share with prospects.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
