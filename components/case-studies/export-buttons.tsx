"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileCode, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonsProps {
  caseStudy: any;
}

export function ExportButtons({ caseStudy }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const handleExport = async (type: "markdown" | "html" | "pdf") => {
    setIsExporting(true);
    setExportingType(type);

    try {
      const { generateMarkdown, generateHTML, generatePDF, downloadFile } =
        await import("@/lib/export-utils");

      const filename = caseStudy.publicSlug || "case-study";

      // Prepare case study data
      const caseStudyData = {
        title: caseStudy.title,
        summary: caseStudy.summary,
        clientName: caseStudy.clientName,
        clientIndustry: caseStudy.clientIndustry,
        challenge: caseStudy.challenge,
        solution: caseStudy.solution,
        results: caseStudy.results,
        metrics: safeParseJsonb(caseStudy.metrics),
        keyQuotes: safeParseJsonb(caseStudy.keyQuotes),
        keyTakeaways: safeParseJsonb(caseStudy.keyTakeaways),
        publicSlug: caseStudy.publicSlug,
      };

      if (type === "markdown") {
        const content = generateMarkdown(caseStudyData, false);
        downloadFile(content, `${filename}.md`, "text/markdown");
        toast.success("Markdown file downloaded!");
      } else if (type === "html") {
        const content = generateHTML(caseStudyData, false);
        downloadFile(content, `${filename}.html`, "text/html");
        toast.success("HTML file downloaded!");
      } else if (type === "pdf") {
        const blob = await generatePDF(caseStudyData, false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("PDF file downloaded!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Button
        variant="outline"
        onClick={() => handleExport("markdown")}
        disabled={isExporting}
        className="h-auto flex-col items-start p-4 gap-2"
      >
        {isExporting && exportingType === "markdown" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <FileText className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-semibold">Markdown</div>
          <div className="text-xs text-muted-foreground font-normal">
            Plain text with formatting
          </div>
        </div>
      </Button>

      <Button
        variant="outline"
        onClick={() => handleExport("html")}
        disabled={isExporting}
        className="h-auto flex-col items-start p-4 gap-2"
      >
        {isExporting && exportingType === "html" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <FileCode className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-semibold">HTML</div>
          <div className="text-xs text-muted-foreground font-normal">
            Styled web page
          </div>
        </div>
      </Button>

      <Button
        variant="outline"
        onClick={() => handleExport("pdf")}
        disabled={isExporting}
        className="h-auto flex-col items-start p-4 gap-2"
      >
        {isExporting && exportingType === "pdf" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-semibold">PDF</div>
          <div className="text-xs text-muted-foreground font-normal">
            Print-ready document
          </div>
        </div>
      </Button>
    </div>
  );
}

function safeParseJsonb(jsonb: any, defaultValue: any[] = []): any[] {
  if (!jsonb) return defaultValue;
  if (typeof jsonb === "object" && jsonb !== null) {
    return Array.isArray(jsonb) ? jsonb : defaultValue;
  }
  if (typeof jsonb === "string") {
    try {
      const parsed = JSON.parse(jsonb);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}
