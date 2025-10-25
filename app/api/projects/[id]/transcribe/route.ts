// app/api/projects/[id]/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";

const ASSEMBLY_AI_API_KEY = process.env.ASSEMBLY_AI_API_KEY!;
const ASSEMBLY_AI_BASE_URL = "https://api.assemblyai.com/v2";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // 1. Get project from database
    const [projectData] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId));

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!projectData.fileUrl) {
      return NextResponse.json({ error: "No file URL found" }, { status: 400 });
    }

    // 2. Submit to AssemblyAI for transcription
    const transcriptResponse = await fetch(
      `${ASSEMBLY_AI_BASE_URL}/transcript`,
      {
        method: "POST",
        headers: {
          Authorization: ASSEMBLY_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: projectData.fileUrl,
          speaker_labels: true, // Enable speaker diarization
          auto_highlights: true, // Detect key moments
          sentiment_analysis: true, // Optional: analyze sentiment
          entity_detection: true, // Optional: detect names, companies
        }),
      }
    );

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.json();
      console.error("AssemblyAI error:", error);

      await db
        .update(project)
        .set({
          status: "failed",
          errorMessage: "Failed to start transcription",
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      return NextResponse.json(
        { error: "Failed to start transcription" },
        { status: 500 }
      );
    }

    const { id: assemblyAiId } = await transcriptResponse.json();

    // 3. Update project with AssemblyAI ID
    await db
      .update(project)
      .set({
        assemblyAiId,
        status: "transcribing",
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    // 4. Poll for completion (in background)
    pollTranscriptionStatus(projectId, assemblyAiId);

    return NextResponse.json({
      success: true,
      assemblyAiId,
      message: "Transcription started",
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Poll AssemblyAI for transcription completion
async function pollTranscriptionStatus(
  projectId: string,
  assemblyAiId: string,
  maxAttempts = 120 // 10 minutes with 5-second intervals
) {
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;

      // Get transcription status
      const response = await fetch(
        `${ASSEMBLY_AI_BASE_URL}/transcript/${assemblyAiId}`,
        {
          headers: {
            Authorization: ASSEMBLY_AI_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transcription status");
      }

      const data = await response.json();

      if (data.status === "completed") {
        // Transcription complete - save to database
        await db
          .update(project)
          .set({
            status: "analyzing",
            transcript: data.text,
            speakerLabels: data.utterances || [],
            updatedAt: new Date(),
          })
          .where(eq(project.id, projectId));

        // Trigger GPT-4o analysis
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/analyze`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        return;
      } else if (data.status === "error") {
        // Transcription failed
        await db
          .update(project)
          .set({
            status: "failed",
            errorMessage: data.error || "Transcription failed",
            updatedAt: new Date(),
          })
          .where(eq(project.id, projectId));

        return;
      }

      // Still processing - poll again
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000); // Poll every 5 seconds
      } else {
        // Timeout
        await db
          .update(project)
          .set({
            status: "failed",
            errorMessage: "Transcription timeout",
            updatedAt: new Date(),
          })
          .where(eq(project.id, projectId));
      }
    } catch (error) {
      console.error("Polling error:", error);

      await db
        .update(project)
        .set({
          status: "failed",
          errorMessage: "Failed to check transcription status",
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));
    }
  };

  // Start polling
  poll();
}
