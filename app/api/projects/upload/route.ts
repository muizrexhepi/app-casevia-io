// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { canUploadFile, incrementUsage } from "@/lib/limits";
import { nanoid } from "nanoid";

const ASSEMBLY_AI_API_KEY = process.env.ASSEMBLY_AI_API_KEY!;
const ASSEMBLY_AI_BASE_URL = "https://api.assemblyai.com/v2";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const organizationId = session.session.activeOrganizationId;

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate file type
    const validTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload video or audio files." },
        { status: 400 }
      );
    }

    // 4. Get file metadata
    const fileSizeMB = Math.ceil(file.size / (1024 * 1024));
    const durationMinutes = Number(formData.get("duration")) || 0;

    // 5. Check plan limits
    const limitCheck = await canUploadFile(
      organizationId,
      fileSizeMB,
      durationMinutes
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          limitType: limitCheck.limitType,
        },
        { status: 403 }
      );
    }

    console.log("Uploading file directly to AssemblyAI...");

    // 6. Upload directly to AssemblyAI (no storage)
    const fileBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(`${ASSEMBLY_AI_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: ASSEMBLY_AI_API_KEY,
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error("AssemblyAI upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file to transcription service" },
        { status: 500 }
      );
    }

    const { upload_url } = await uploadResponse.json();
    console.log("File uploaded to AssemblyAI:", upload_url);

    // 7. Create project record (without storing file)
    const projectId = nanoid();
    await db.insert(project).values({
      id: projectId,
      organizationId,
      userId,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      status: "transcribing",
      fileUrl: upload_url, // AssemblyAI URL (temporary)
      fileName: file.name,
      fileSize: file.size,
      durationSeconds: durationMinutes * 60,
    });

    // 8. Increment storage usage (for tracking)
    await incrementUsage(organizationId, fileSizeMB);

    // 9. Start transcription in background (don't await)
    startTranscriptionInBackground(projectId, upload_url);

    // 10. Return immediately to user
    return NextResponse.json({
      success: true,
      projectId,
      message: "File uploaded successfully. Transcription starting...",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Background function to start transcription and polling
async function startTranscriptionInBackground(
  projectId: string,
  audioUrl: string
) {
  try {
    console.log("Starting transcription for project:", projectId);

    // Start transcription
    const transcriptResponse = await fetch(
      `${ASSEMBLY_AI_BASE_URL}/transcript`,
      {
        method: "POST",
        headers: {
          Authorization: ASSEMBLY_AI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speaker_labels: true,
          auto_highlights: true,
          sentiment_analysis: true,
          entity_detection: true,
        }),
      }
    );

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.json();
      console.error("AssemblyAI transcription error:", error);

      // Update project to failed
      await db
        .update(project)
        .set({
          status: "failed",
          errorMessage: "Failed to start transcription",
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      return;
    }

    const { id: assemblyAiId } = await transcriptResponse.json();
    console.log("Transcription started with ID:", assemblyAiId);

    // Update project with AssemblyAI ID
    await db
      .update(project)
      .set({
        assemblyAiId,
        status: "transcribing",
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    // Start polling for completion
    pollTranscriptionStatus(projectId, assemblyAiId);
  } catch (error) {
    console.error("Background transcription error:", error);

    // Update project to failed
    await db
      .update(project)
      .set({
        status: "failed",
        errorMessage: "Failed to start transcription",
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));
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
        console.log("Transcription completed for project:", projectId);

        // Save transcript and trigger analysis
        await db
          .update(project)
          .set({
            status: "analyzing",
            transcript: data.text,
            speakerLabels: data.utterances || [],
            updatedAt: new Date(),
          })
          .where(eq(project.id, projectId));

        // Trigger case study generation
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/analyze`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        ).catch((err) => console.error("Failed to trigger analysis:", err));

        return;
      } else if (data.status === "error") {
        console.error("Transcription failed:", data.error);

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
        console.error("Transcription timeout for project:", projectId);

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

export const config = {
  api: {
    bodyParser: false,
  },
};
