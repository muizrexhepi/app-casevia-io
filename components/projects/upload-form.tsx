// app/dashboard/projects/new/upload-form.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  AlertCircle,
  Film,
  FileAudio,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Plan } from "@/lib/constants/plans";

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
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState({ duration: 0, sizeMB: 0 });

  const usagePercentage =
    (limits.caseStudiesUsed / currentPlan.limits.caseStudies) * 100;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = async (selectedFile: File) => {
    // Get file size in MB
    const sizeMB = Number((selectedFile.size / (1024 * 1024)).toFixed(2));

    // Get duration
    let duration = 0;
    try {
      duration = selectedFile.type.startsWith("video/")
        ? await getVideoDuration(selectedFile)
        : await getAudioDuration(selectedFile);
    } catch (err) {
      setError("Failed to read file metadata. Please try another file.");
      return false;
    }

    setValidation({ duration, sizeMB });

    // Check limits
    if (limits.caseStudiesUsed >= currentPlan.limits.caseStudies) {
      setError(
        `You've reached your monthly limit of ${currentPlan.limits.caseStudies} case studies. Upgrade to continue.`
      );
      return false;
    }

    if (duration > currentPlan.limits.videoLength) {
      setError(
        `Video length (${duration} min) exceeds your plan limit of ${currentPlan.limits.videoLength} minutes. Upgrade to Pro for longer videos.`
      );
      return false;
    }

    const newStorageUsed = limits.storageUsedMb + sizeMB;
    if (newStorageUsed > currentPlan.limits.storage) {
      setError(
        `This upload would exceed your storage limit of ${currentPlan.limits.storage} MB. Current usage: ${limits.storageUsedMb} MB. Upgrade for more storage.`
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
      setError(null);

      const droppedFile = e.dataTransfer.files[0];
      if (!droppedFile) return;

      // Validate file type
      const validTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
      ];

      if (!validTypes.includes(droppedFile.type)) {
        setError(
          "Please upload a valid video (.mp4, .mov, .avi) or audio (.mp3, .wav) file"
        );
        return;
      }

      const isValid = await validateFile(droppedFile);
      if (isValid) {
        setFile(droppedFile);
      }
    },
    [limits, currentPlan]
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isValid = await validateFile(selectedFile);
    if (isValid) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

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

      // Redirect to project detail page
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create New Case Study
          </h1>
          <p className="text-muted-foreground">
            Upload your customer interview audio or video to generate a
            professional case study
          </p>
        </div>

        {/* Plan Limits Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Current Plan: {currentPlan.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Usage this month
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/settings/billing")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade Plan
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Case Studies</span>
                <span className="font-medium text-foreground">
                  {limits.caseStudiesUsed} / {currentPlan.limits.caseStudies}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePercentage >= 90
                      ? "bg-red-600"
                      : usagePercentage >= 70
                      ? "bg-yellow-600"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">
                  Max Video Length
                </p>
                <p className="text-sm font-medium text-foreground">
                  {currentPlan.limits.videoLength} minutes
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Storage Available
                </p>
                <p className="text-sm font-medium text-foreground">
                  {limits.storageUsedMb} / {currentPlan.limits.storage} MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-accent"
                : "border-border bg-muted hover text-muted-foreground"
            }`}
          >
            <input
              type="file"
              onChange={handleFileInput}
              accept="video/mp4,video/quicktime,video/x-msvideo,audio/mpeg,audio/wav,audio/mp3"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            {!file ? (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drop your file here or click to browse
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports MP4, MOV, AVI, MP3, WAV
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {currentPlan.limits.videoLength} minutes •{" "}
                  {/* {currentPlan.limits.storage} MB limit */}
                  50 MB limit
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                  {file.type.startsWith("video/") ? (
                    <Film className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileAudio className="w-5 h-5 text-blue-600" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {validation.sizeMB} MB • ~{validation.duration} minutes
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-2" />
                </div>

                <button
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="text-sm text-muted-foreground hover:text-foreground underline disabled:opacity-50"
                >
                  Choose different file
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {file && !error && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🎙️</span>
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              AI Transcription
            </h4>
            <p className="text-xs text-muted-foreground">
              Automatic speech-to-text with speaker detection
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">✨</span>
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              Smart Analysis
            </h4>
            <p className="text-xs text-muted-foreground">
              Extract key insights and powerful quotes
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📄</span>
            </div>
            <h4 className="font-semibold text-foreground mb-1">
              Ready to Share
            </h4>
            <p className="text-xs text-muted-foreground">
              Publish online or export as PDF/Markdown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
