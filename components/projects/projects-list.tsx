// app/dashboard/projects/projects-list.tsx
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
} from "lucide-react";
import { useCurrentPlan } from "../providers/subscription-provider";

interface ProjectsListProps {
  projects: any[];
  initialLimits: any;
}

export function ProjectsList({ projects, initialLimits }: ProjectsListProps) {
  const currentPlan = useCurrentPlan();
  const usagePercentage = initialLimits
    ? (initialLimits.caseStudiesUsed / currentPlan.limits.caseStudies) * 100
    : 0;

  return (
    <>
      {/* Usage Stats */}
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {currentPlan.name} Plan
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly usage</p>
          </div>
          <Link
            href="/dashboard/settings/billing"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Plan
          </Link>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Case Studies</span>
            <span className="font-medium text-foreground">
              {initialLimits?.caseStudiesUsed || 0} /{" "}
              {currentPlan.limits.caseStudies}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
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

        <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-muted-foreground">Storage Used</p>
            <p className="text-sm font-medium text-foreground">
              {initialLimits?.storageUsedMb || 0} / {currentPlan.limits.storage}{" "}
              MB
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max Video Length</p>
            <p className="text-sm font-medium text-foreground">
              {currentPlan.limits.videoLength} min
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Team Seats</p>
            <p className="text-sm font-medium text-foreground">
              {currentPlan.limits.teamSeats === -1
                ? "Unlimited"
                : currentPlan.limits.teamSeats}
            </p>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No projects yet
          </h3>
          <p className="text-muted-foreground mb-6">
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

function ProjectCard({ project }: { project: any }) {
  const getStatusBadge = () => {
    switch (project.status) {
      case "uploading":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            <Clock className="w-3 h-3" />
            Uploading
          </span>
        );
      case "transcribing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            <Clock className="w-3 h-3 animate-pulse" />
            Transcribing
          </span>
        );
      case "analyzing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
            <Clock className="w-3 h-3 animate-pulse" />
            Analyzing
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 flex items-start gap-3">
          {project.fileName && (
            <div className="shrink-0">
              {project.fileName.match(/\.(mp4|mov|avi)$/i) ? (
                <Film className="w-5 h-5 text-slate-400" />
              ) : (
                <FileAudio className="w-5 h-5 text-slate-400" />
              )}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {project.title}
            </h3>
            <p className="text-sm text-muted-foreground">{project.fileName}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(project.createdAt)}
        </div>
        {project.durationSeconds && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(project.durationSeconds)}
          </div>
        )}
        {project.fileSize && (
          <div>{(project.fileSize / (1024 * 1024)).toFixed(1)} MB</div>
        )}
      </div>

      {project.errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {project.errorMessage}
        </div>
      )}
    </Link>
  );
}
