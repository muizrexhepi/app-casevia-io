// app/dashboard/case-studies/[id]/editable-case-study.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Download,
  Edit3,
  FileText,
  FileCode,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateCaseStudyContent } from "@/app/dashboard/projects/[id]/actions";

interface EditableCaseStudyProps {
  caseStudy: any;
}

export function EditableCaseStudy({
  caseStudy: initialCaseStudy,
}: EditableCaseStudyProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [caseStudy, setCaseStudy] = useState(initialCaseStudy);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateCaseStudyContent(caseStudy.id, {
        title: caseStudy.title,
        summary: caseStudy.summary,
        clientName: caseStudy.clientName,
        clientIndustry: caseStudy.clientIndustry,
        challenge: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        keyQuotes: caseStudy.keyQuotes,
        metrics: caseStudy.metrics,
        keyTakeaways: caseStudy.keyTakeaways,
      });

      if (result.success) {
        setIsEditing(false);
        toast("Success", {
          description: "Case study updated successfully",
        });
        router.refresh();
      } else {
        toast("Error", {
          description: result.error || "Failed to save changes",
        });
      }
    } catch (error) {
      toast("Error", {
        description: "Failed to save changes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseStudy.publicSlug || "case-study"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${caseStudy.publicSlug || "case-study"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateMarkdown = () => {
    return `# ${caseStudy.title}

${caseStudy.summary}

## Client Information
- **Company:** ${caseStudy.clientName || "N/A"}
- **Industry:** ${caseStudy.clientIndustry || "N/A"}

## The Challenge

${caseStudy.challenge}

## The Solution

${caseStudy.solution}

## The Results

${caseStudy.results}

${
  caseStudy.metrics && caseStudy.metrics.length > 0
    ? `
## Key Metrics

${caseStudy.metrics
  .map((m: any) => `- **${m.metric}**\n  > "${m.quote}"`)
  .join("\n\n")}
`
    : ""
}

${
  caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0
    ? `
## Customer Quotes

${caseStudy.keyQuotes.map((q: string) => `> "${q}"`).join("\n\n")}
`
    : ""
}

${
  caseStudy.keyTakeaways && caseStudy.keyTakeaways.length > 0
    ? `
## Key Takeaways

${caseStudy.keyTakeaways
  .map((t: string, i: number) => `${i + 1}. ${t}`)
  .join("\n")}
`
    : ""
}

---
*Generated with Casevia*
`;
  };

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${caseStudy.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; }
        h2 { font-size: 1.8em; margin-top: 1.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        .summary { font-size: 1.2em; color: #666; margin-bottom: 2em; }
        .client-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 10px 0; }
        blockquote { border-left: 4px solid #667eea; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555; }
    </style>
</head>
<body>
    <h1>${caseStudy.title}</h1>
    <p class="summary">${caseStudy.summary}</p>
    
    <div class="client-info">
        <strong>Client:</strong> ${caseStudy.clientName || "N/A"}<br>
        <strong>Industry:</strong> ${caseStudy.clientIndustry || "N/A"}
    </div>
    
    <h2>The Challenge</h2>
    <p>${caseStudy.challenge}</p>
    
    <h2>The Solution</h2>
    <p>${caseStudy.solution}</p>
    
    <h2>The Results</h2>
    <p>${caseStudy.results}</p>
    
    ${
      caseStudy.metrics && caseStudy.metrics.length > 0
        ? `<h2>Key Metrics</h2>${caseStudy.metrics
            .map(
              (m: any) =>
                `<div class="metric"><strong>${m.metric}</strong><br><em>"${m.quote}"</em></div>`
            )
            .join("")}`
        : ""
    }
    
    ${
      caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0
        ? `<h2>Customer Quotes</h2>${caseStudy.keyQuotes
            .map((q: string) => `<blockquote>"${q}"</blockquote>`)
            .join("")}`
        : ""
    }
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-card rounded-lg border p-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setCaseStudy(initialCaseStudy);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-border hover:border-muted-foreground rounded-lg text-sm font-medium text-muted-foreground transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-border hover:border-muted-foreground rounded-lg text-sm font-medium text-foreground transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="px-4 py-2 border border-border hover:border-muted-foreground rounded-lg text-sm font-medium text-foreground transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Markdown
          </button>
          <button
            onClick={handleExportHTML}
            className="px-4 py-2 border border-border hover:border-muted-foreground rounded-lg text-sm font-medium text-foreground transition-colors flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            HTML
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl shadow-sm border p-8">
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={caseStudy.title}
                onChange={(e) =>
                  setCaseStudy({ ...caseStudy, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Summary
              </label>
              <textarea
                value={caseStudy.summary}
                onChange={(e) =>
                  setCaseStudy({ ...caseStudy, summary: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={caseStudy.clientName || ""}
                  onChange={(e) =>
                    setCaseStudy({ ...caseStudy, clientName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={caseStudy.clientIndustry || ""}
                  onChange={(e) =>
                    setCaseStudy({
                      ...caseStudy,
                      clientIndustry: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Challenge
              </label>
              <textarea
                value={caseStudy.challenge}
                onChange={(e) =>
                  setCaseStudy({ ...caseStudy, challenge: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Solution
              </label>
              <textarea
                value={caseStudy.solution}
                onChange={(e) =>
                  setCaseStudy({ ...caseStudy, solution: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Results
              </label>
              <textarea
                value={caseStudy.results}
                onChange={(e) =>
                  setCaseStudy({ ...caseStudy, results: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
              />
            </div>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <h1>{caseStudy.title}</h1>
            <p className="lead">{caseStudy.summary}</p>

            {(caseStudy.clientName || caseStudy.clientIndustry) && (
              <div className="not-prose bg-muted p-4 rounded-lg my-6">
                {caseStudy.clientName && (
                  <p>
                    <strong>Client:</strong> {caseStudy.clientName}
                  </p>
                )}
                {caseStudy.clientIndustry && (
                  <p>
                    <strong>Industry:</strong> {caseStudy.clientIndustry}
                  </p>
                )}
              </div>
            )}

            <h2>The Challenge</h2>
            <p className="whitespace-pre-wrap">{caseStudy.challenge}</p>

            <h2>The Solution</h2>
            <p className="whitespace-pre-wrap">{caseStudy.solution}</p>

            <h2>The Results</h2>
            <p className="whitespace-pre-wrap">{caseStudy.results}</p>

            {caseStudy.metrics && caseStudy.metrics.length > 0 && (
              <>
                <h2>Key Metrics</h2>
                <div className="not-prose space-y-4">
                  {caseStudy.metrics.map((metric: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {metric.metric}
                      </p>
                      <p className="text-sm italic text-muted-foreground">
                        "{metric.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {caseStudy.keyQuotes && caseStudy.keyQuotes.length > 0 && (
              <>
                <h2>Customer Quotes</h2>
                {caseStudy.keyQuotes.map((quote: string, idx: number) => (
                  <blockquote key={idx}>"{quote}"</blockquote>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
