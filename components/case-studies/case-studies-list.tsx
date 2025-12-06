"use client";

import Link from "next/link";
import { useSubscription } from "../providers/subscription-provider";
import {
  Plus,
  BookText,
  Calendar,
  Eye,
  Building,
  Globe,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MoreVertical,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

type CaseStudy = {
  id: string;
  title: string;
  summary: string | null;
  clientName: string | null;
  clientIndustry: string | null;
  published: boolean;
  viewCount: number;
  createdAt: string | Date;
  publicSlug: string | null;
  templateUsed: string | null;
};

type PlanLimits = {
  caseStudiesUsed: number;
};

interface CaseStudiesListProps {
  caseStudies: CaseStudy[];
  initialLimits: PlanLimits;
}

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function CaseStudiesList({
  caseStudies,
  initialLimits,
}: CaseStudiesListProps) {
  const { currentPlan } = useSubscription();
  const [view, setView] = useState<"grid" | "list">("list");

  const publishedCases = caseStudies.filter((cs) => cs.published);
  const draftCases = caseStudies.filter((cs) => !cs.published);
  const totalViews = caseStudies.reduce((sum, cs) => sum + cs.viewCount, 0);

  const isOverLimit =
    initialLimits?.caseStudiesUsed >= currentPlan.limits.caseStudies;

  const limitPercentage =
    (initialLimits?.caseStudiesUsed / currentPlan.limits.caseStudies) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total"
          value={caseStudies.length}
          icon={<BookText className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Published"
          value={publishedCases.length}
          icon={<Globe className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="Drafts"
          value={draftCases.length}
          icon={<Edit className="w-4 h-4" />}
          color="orange"
        />
        <StatCard
          label="Total Views"
          value={totalViews}
          icon={<Eye className="w-4 h-4" />}
          color="purple"
        />
      </div>

      {/* Plan Usage Card */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium">Plan Usage</p>
            <p className="text-xs text-muted-foreground">
              {initialLimits?.caseStudiesUsed} of{" "}
              {currentPlan.limits.caseStudies} case studies used
            </p>
          </div>
          {isOverLimit && (
            <Button size="sm" asChild>
              <Link href="/dashboard/settings/billing">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade
              </Link>
            </Button>
          )}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              limitPercentage >= 100
                ? "bg-destructive"
                : limitPercentage >= 80
                ? "bg-orange-500"
                : "bg-primary"
            )}
            style={{ width: `${Math.min(limitPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Content */}
      {caseStudies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {caseStudies.map((cs) => (
            <CaseStudyCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          {label}
        </span>
        <div className={cn("p-1.5 rounded-md", colors[color])}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <Link
      href={`/dashboard/case-studies/${caseStudy.id}`}
      className="block group"
    >
      <div className="rounded-lg border bg-card hover:bg-accent/50 transition-colors p-4">
        <div className="flex items-start gap-4">
          {/* Left: Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title & Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 truncate group-hover:text-primary transition-colors">
                  {caseStudy.title}
                </h3>
                {caseStudy.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {caseStudy.summary}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {caseStudy.published ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900"
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {caseStudy.clientName && (
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  {caseStudy.clientName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(caseStudy.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {caseStudy.viewCount} views
              </span>
              {caseStudy.templateUsed && (
                <span className="flex items-center gap-1.5 capitalize">
                  <Sparkles className="w-3.5 h-3.5" />
                  {caseStudy.templateUsed}
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {caseStudy.published && caseStudy.publicSlug && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/${caseStudy.publicSlug}`} target="_blank">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/case-studies/${caseStudy.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {caseStudy.published && caseStudy.publicSlug && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/${caseStudy.publicSlug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `${window.location.origin}/${caseStudy.publicSlug}`
                        );
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed p-12 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <BookText className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">No case studies yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload a client interview to generate your first professional case
            study
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
