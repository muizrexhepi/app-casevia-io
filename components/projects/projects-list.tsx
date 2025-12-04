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
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
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
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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

interface ProjectsListEnterpriseProps {
  projects: Project[];
  initialLimits: ProjectPageLimits;
}

// Helper functions
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
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
        <Film className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (fileName.match(/\.(mp3|wav|m4a|ogg)$/i)) {
    return (
      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
        <FileAudio className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
      <FileText className="w-5 h-5 text-muted-foreground" />
    </div>
  );
};

function ProjectStatusBadge({ status }: { status: string }) {
  const badges = {
    uploading: {
      bg: "bg-blue-100 dark:bg-blue-950/50",
      text: "text-blue-700 dark:text-blue-400",
      label: "Uploading",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    transcribing: {
      bg: "bg-purple-100 dark:bg-purple-950/50",
      text: "text-purple-700 dark:text-purple-400",
      label: "Transcribing",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    analyzing: {
      bg: "bg-indigo-100 dark:bg-indigo-950/50",
      text: "text-indigo-700 dark:text-indigo-400",
      label: "Analyzing",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    ready: {
      bg: "bg-emerald-100 dark:bg-emerald-950/50",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "Ready",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    failed: {
      bg: "bg-red-100 dark:bg-red-950/50",
      text: "text-red-700 dark:text-red-400",
      label: "Failed",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const badge = badges[status as keyof typeof badges];
  if (!badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        badge.bg,
        badge.text
      )}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}

export function ProjectsListEnterprise({
  projects,
  initialLimits,
}: ProjectsListEnterpriseProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { currentPlan, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAllProjects = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map((p) => p.id));
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Case Studies Card */}
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              This month
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {initialLimits?.caseStudiesUsed}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {currentPlan.limits.caseStudies}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">Case Studies</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Total
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {initialLimits?.storageUsedMb}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {currentPlan.limits.storage} MB
              </span>
            </p>
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Team Seats Card */}
        <div className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Active
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {currentPlan.limits.teamSeats === -1
                ? "Unlimited"
                : currentPlan.limits.teamSeats}
            </p>
            <p className="text-sm text-muted-foreground">Team Seats</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {readyCount} ready
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {processingCount} processing
              </span>
            </div>
          </div>
        </div>

        {/* Plan Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-card flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 px-2 py-1 bg-white/50 dark:bg-card/50 rounded-md">
              {currentPlan.name}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">
              {currentPlan.name} Plan
            </p>
            <p className="text-sm text-muted-foreground">
              Monthly subscription
            </p>
            <Button asChild size="sm" className="w-full mt-2">
              <Link href="/dashboard/billing">Upgrade Plan</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Sort
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <EmptyState hasSearchQuery={searchQuery.length > 0} />
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          {/* Table Header */}
          <div className="border-b bg-muted/50">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={
                    selectedProjects.length === filteredProjects.length &&
                    filteredProjects.length > 0
                  }
                  onCheckedChange={toggleAllProjects}
                />
              </div>
              <div className="col-span-5">Project</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Duration</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                isSelected={selectedProjects.includes(project.id)}
                onToggle={() => toggleProject(project.id)}
              />
            ))}
          </div>

          {/* Table Footer */}
          <div className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Showing</span>
              <span className="font-medium text-foreground">
                1-{filteredProjects.length}
              </span>
              <span>of</span>
              <span className="font-medium text-foreground">
                {filteredProjects.length}
              </span>
              <span>projects</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  isSelected,
  onToggle,
}: {
  project: Project;
  isSelected: boolean;
  onToggle: () => void;
}) {
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
        toast.success("Project deleted successfully.");
      } else {
        toast.error(result.error || "Failed to delete project");
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-accent/50 transition-colors group">
        {/* Checkbox */}
        <div className="col-span-1 flex items-center">
          <Checkbox checked={isSelected} onCheckedChange={onToggle} />
        </div>

        {/* Project Info */}
        <div className="col-span-5 flex items-center gap-3 min-w-0">
          {getFileIcon(project.fileName)}
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/projects/${project.id}`}>
              <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors cursor-pointer">
                {project.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground truncate">
                {project.fileName}
              </p>
              {fileSize && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {fileSize}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-2 flex items-center">
          <ProjectStatusBadge status={project.status} />
        </div>

        {/* Date */}
        <div className="col-span-2 flex items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="col-span-1 flex items-center">
          {duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
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
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
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

function EmptyState({ hasSearchQuery }: { hasSearchQuery: boolean }) {
  if (hasSearchQuery) {
    return (
      <div className="bg-card rounded-xl border p-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search query or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-2 border-dashed border-border p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No projects yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Start by uploading your first customer interview to generate a
          professional case study
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard/projects/new">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
