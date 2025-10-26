// app/dashboard/projects/[id]/transcript/transcript-view.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Search,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranscriptViewProps {
  project: any;
}

export function TranscriptView({ project }: TranscriptViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Parse speaker labels
  const utterances = project.speakerLabels || [];
  const hasUtterances = utterances.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(project.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([project.transcript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${project.title}-transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadJSON = () => {
    const data = {
      title: project.title,
      transcript: project.transcript,
      utterances: utterances,
      duration: project.durationSeconds,
      createdAt: project.createdAt,
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = `${project.title}-transcript.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredUtterances = hasUtterances
    ? utterances.filter((u: any) =>
        u.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Transcript
              </h1>
              <p className="text-muted-foreground">{project.title}</p>
            </div>

            <div className="flex gap-2">
              <Button size={"lg"} variant={"outline"} onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>

              <Button size={"lg"} variant={"outline"} onClick={handleDownload}>
                <Download className="w-4 h-4" />
                Download TXT
              </Button>

              {hasUtterances && (
                <Button
                  size="lg"
                  variant={"outline"}
                  onClick={handleDownloadJSON}
                >
                  <Download className="w-4 h-4" />
                  Download JSON
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Duration</p>
            <p className="text-lg font-semibold text-foreground">
              {Math.floor((project.durationSeconds || 0) / 60)} minutes
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Word Count</p>
            <p className="text-lg font-semibold text-foreground">
              {project.transcript.split(/\s+/).length.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Speakers</p>
            <p className="text-lg font-semibold text-foreground">
              {hasUtterances
                ? new Set(utterances.map((u: any) => u.speaker)).size
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Search */}
        {hasUtterances && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Transcript Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {hasUtterances ? (
            <div className="space-y-6">
              {(searchTerm ? filteredUtterances : utterances).map(
                (utterance: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {utterance.speaker}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          Speaker {utterance.speaker}
                        </span>
                        {utterance.start && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(utterance.start)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {utterance.text}
                      </p>
                    </div>
                  </div>
                )
              )}

              {searchTerm && filteredUtterances.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-muted-foreground">
                    No results found for "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="prose max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {project.transcript}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() =>
              router.push(`/dashboard/projects/${project.id}/case-study`)
            }
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            View Case Study →
          </button>
        </div>
      </div>
    </div>
  );
}
