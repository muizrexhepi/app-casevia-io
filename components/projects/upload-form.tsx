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
  ArrowLeft,
} from "lucide-react";
import { Plan } from "@/lib/constants/plans";
import { toast } from "sonner";

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Case Study
          </h1>
          <p className="text-gray-600">
            Upload your customer interview to generate a professional case study
          </p>
        </div>

        {/* Plan Limits Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Current Plan: {currentPlan.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Usage this month</p>
            </div>
            <button
              onClick={() => router.push("/settings/billing")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Upgrade Plan
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Case Studies</span>
                <span className="font-medium text-gray-900">
                  {limits.caseStudiesUsed} / {currentPlan.limits.caseStudies}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
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

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Max Video Length</p>
                <p className="text-sm font-medium text-gray-900">
                  {currentPlan.limits.videoLength} minutes
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Storage Available</p>
                <p className="text-sm font-medium text-gray-900">
                  {limits.storageUsedMb} / {currentPlan.limits.storage} MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
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
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your file here or click to browse
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Supports MP4, MOV, AVI, MP3, WAV
                </p>
                <p className="text-xs text-gray-500">
                  Max {currentPlan.limits.videoLength} minutes
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3">
                  {file.type.startsWith("video/") ? (
                    <Film className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileAudio className="w-5 h-5 text-blue-600" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {validation.sizeMB} MB • ~{validation.duration} minutes
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600 ml-2" />
                </div>

                <button
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
                >
                  Choose different file
                </button>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                }}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">🎙️</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              AI Transcription
            </h4>
            <p className="text-xs text-gray-600">
              Automatic speech-to-text with speaker detection
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">✨</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Smart Analysis</h4>
            <p className="text-xs text-gray-600">
              Extract key insights and powerful quotes
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📄</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Ready to Share</h4>
            <p className="text-xs text-gray-600">
              Publish online or export as PDF/Markdown
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
