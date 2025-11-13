"use client";

import Link from "next/link";
import { useSubscription } from "../providers/subscription-provider";
import {
  Plus,
  BookText,
  Calendar,
  Eye,
  Building,
  CheckCircle2,
  FileText,
  TrendingUp,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Globe,
  Loader2, // Import Loader2 for consistency
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ... (types and formatDate function are unchanged) ...

type CaseStudy = {
  id: string;
  title: string;
  clientName: string | null;
  clientIndustry: string | null;
  published: boolean;
  viewCount: number;
  createdAt: string | Date;
  publicSlug: string | null;
};

type PlanLimits = {
  caseStudiesUsed: number;
};

interface CaseStudiesListProps {
  caseStudies: CaseStudy[];
  initialLimits: PlanLimits;
}

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function CaseStudiesList({
  caseStudies,
  initialLimits,
}: CaseStudiesListProps) {
  const { currentPlan, isLoading } = useSubscription();

  const publishedCount = caseStudies.filter((cs) => cs.published).length;
  const draftCount = caseStudies.filter((cs) => !cs.published).length;
  const totalViews = caseStudies.reduce((sum, cs) => sum + cs.viewCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          {/* Use consistent Loader2 */}
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isOverLimit =
    initialLimits?.caseStudiesUsed >= currentPlan.limits.caseStudies;

  return (
    <>
      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<BookText className="w-5 h-5 text-primary" />}
          label="Total Case Studies"
          value={caseStudies.length}
          variant="primary"
        />
        <StatCard
          icon={
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
          }
          label="Published"
          value={publishedCount}
          variant="green"
        />
        <StatCard
          icon={
            <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          }
          label="Drafts"
          value={draftCount}
          variant="orange"
        />
        <StatCard
          icon={
            <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          }
          label="Total Views"
          value={totalViews}
          variant="purple"
        />
      </div>

      {/* Upgrade Banner - Refactored with 'destructive' colors */}
      {isOverLimit && (
        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/10 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-1">
                Case Study Limit Reached
              </h3>
              <p className="text-sm text-destructive/90 mb-4">
                You've used all {currentPlan.limits.caseStudies} case studies in
                your {currentPlan.name} plan. Upgrade to create more and unlock
                advanced features.
              </p>
              <Button asChild>
                <Link href="/dashboard/billing">
                  Upgrade Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Case Studies Grid */}
      {caseStudies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {caseStudies.map((cs) => (
            <CaseStudyCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
      )}
    </>
  );
}

// Refactored StatCard to use a 'variant' prop
function StatCard({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: "primary" | "green" | "orange" | "purple";
}) {
  const variants = {
    primary: "bg-primary/10",
    green: "bg-green-100 dark:bg-green-950/30",
    orange: "bg-orange-100 dark:bg-orange-950/30",
    purple: "bg-purple-100 dark:bg-purple-950/30",
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            variants[variant]
          )}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// Refactored CaseStudyCard for gradient and icon
function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="group rounded-xl border bg-card transition-all duration-200 hover:shadow-lg hover:border-primary/50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon - Refactored gradient */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <Link
                  href={`/dashboard/case-studies/${caseStudy.id}`}
                  className="block"
                >
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {caseStudy.title}
                  </h3>
                  {caseStudy.clientName && (
                    <p className="text-sm text-muted-foreground">
                      {caseStudy.clientName}
                    </p>
                  )}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge published={caseStudy.published} />
                {caseStudy.published && caseStudy.publicSlug && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link href={`/${caseStudy.publicSlug}`} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(caseStudy.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{caseStudy.viewCount} views</span>
              </div>
              {caseStudy.clientIndustry && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  <span>{caseStudy.clientIndustry}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (already clean) */}
      <div className="border-t bg-muted/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/case-studies/${caseStudy.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Details →
          </Link>
          {caseStudy.published && caseStudy.publicSlug && (
            <Link
              href={`/${caseStudy.publicSlug}`}
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              Public Page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Refactored StatusBadge for consistency
function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <Badge className="border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100/80">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Published
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <FileText className="w-3 h-3 mr-1" />
      Draft
    </Badge>
  );
}

// Refactored EmptyState with semantic colors
function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-purple-100/50 dark:from-primary/10 dark:to-purple-950/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BookText className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No case studies yet
        </h3>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Create your first project to generate professional case studies from
          customer interviews
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard/projects/new">
            <Plus className="w-5 h-5 mr-2" />
            Create First Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
