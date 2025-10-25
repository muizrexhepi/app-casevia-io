// app/dashboard/casestudies/casestudies-list.tsx
"use client";

import Link from "next/link";
import {
  Plus,
  BookText, // Changed icon
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Eye, // Icon for views
  Building, // Icon for industry
  Pencil, // Icon for draft
} from "lucide-react";
import { useCurrentPlan } from "../providers/subscription-provider";

interface CaseStudiesListProps {
  caseStudies: any[]; // Using 'any' to match the provided project type
  initialLimits: any;
}

export function CaseStudiesList({
  caseStudies,
  initialLimits,
}: CaseStudiesListProps) {
  const currentPlan = useCurrentPlan();
  const usagePercentage = initialLimits
    ? (initialLimits.caseStudiesUsed / currentPlan.limits.caseStudies) * 100
    : 0;

  return (
    <>
      {/* Usage Stats (This card is identical to the one on the projects page) */}
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

        <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-border">
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

      {/* Case Studies List */}
      {caseStudies.length === 0 ? (
        <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
          <BookText className="w-16 h-16 mx-auto mb-4 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No case studies yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Your generated case studies will appear here. Start by creating a
            new project.
          </p>
          <Link
            href="/dashboard/projects/new" // Link to create a project, not a case study
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {caseStudies.map((cs) => (
            <CaseStudyCard key={cs.id} caseStudy={cs} />
          ))}
        </div>
      )}
    </>
  );
}

function CaseStudyCard({ caseStudy }: { caseStudy: any }) {
  const getStatusBadge = () => {
    if (caseStudy.published) {
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
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Link
      href={`/dashboard/case-studies/${caseStudy.id}`} // Link to the specific case study editor
      className="block bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 flex items-start gap-3">
          <div className="shrink-0">
            <BookText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {caseStudy.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {caseStudy.clientName}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
