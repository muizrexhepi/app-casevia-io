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
  TrendingUp,
  Database,
  Users,
  MoreVertical,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useSubscription } from "../providers/subscription-provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject } from "@/app/dashboard/projects/[id]/actions";

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
  if (!fileName)
    return (
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
    );

  if (fileName.match(/\.(mp4|mov|avi|webm)$/i)) {
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <Film className="w-5 h-5 text-blue-600" />
      </div>
    );
  }

  if (fileName.match(/\.(mp3|wav|m4a|ogg)$/i)) {
    return (
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
        <FileAudio className="w-5 h-5 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
      <FileText className="w-5 h-5 text-muted-foreground" />
    </div>
  );
};

export function ProjectsList({ projects, initialLimits }: ProjectsListProps) {
  return (
    <>
      <UsageStats initialLimits={initialLimits} projects={projects} />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      )}
    </>
  );
}

function UsageStats({
  initialLimits,
  projects,
}: {
  initialLimits: ProjectPageLimits;
  projects: Project[];
}) {
  const { currentPlan, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="bg-background rounded-xl border p-8 mb-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const usagePercentage =
    (initialLimits?.caseStudiesUsed / currentPlan.limits.caseStudies) * 100;
  const storagePercentage =
    (initialLimits?.storageUsedMb / currentPlan.limits.storage) * 100;

  const readyCount = projects.filter((p) => p.status === "ready").length;
  const processingCount = projects.filter((p) =>
    ["uploading", "transcribing", "analyzing"].includes(p.status)
  ).length;

  return (
    <div className="bg-card rounded-xl border p-6 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {currentPlan.name} Plan
              </h3>
              <p className="text-sm text-muted-foreground">
                Monthly usage overview
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          Upgrade Plan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="Case Studies"
          used={initialLimits?.caseStudiesUsed}
          total={currentPlan.limits.caseStudies}
          percentage={usagePercentage}
          color="blue"
        />
        <UsageCard
          icon={<Database className="w-5 h-5 text-purple-600" />}
          label="Storage"
          used={initialLimits?.storageUsedMb}
          total={currentPlan.limits.storage}
          percentage={storagePercentage}
          color="purple"
          unit="MB"
        />
        <div className="bg-background rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Seats</p>
              <p className="text-xl font-bold text-foreground">
                {currentPlan.limits.teamSeats === -1
                  ? "Unlimited"
                  : currentPlan.limits.teamSeats}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {readyCount} ready • {processingCount} processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  icon,
  label,
  used,
  total,
  percentage,
  color,
  unit = "",
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  total: number;
  percentage: number;
  color: "blue" | "purple";
  unit?: string;
}) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      bar:
        percentage >= 90
          ? "bg-red-500"
          : percentage >= 70
          ? "bg-yellow-500"
          : "bg-blue-500",
    },
    purple: {
      bg: "bg-purple-50",
      bar:
        percentage >= 90
          ? "bg-red-500"
          : percentage >= 70
          ? "bg-yellow-500"
          : "bg-purple-500",
    },
  };

  return (
    <div className="bg-background rounded-lg border p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            colorClasses[color].bg
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">
            {used}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {total} {unit}
            </span>
          </p>
        </div>
      </div>
      <div className="relative">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              colorClasses[color].bar
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(0)}% used
        </p>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const duration = formatDuration(project.durationSeconds);
  const fileSize = formatFileSize(project.fileSize);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        alert(result.error || "Failed to delete project");
      }
    });
  };

  return (
    <>
      <div
        className={cn(
          "group bg-card rounded-lg border p-4",
          "transition-all duration-200",
          "hover:shadow-md hover:border-gray-300"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="shrink-0">{getFileIcon(project.fileName)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex-1 min-w-0"
              >
                <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
              </Link>
              <div className="flex items-center gap-2">
                <ProjectStatusBadge status={project.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Project
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <p className="text-sm text-muted-foreground truncate mb-2">
              {project.fileName}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(project.createdAt)}</span>
              </div>
              {duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{duration}</span>
                </div>
              )}
              {fileSize && <span>{fileSize}</span>}
            </div>

            {project.errorMessage && (
              <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-red-900">
                    Processing failed
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">
                    {project.errorMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.title}" and all associated
              case studies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const badges = {
    uploading: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      label: "Uploading",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    transcribing: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      label: "Transcribing",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    analyzing: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      label: "Analyzing",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    ready: {
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Ready",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    failed: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: "Failed",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const badge = badges[status as keyof typeof badges];
  if (!badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        badge.bg,
        badge.text
      )}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="bg-background rounded-xl border-2 border-dashed p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No projects yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Start by uploading your first customer interview to generate a
          professional case study
        </p>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Create Your First Project
        </Link>
      </div>
    </div>
  );
}
