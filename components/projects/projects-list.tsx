"use client";

import Link from "next/link";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Film,
  FileAudio,
  Loader2,
} from "lucide-react";
import { useSubscription } from "../providers/subscription-provider";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  title: string;
  fileName: string | null;
  status: string;
  createdAt: string | Date;
  durationSeconds: number | null;
  fileSize: number | null;
  errorMessage: string | null;
};

type ProjectPageLimits = {
  caseStudiesUsed: number;
  storageUsedMb: number;
};

interface ProjectsListProps {
  projects: Project[];
  initialLimits: ProjectPageLimits;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDuration = (seconds: number | null) => {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return null;
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return "< 0.1 MB";
  return `${mb.toFixed(1)} MB`;
};

const getFileIcon = (fileName: string | null) => {
  if (!fileName) return <FileText className="w-5 h-5 text-gray-400" />;

  if (fileName.match(/\.(mp4|mov|avi|webm)$/i)) {
    return <Film className="w-5 h-5 text-gray-400" />;
  }

  if (fileName.match(/\.(mp3|wav|m4a|ogg)$/i)) {
    return <FileAudio className="w-5 h-5 text-gray-400" />;
  }

  return <FileText className="w-5 h-5 text-gray-400" />;
};

export function ProjectsList({ projects, initialLimits }: ProjectsListProps) {
  return (
    <>
      <UsageStats initialLimits={initialLimits} />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      )}
    </>
  );
}

function UsageStats({ initialLimits }: { initialLimits: ProjectPageLimits }) {
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const usagePercentage =
    (initialLimits?.caseStudiesUsed / currentPlan.limits.caseStudies) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {currentPlan.name} Plan
          </h3>
          <p className="text-xs text-gray-500 mt-1">Monthly usage</p>
        </div>
        <Link
          href="/settings/billing"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage Plan
        </Link>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Case Studies</span>
          <span className="font-medium text-gray-900">
            {initialLimits?.caseStudiesUsed} / {currentPlan.limits.caseStudies}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              usagePercentage >= 90
                ? "bg-red-600"
                : usagePercentage >= 70
                ? "bg-yellow-600"
                : "bg-blue-600"
            )}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Storage Used</p>
          <p className="text-sm font-medium text-gray-900">
            {initialLimits?.storageUsedMb} / {currentPlan.limits.storage} MB
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Max File Length</p>
          <p className="text-sm font-medium text-gray-900">
            {currentPlan.limits.videoLength} min
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Team Seats</p>
          <p className="text-sm font-medium text-gray-900">
            {currentPlan.limits.teamSeats === -1
              ? "Unlimited"
              : currentPlan.limits.teamSeats}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const duration = formatDuration(project.durationSeconds);
  const fileSize = formatFileSize(project.fileSize);

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className={cn(
        "block bg-white rounded-lg border border-gray-200 p-6",
        "transition-all hover:shadow-md hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 flex items-start gap-3">
          <div className="shrink-0 mt-1">{getFileIcon(project.fileName)}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.title}
            </h3>
            <p className="text-sm text-gray-500">{project.fileName}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-500 pl-[32px]">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(project.createdAt)}
        </div>
        {duration && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {duration}
          </div>
        )}
        {fileSize && <div className="flex items-center gap-1">{fileSize}</div>}
      </div>

      {project.errorMessage && (
        <div className="mt-4 ml-[32px] p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          <span className="font-semibold">Error:</span> {project.errorMessage}
        </div>
      )}
    </Link>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "uploading":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
          <Loader2 className="w-3 h-3 animate-spin" />
          Uploading
        </span>
      );
    case "transcribing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
          <Loader2 className="w-3 h-3 animate-spin" />
          Transcribing
        </span>
      );
    case "analyzing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
          <Loader2 className="w-3 h-3 animate-spin" />
          Analyzing
        </span>
      );
    case "ready":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
          <CheckCircle2 className="w-3 h-3" />
          Ready
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

function EmptyState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No projects yet
      </h3>
      <p className="text-gray-500 mb-6">
        Create your first project to start generating case studies
      </p>
      <Link
        href="/dashboard/projects/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create First Project
      </Link>
    </div>
  );
}
