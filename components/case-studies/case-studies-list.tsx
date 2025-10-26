"use client";

import Link from "next/link";
import { useCurrentPlan } from "../providers/subscription-provider";
import { UpgradeBanner } from "./upgrade-banner";
import {
  Plus,
  BookText,
  Calendar,
  Eye,
  Building,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility

// ====================================================================
// 1. TYPES (from your schema)
// ====================================================================

type EnterpriseCaseStudy = {
  id: string;
  title: string;
  clientName: string | null;
  clientIndustry: string | null;
  published: boolean;
  viewCount: number;
  createdAt: string | Date;
  publicSlug: string | null;
};

type EnterprisePlanLimits = {
  caseStudiesUsed: number;
  // Add other limits as needed
};

interface CaseStudiesListProps {
  caseStudies: EnterpriseCaseStudy[];
  initialLimits: EnterprisePlanLimits;
}

// ====================================================================
// 2. HELPER: Utility Functions
// ====================================================================

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ====================================================================
// 3. MAIN COMPONENT: CaseStudiesList
// ====================================================================

export function CaseStudiesList({
  caseStudies,
  initialLimits,
}: CaseStudiesListProps) {
  const currentPlan = useCurrentPlan();

  const isOverLimit =
    initialLimits.caseStudiesUsed >= currentPlan.limits.caseStudies;

  return (
    <>
      {isOverLimit && (
        <UpgradeBanner
          planName={currentPlan.name}
          limit={currentPlan.limits.caseStudies}
        />
      )}

      {caseStudies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4">
          {caseStudies.map((cs) => (
            <EnterpriseCaseStudyCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
      )}
    </>
  );
}

// ====================================================================
// 4. HELPER COMPONENT: EnterpriseCaseStudyCard
// ====================================================================

function EnterpriseCaseStudyCard({
  caseStudy,
}: {
  caseStudy: EnterpriseCaseStudy;
}) {
  return (
    <Link
      href={`/dashboard/case-studies/${caseStudy.id}`}
      className={cn(
        "block bg-card rounded-lg border border-border p-6",
        "transition-colors hover:bg-muted/50" // Subtle enterprise hover
      )}
    >
      {/* Top Row: Main Info + Status */}
      <div className="flex items-start justify-between mb-3">
        {/* Left Side: Icon + Title/Client */}
        <div className="flex-1 flex items-start gap-3">
          <BookText className="w-5 h-5 text-muted-foreground mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {caseStudy.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {caseStudy.clientName}
            </p>
          </div>
        </div>

        {/* Right Side: Status */}
        <div className="flex-shrink-0">
          <StatusBadge published={caseStudy.published} />
        </div>
      </div>

      {/* Bottom Row: Meta Info (indented to align with title) */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground pl-[32px]">
        {" "}
        {/* 20px icon + 12px gap = 32px */}
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(caseStudy.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {caseStudy.viewCount} views
        </div>
        {caseStudy.clientIndustry && (
          <div className="flex items-center gap-1">
            <Building className="w-4 h-4" />
            {caseStudy.clientIndustry}
          </div>
        )}
      </div>
    </Link>
  );
}

// ====================================================================
// 5. HELPER COMPONENT: StatusBadge
// ====================================================================

function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
        <CheckCircle2 className="w-3 h-3" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
      <Pencil className="w-3 h-3" />
      Draft
    </span>
  );
}

// ====================================================================
// 6. HELPER COMPONENT: EmptyState
// ====================================================================

function EmptyState() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
      <BookText className="w-16 h-16 mx-auto mb-4 text-foreground" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No case studies yet
      </h3>
      <p className="text-muted-foreground mb-6">
        Your generated case studies will appear here. Start by creating a new
        project.
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
