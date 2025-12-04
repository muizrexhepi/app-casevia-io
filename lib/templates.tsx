// lib/templates.tsx
import React from "react";

export interface Template {
  id: string;
  name: string;
  description: string;
  preview: string; // URL or image
  tier: "free" | "pro" | "agency";
  features: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and minimalist design perfect for tech companies",
    preview: "/templates/modern-preview.png",
    tier: "free",
    features: ["Clean typography", "Gradient accents", "Mobile responsive"],
    colors: {
      primary: "#3b82f6",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "Corporate-ready template with classic styling",
    preview: "/templates/professional-preview.png",
    tier: "pro",
    features: [
      "Executive layout",
      "Data visualization",
      "Print-optimized",
      "Custom branding",
    ],
    colors: {
      primary: "#1e40af",
      secondary: "#475569",
      accent: "#0ea5e9",
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Eye-catching design for standout case studies",
    preview: "/templates/bold-preview.png",
    tier: "pro",
    features: [
      "Large typography",
      "Colorful sections",
      "Impact-focused",
      "Custom branding",
    ],
    colors: {
      primary: "#dc2626",
      secondary: "#ea580c",
      accent: "#f59e0b",
    },
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated template for luxury brands",
    preview: "/templates/elegant-preview.png",
    tier: "agency",
    features: [
      "Premium typography",
      "Subtle animations",
      "White label",
      "Custom domain",
    ],
    colors: {
      primary: "#000000",
      secondary: "#404040",
      accent: "#d4af37",
    },
  },
  {
    id: "tech",
    name: "Tech",
    description: "Developer-focused template with code highlights",
    preview: "/templates/tech-preview.png",
    tier: "agency",
    features: [
      "Syntax highlighting",
      "API documentation",
      "White label",
      "Custom domain",
    ],
    colors: {
      primary: "#22c55e",
      secondary: "#0ea5e9",
      accent: "#a855f7",
    },
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Narrative-driven template with timeline layout",
    preview: "/templates/storytelling-preview.png",
    tier: "agency",
    features: [
      "Timeline view",
      "Story arcs",
      "Interactive elements",
      "White label",
    ],
    colors: {
      primary: "#7c3aed",
      secondary: "#ec4899",
      accent: "#f43f5e",
    },
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesForPlan(planId: string): Template[] {
  const tierMap: Record<string, string[]> = {
    free: ["free"],
    freelancer: ["free", "pro"],
    pro: ["free", "pro"],
    agency: ["free", "pro", "agency"],
  };

  const allowedTiers = tierMap[planId] || ["free"];
  return TEMPLATES.filter((t) => allowedTiers.includes(t.tier));
}

// Template rendering components
export interface TemplateProps {
  caseStudy: {
    title: string;
    summary: string;
    clientName: string | null;
    clientIndustry: string | null;
    challenge: string;
    solution: string;
    results: string;
    metrics?: Array<{ metric: string; quote: string }>;
    keyQuotes?: string[];
    keyTakeaways?: string[];
    customBranding?: {
      logo?: string;
      primaryColor?: string;
      accentColor?: string;
    };
  };
  template: Template;
}

// Modern Template
export function ModernTemplate({ caseStudy, template }: TemplateProps) {
  const colors = caseStudy.customBranding?.primaryColor
    ? {
        primary: caseStudy.customBranding.primaryColor,
        accent: caseStudy.customBranding.accentColor || template.colors.accent,
      }
    : template.colors;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-16">
        {caseStudy.customBranding?.logo && (
          <img
            src={caseStudy.customBranding.logo}
            alt="Logo"
            className="h-12 mb-8"
          />
        )}
        <h1
          className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
          }}
        >
          {caseStudy.title}
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          {caseStudy.summary}
        </p>
      </div>

      {/* Client Info */}
      {(caseStudy.clientName || caseStudy.clientIndustry) && (
        <div
          className="rounded-2xl p-6 mb-16 border-l-4"
          style={{ borderColor: colors.primary, backgroundColor: "#f9fafb" }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {caseStudy.clientName && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="text-lg font-semibold">{caseStudy.clientName}</p>
              </div>
            )}
            {caseStudy.clientIndustry && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Industry</p>
                <p className="text-lg font-semibold">
                  {caseStudy.clientIndustry}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-16">
        <Section title="The Challenge" content={caseStudy.challenge} />
        <Section title="The Solution" content={caseStudy.solution} />
        <Section title="The Results" content={caseStudy.results} />
      </div>

      {/* Metrics */}
      {caseStudy.metrics && caseStudy.metrics.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">Key Metrics</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {caseStudy.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                }}
              >
                <p className="text-3xl font-bold mb-3">{metric.metric}</p>
                <p className="text-sm opacity-90 italic">"{metric.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotes */}
      {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-8">What They Said</h2>
          <div className="space-y-6">
            {caseStudy.keyQuotes.map((quote, idx) => (
              <blockquote
                key={idx}
                className="border-l-4 pl-6 py-2 italic text-lg text-gray-700"
                style={{ borderColor: colors.primary }}
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Professional Template
export function ProfessionalTemplate({ caseStudy, template }: TemplateProps) {
  const colors = caseStudy.customBranding?.primaryColor
    ? {
        primary: caseStudy.customBranding.primaryColor,
        accent: caseStudy.customBranding.accentColor || template.colors.accent,
      }
    : template.colors;

  return (
    <div className="max-w-5xl mx-auto px-8 py-16 bg-white">
      {/* Header with Logo */}
      <div
        className="border-b-2 pb-8 mb-12"
        style={{ borderColor: colors.primary }}
      >
        {caseStudy.customBranding?.logo && (
          <img
            src={caseStudy.customBranding.logo}
            alt="Logo"
            className="h-16 mb-6"
          />
        )}
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: colors.primary }}
        >
          {caseStudy.title}
        </h1>
        <p className="text-lg text-gray-600">{caseStudy.summary}</p>
      </div>

      {/* Executive Summary Box */}
      {(caseStudy.clientName || caseStudy.clientIndustry) && (
        <div className="bg-gray-50 border-2 rounded-lg p-6 mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
            Executive Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {caseStudy.clientName && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Organization</p>
                <p className="font-semibold text-gray-900">
                  {caseStudy.clientName}
                </p>
              </div>
            )}
            {caseStudy.clientIndustry && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Sector</p>
                <p className="font-semibold text-gray-900">
                  {caseStudy.clientIndustry}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content with numbering */}
      <div className="space-y-12">
        <NumberedSection
          number="01"
          title="The Challenge"
          content={caseStudy.challenge}
        />
        <NumberedSection
          number="02"
          title="The Solution"
          content={caseStudy.solution}
        />
        <NumberedSection
          number="03"
          title="The Results"
          content={caseStudy.results}
        />
      </div>

      {/* Metrics Grid */}
      {caseStudy.metrics && caseStudy.metrics.length > 0 && (
        <div
          className="mt-12 border-t-2 pt-12"
          style={{ borderColor: colors.primary }}
        >
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: colors.primary }}
          >
            Measurable Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudy.metrics.map((metric, idx) => (
              <div key={idx} className="text-center p-6 border-2 rounded-lg">
                <p
                  className="text-3xl font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  {metric.metric}
                </p>
                <p className="text-sm text-gray-600">"{metric.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

function NumberedSection({
  number,
  title,
  content,
}: {
  number: string;
  title: string;
  content: string;
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-bold">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}

// Template Renderer - dynamically select component
export function renderTemplate(templateId: string, props: TemplateProps) {
  const templates: Record<string, React.FC<TemplateProps>> = {
    modern: ModernTemplate,
    professional: ProfessionalTemplate,
    // Add more as you build them
  };

  const TemplateComponent = templates[templateId] || ModernTemplate;
  return <TemplateComponent {...props} />;
}
