"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Sparkles, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATES, Template } from "@/lib/templates";
import { Plan } from "@/lib/constants/plans";

interface TemplateGalleryProps {
  currentPlan: Plan;
}

export function TemplateGallery({ currentPlan }: TemplateGalleryProps) {
  const [selectedTier, setSelectedTier] = useState<string>("all");

  const canAccessTemplate = (template: Template) => {
    const tierOrder = ["free", "freelancer", "pro", "agency"];
    const userTierIndex = tierOrder.indexOf(currentPlan.id);
    const templateTierIndex = tierOrder.indexOf(
      template.tier === "pro" ? "pro" : template.tier
    );
    return userTierIndex >= templateTierIndex;
  };

  const filteredTemplates =
    selectedTier === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.tier === selectedTier);

  const accessibleCount = TEMPLATES.filter(canAccessTemplate).length;
  const lockedCount = TEMPLATES.length - accessibleCount;

  return (
    <div className="space-y-6">
      {/* Stats */}
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
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTier("all")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            selectedTier === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          All Templates
        </button>
        <button
          onClick={() => setSelectedTier("free")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            selectedTier === "free"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Free
        </button>
        <button
          onClick={() => setSelectedTier("pro")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            selectedTier === "pro"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Pro
        </button>
        <button
          onClick={() => setSelectedTier("agency")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            selectedTier === "agency"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Agency
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const canAccess = canAccessTemplate(template);

          return (
            <div
              key={template.id}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-xl group",
                !canAccess && "opacity-75"
              )}
            >
              {/* Preview */}
              <div
                className="w-full h-64 bg-gradient-to-br relative"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent})`,
                }}
              >
                {/* Mock preview content */}
                <div className="absolute inset-0 p-6 text-white">
                  <div className="h-8 w-3/4 bg-white/20 rounded mb-4"></div>
                  <div className="h-4 w-1/2 bg-white/15 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-white/15 rounded"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="h-20 bg-white/10 rounded-lg"></div>
                  </div>
                </div>

                {/* Lock Overlay */}
                {!canAccess && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-12 h-12 text-white mx-auto mb-2" />
                      <p className="text-white font-semibold">
                        Requires {template.tier} plan
                      </p>
                    </div>
                  </div>
                )}

                {/* Hover Preview Button */}
                {canAccess && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <Badge
                    variant={canAccess ? "default" : "secondary"}
                    className={cn(
                      !canAccess && "bg-orange-100 text-orange-700"
                    )}
                  >
                    {template.tier}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 mb-4">
                  {template.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                {canAccess ? (
                  <Button variant="outline" className="w-full" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Template
                  </Button>
                ) : (
                  <Button asChild className="w-full" size="sm">
                    <Link href="/dashboard/billing">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Upgrade to Access
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {lockedCount > 0 && (
        <div className="rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-8 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-semibold mb-2">
            Unlock {lockedCount} More Templates
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upgrade your plan to access premium templates with advanced
            features, custom branding, and white-label options.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard/billing">
              View Plans & Pricing
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
