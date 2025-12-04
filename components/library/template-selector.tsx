"use client";

import { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATES, Template } from "@/lib/templates";
import { toast } from "sonner";

interface TemplateSelectorProps {
  caseStudyId: string;
  currentTemplate: string;
  currentPlan: {
    id: string;
    name: string;
  };
  onTemplateChange?: (templateId: string) => void;
}

export function TemplateSelector({
  caseStudyId,
  currentTemplate,
  currentPlan,
  onTemplateChange,
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [isChanging, setIsChanging] = useState(false);

  const canAccessTemplate = (template: Template) => {
    const tierOrder = ["free", "freelancer", "pro", "agency"];
    const userTierIndex = tierOrder.indexOf(currentPlan.id);
    const templateTierIndex = tierOrder.indexOf(
      template.tier === "pro" ? "pro" : template.tier
    );
    return userTierIndex >= templateTierIndex;
  };

  const handleSelectTemplate = async (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    if (!canAccessTemplate(template)) {
      toast.error(
        `${template.name} template requires ${template.tier} plan or higher`,
        {
          action: {
            label: "Upgrade",
            onClick: () => (window.location.href = "/dashboard/billing"),
          },
        }
      );
      return;
    }

    setIsChanging(true);
    try {
      const response = await fetch(
        `/api/case-studies/${caseStudyId}/template`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        }
      );

      if (!response.ok) throw new Error("Failed to update template");

      setSelectedTemplate(templateId);
      toast.success("Template updated successfully!");
      onTemplateChange?.(templateId);
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a design template for your case study. Premium templates
          available on higher plans.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((template) => {
          const canAccess = canAccessTemplate(template);
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              disabled={!canAccess || isChanging}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                !canAccess && "opacity-60 cursor-not-allowed"
              )}
            >
              {/* Selected Check */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {/* Locked Badge */}
              {!canAccess && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    {template.tier}
                  </Badge>
                </div>
              )}

              {/* Preview Image */}
              <div
                className="w-full h-40 rounded-lg mb-4 bg-gradient-to-br"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${template.colors.primary}, ${template.colors.accent})`,
                }}
              >
                {/* You can replace this with actual preview images */}
                <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-bold">
                  {template.name[0]}
                </div>
              </div>

              {/* Template Info */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{template.name}</h4>
                  {template.tier !== "free" && (
                    <Badge variant="outline" className="text-xs">
                      {template.tier}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {template.description}
                </p>

                {/* Features */}
                <ul className="space-y-1">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {currentPlan.id === "free" && (
        <div className="rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Unlock Premium Templates
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                Upgrade to Pro or Agency plan to access professional templates
                with custom branding, advanced layouts, and white-label options.
              </p>
              <Button asChild>
                <a href="/dashboard/billing">
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Plans
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
