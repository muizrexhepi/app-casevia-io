// lib/export-utils.ts
import jsPDF from "jspdf";

export interface CaseStudyData {
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
  publicSlug?: string | null;
}

/**
 * Generate Markdown export from case study data
 */
export function generateMarkdown(
  data: CaseStudyData,
  includeBranding: boolean = true
): string {
  let markdown = `# ${data.title}\n\n`;
  markdown += `${data.summary}\n\n`;

  // Client Info
  if (data.clientName || data.clientIndustry) {
    markdown += `## Client Information\n\n`;
    if (data.clientName) markdown += `- **Company:** ${data.clientName}\n`;
    if (data.clientIndustry)
      markdown += `- **Industry:** ${data.clientIndustry}\n`;
    markdown += `\n`;
  }

  // Challenge
  markdown += `## The Challenge\n\n${data.challenge}\n\n`;

  // Solution
  markdown += `## The Solution\n\n${data.solution}\n\n`;

  // Results
  markdown += `## The Results\n\n${data.results}\n\n`;

  // Key Metrics
  if (data.metrics && data.metrics.length > 0) {
    markdown += `## Key Metrics\n\n`;
    data.metrics.forEach((m) => {
      markdown += `- **${m.metric}**\n  > "${m.quote}"\n\n`;
    });
  }

  // Customer Quotes
  if (data.keyQuotes && data.keyQuotes.length > 0) {
    markdown += `## Customer Quotes\n\n`;
    data.keyQuotes.forEach((q) => {
      markdown += `> "${q}"\n\n`;
    });
  }

  // Key Takeaways
  if (data.keyTakeaways && data.keyTakeaways.length > 0) {
    markdown += `## Key Takeaways\n\n`;
    data.keyTakeaways.forEach((t, i) => {
      markdown += `${i + 1}. ${t}\n`;
    });
    markdown += `\n`;
  }

  // Branding
  if (includeBranding) {
    markdown += `---\n*Generated with Casevia*\n`;
  }

  return markdown;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate HTML export with inline CSS
 */
export function generateHTML(
  data: CaseStudyData,
  includeBranding: boolean = true
): string {
  const escapeAndFormat = (text: string) => {
    return escapeHtml(text)
      .split("\n")
      .map((line) => `<p>${line || "&nbsp;"}</p>`)
      .join("");
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.title)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
            line-height: 1.7;
            color: #1f2937;
            background: #ffffff;
            padding: 48px 24px;
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            font-size: 2.5em;
            font-weight: 800;
            margin-bottom: 0.5em;
            color: #111827;
            line-height: 1.2;
        }
        h2 {
            font-size: 1.75em;
            font-weight: 700;
            margin-top: 1.5em;
            margin-bottom: 0.75em;
            color: #1f2937;
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 0.3em;
        }
        p {
            margin-bottom: 1.25em;
            font-size: 1.05em;
            color: #374151;
        }
        .summary {
            font-size: 1.25em;
            color: #4b5563;
            margin-bottom: 2em;
            font-weight: 400;
            line-height: 1.6;
        }
        .client-info {
            background: linear-gradient(to right, #f9fafb, #f3f4f6);
            padding: 24px;
            border-radius: 12px;
            margin: 24px 0;
            border-left: 4px solid #3b82f6;
        }
        .client-info p {
            margin-bottom: 8px;
            font-size: 0.95em;
        }
        .client-info strong {
            color: #1f2937;
            font-weight: 600;
        }
        .metric {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            border-radius: 12px;
            margin: 16px 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .metric-value {
            font-size: 1.75em;
            font-weight: 700;
            margin-bottom: 12px;
        }
        .metric-quote {
            font-style: italic;
            opacity: 0.95;
            font-size: 0.95em;
        }
        blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 24px;
            margin: 20px 0;
            font-style: italic;
            color: #4b5563;
            font-size: 1.05em;
        }
        ul {
            margin: 16px 0;
            padding-left: 24px;
        }
        li {
            margin-bottom: 12px;
            color: #374151;
        }
        .section {
            margin-bottom: 2em;
        }
        .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 0.875em;
        }
        @media print {
            body { padding: 24px; }
            .metric { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(data.title)}</h1>
    <p class="summary">${escapeHtml(data.summary)}</p>
    
    ${
      data.clientName || data.clientIndustry
        ? `<div class="client-info">
        ${
          data.clientName
            ? `<p><strong>Client:</strong> ${escapeHtml(data.clientName)}</p>`
            : ""
        }
        ${
          data.clientIndustry
            ? `<p><strong>Industry:</strong> ${escapeHtml(
                data.clientIndustry
              )}</p>`
            : ""
        }
    </div>`
        : ""
    }
    
    <div class="section">
        <h2>The Challenge</h2>
        ${escapeAndFormat(data.challenge)}
    </div>
    
    <div class="section">
        <h2>The Solution</h2>
        ${escapeAndFormat(data.solution)}
    </div>
    
    <div class="section">
        <h2>The Results</h2>
        ${escapeAndFormat(data.results)}
    </div>
    
    ${
      data.metrics && data.metrics.length > 0
        ? `<div class="section">
        <h2>Key Metrics</h2>
        ${data.metrics
          .map(
            (m) =>
              `<div class="metric">
            <div class="metric-value">${escapeHtml(m.metric)}</div>
            <div class="metric-quote">"${escapeHtml(m.quote)}"</div>
        </div>`
          )
          .join("")}
    </div>`
        : ""
    }
    
    ${
      data.keyQuotes && data.keyQuotes.length > 0
        ? `<div class="section">
        <h2>Customer Quotes</h2>
        ${data.keyQuotes
          .map((q) => `<blockquote>"${escapeHtml(q)}"</blockquote>`)
          .join("")}
    </div>`
        : ""
    }
    
    ${
      data.keyTakeaways && data.keyTakeaways.length > 0
        ? `<div class="section">
        <h2>Key Takeaways</h2>
        <ul>
            ${data.keyTakeaways
              .map((t) => `<li>${escapeHtml(t)}</li>`)
              .join("")}
        </ul>
    </div>`
        : ""
    }
    
    ${includeBranding ? '<div class="footer">Generated with Casevia</div>' : ""}
</body>
</html>`;
}

/**
 * Download a file to the user's device
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF using jsPDF
 */
export async function generatePDF(
  data: CaseStudyData,
  includeBranding: boolean = true
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Title
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  const titleLines = pdf.splitTextToSize(data.title, contentWidth);
  checkPageBreak(titleLines.length * 10);
  pdf.text(titleLines, margin, yPos);
  yPos += titleLines.length * 10 + 8;

  // Summary
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 100, 100);
  const summaryLines = pdf.splitTextToSize(data.summary, contentWidth);
  checkPageBreak(summaryLines.length * 7);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 7 + 10;

  // Client Info Box
  if (data.clientName || data.clientIndustry) {
    const boxHeight = 25;
    checkPageBreak(boxHeight);
    pdf.setFillColor(249, 250, 251);
    pdf.rect(margin, yPos - 5, contentWidth, boxHeight, "F");
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    if (data.clientName) {
      pdf.text(`Client: ${data.clientName}`, margin + 5, yPos);
      yPos += 7;
    }
    if (data.clientIndustry) {
      pdf.text(`Industry: ${data.clientIndustry}`, margin + 5, yPos);
      yPos += 7;
    }
    yPos += 8;
  }

  // Helper to add section
  const addSection = (title: string, content: string) => {
    checkPageBreak(20);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, margin, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(50, 50, 50);
    const contentLines = pdf.splitTextToSize(content, contentWidth);

    contentLines.forEach((line: string) => {
      checkPageBreak(7);
      pdf.text(line, margin, yPos);
      yPos += 7;
    });
    yPos += 5;
  };

  // Sections
  addSection("The Challenge", data.challenge);
  addSection("The Solution", data.solution);
  addSection("The Results", data.results);

  // Metrics
  if (data.metrics && data.metrics.length > 0) {
    checkPageBreak(15);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Key Metrics", margin, yPos);
    yPos += 10;

    data.metrics.forEach((metric) => {
      const metricHeight = 25;
      checkPageBreak(metricHeight);

      pdf.setFillColor(102, 126, 234);
      pdf.rect(margin, yPos - 5, contentWidth, metricHeight, "F");

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text(metric.metric, margin + 5, yPos);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      const quoteLines = pdf.splitTextToSize(
        `"${metric.quote}"`,
        contentWidth - 10
      );
      pdf.text(quoteLines, margin + 5, yPos + 6);

      yPos += metricHeight + 5;
    });
  }

  // Customer Quotes
  if (data.keyQuotes && data.keyQuotes.length > 0) {
    checkPageBreak(15);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Customer Quotes", margin, yPos);
    yPos += 10;

    data.keyQuotes.forEach((quote) => {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(75, 85, 99);
      const quoteLines = pdf.splitTextToSize(`"${quote}"`, contentWidth - 10);

      checkPageBreak(quoteLines.length * 7 + 5);

      // Draw left border
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.line(margin, yPos - 3, margin, yPos + quoteLines.length * 7);

      pdf.text(quoteLines, margin + 5, yPos);
      yPos += quoteLines.length * 7 + 8;
    });
  }

  // Key Takeaways
  if (data.keyTakeaways && data.keyTakeaways.length > 0) {
    checkPageBreak(15);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Key Takeaways", margin, yPos);
    yPos += 10;

    data.keyTakeaways.forEach((takeaway, idx) => {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);
      const takeawayLines = pdf.splitTextToSize(
        `${idx + 1}. ${takeaway}`,
        contentWidth - 5
      );

      checkPageBreak(takeawayLines.length * 7);
      pdf.text(takeawayLines, margin, yPos);
      yPos += takeawayLines.length * 7 + 3;
    });
  }

  // Branding
  if (includeBranding) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(150, 150, 150);
    pdf.text("Generated with Casevia", pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  return pdf.output("blob");
}
