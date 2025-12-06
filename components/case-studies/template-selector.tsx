// components/case-studies/template-selector.tsx
"use client";

import { useState, useTransition } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateTemplate } from "@/app/dashboard/case-studies/[id]/actions";
import { toast } from "sonner";
import { TEMPLATES, Template } from "@/lib/templates";

interface TemplateSelectorProps {
  caseStudyId: string;
  currentTemplate: string;
  availableTemplates: Template[];
  userPlanId: string;
}

export function TemplateSelector({
  caseStudyId,
  currentTemplate,
  availableTemplates,
  userPlanId,
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate);
  const [isPending, startTransition] = useTransition();

  const handleTemplateChange = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    // Check if template is available
    const isAvailable = availableTemplates.some((t) => t.id === templateId);
    if (!isAvailable) {
      toast.error(`${template.name} requires ${template.tier} plan or higher`);
      return;
    }

    setSelectedTemplate(templateId);

    startTransition(async () => {
      const result = await updateTemplate(caseStudyId, templateId);

      if (result.success) {
        toast.success("Template updated successfully");
      } else {
        toast.error(result.error || "Failed to update template");
        setSelectedTemplate(currentTemplate); // Revert on error
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => {
          const isAvailable = availableTemplates.some(
            (t) => t.id === template.id
          );
          const isSelected = selectedTemplate === template.id;
          const isLocked = !isAvailable;

          return (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              disabled={isPending || isLocked}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }
                ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                ${isPending ? "opacity-50 cursor-wait" : ""}
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Lock Icon for unavailable templates */}
              {isLocked && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* Plan Badge */}
                <div>
                  {template.tier === "free" ? (
                    <Badge variant="secondary">Free</Badge>
                  ) : template.tier === "pro" ? (
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Agency
                    </Badge>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-1">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-muted-foreground flex items-center gap-1.5"
                    >
                      <span className="text-primary">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Color Preview */}
                <div className="flex gap-2 pt-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: template.colors.primary }}
                    title="Primary"
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: template.colors.secondary }}
                    title="Secondary"
                  />
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Accent"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {availableTemplates.length < TEMPLATES.length && (
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            Unlock {TEMPLATES.length - availableTemplates.length} more premium
            templates
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/settings/billing">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Plan
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
