// components/templates/template-gallery.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Lock,
  Sparkles,
  Eye,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATES, Template } from "@/lib/templates";
import { Plan } from "@/lib/constants/plans";
import { toast } from "sonner";
import { updateTemplate } from "@/app/dashboard/case-studies/[id]/actions";

interface TemplateGalleryProps {
  currentPlan: Plan;
  caseStudyId?: string;
  activeTemplateId?: string;
}

export function TemplateGallery({
  currentPlan,
  caseStudyId,
  activeTemplateId = "modern",
}: TemplateGalleryProps) {
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [currentSelection, setCurrentSelection] = useState(activeTemplateId);

  const canAccessTemplate = (template: Template) => {
    const tierMap: Record<string, string[]> = {
      free: ["free"],
      freelancer: ["free", "pro"],
      pro: ["free", "pro"],
      agency: ["free", "pro", "agency"],
    };

    const allowedTiers = tierMap[currentPlan.id] || ["free"];
    return allowedTiers.includes(template.tier);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!caseStudyId) {
      toast.error("No case study selected");
      return;
    }

    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    if (!canAccessTemplate(template)) {
      toast.error(`${template.name} requires ${template.tier} plan or higher`);
      return;
    }

    setCurrentSelection(templateId);

    startTransition(async () => {
      try {
        const result = await updateTemplate(caseStudyId, templateId);
        if (result.success) {
          toast.success("Template updated successfully");
        } else {
          toast.error(result.error || "Failed to update template");
          setCurrentSelection(activeTemplateId); // Revert on error
        }
      } catch (error) {
        toast.error("Failed to update template");
        setCurrentSelection(activeTemplateId); // Revert on error
      }
    });
  };

  const filteredTemplates =
    selectedTier === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.tier === selectedTier);

  const accessibleCount = TEMPLATES.filter(canAccessTemplate).length;
  const lockedCount = TEMPLATES.length - accessibleCount;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Templates</p>
          <p className="text-2xl font-bold">{TEMPLATES.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Available to You</p>
          <p className="text-2xl font-bold text-green-600">{accessibleCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Locked</p>
          <p className="text-2xl font-bold text-orange-600">{lockedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {["all", "free", "pro", "agency"].map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
              selectedTier === tier
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tier === "all" ? "All Templates" : tier}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const canAccess = canAccessTemplate(template);
          const isActive = currentSelection === template.id;
          const isUpdating = isPending && currentSelection === template.id;

          return (
            <div
              key={template.id}
              className={cn(
                "relative flex flex-col rounded-xl border-2 overflow-hidden transition-all group bg-card",
                isActive
                  ? "border-primary shadow-lg shadow-primary/20"
                  : "hover:border-primary/50",
                !canAccess && "opacity-75"
              )}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-20 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </div>
              )}

              {/* Preview Area */}
              <div
                className="w-full h-48 relative shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent})`,
                }}
              >
                {/* Abstract UI representation */}
                <div className="absolute inset-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4">
                  <div className="h-4 w-1/2 bg-white/40 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/20 rounded" />
                    <div className="h-2 w-5/6 bg-white/20 rounded" />
                    <div className="h-2 w-4/6 bg-white/20 rounded" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-12 w-12 bg-white/30 rounded" />
                    <div className="h-12 w-12 bg-white/30 rounded" />
                  </div>
                </div>

                {/* Lock Overlay */}
                {!canAccess && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10">
                    <Lock className="w-8 h-8 mb-2 opacity-80" />
                    <p className="font-semibold text-sm capitalize">
                      Requires {template.tier}
                    </p>
                  </div>
                )}

                {/* Hover Preview Button */}
                {canAccess && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="shadow-lg"
                    >
                      <Link
                        href={`/dashboard/templates/preview/${template.id}`}
                        target="_blank"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Live Preview
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-xs",
                      template.tier === "free" && "bg-gray-50",
                      template.tier === "pro" &&
                        "bg-purple-50 text-purple-700 border-purple-200",
                      template.tier === "agency" &&
                        "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {template.tier}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Color Preview */}
                <div className="flex gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded border shadow-sm"
                    style={{ backgroundColor: template.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded border shadow-sm"
                    style={{ backgroundColor: template.colors.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="w-8 h-8 rounded border shadow-sm"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Accent"
                  />
                </div>

                {/* Features */}
                <div className="mt-auto pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    {template.features.slice(0, 3).map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center text-xs text-muted-foreground"
                      >
                        <Check className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/templates/preview/${template.id}`}
                        target="_blank"
                      >
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        Preview
                      </Link>
                    </Button>

                    {canAccess ? (
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelectTemplate(template.id)}
                        disabled={isPending || !caseStudyId}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                            Applying...
                          </>
                        ) : isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-2" />
                            Active
                          </>
                        ) : (
                          "Select"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-dashed"
                        asChild
                      >
                        <Link href="/dashboard/settings/billing">
                          <Lock className="w-3.5 h-3.5 mr-2" />
                          Upgrade
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Callout */}
      {lockedCount > 0 && (
        <div className="mt-8 rounded-xl border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-purple-900 dark:text-purple-100">
                  Unlock {lockedCount} Premium Template
                  {lockedCount > 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Get access to agency-grade templates with advanced
                  customization options
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/dashboard/settings/billing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
