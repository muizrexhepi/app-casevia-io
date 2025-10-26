// app/api/webhooks/assemblyai/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // 1. Verify webhook secret
    const authHeader = request.headers.get("X-Webhook-Secret");

    if (authHeader !== process.env.WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;
    const webhookData = await request.json();

    console.log("Webhook received for project:", projectId);
    console.log("Transcription status:", webhookData.status);

    // 2. Check if transcription succeeded
    if (webhookData.status === "completed") {
      console.log("Transcription completed, saving to database...");

      // Save transcript to database
      await db
        .update(project)
        .set({
          status: "analyzing",
          transcript: webhookData.text,
          speakerLabels: webhookData.utterances || [],
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      console.log("Transcript saved, triggering AI analysis...");

      // 3. Trigger AI analysis (async, don't wait)
      fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add a secret header for internal API calls
            "X-Internal-Secret": process.env.WEBHOOK_SECRET!,
          },
        }
      ).catch((error) => {
        console.error("Failed to trigger analysis:", error);
      });

      return NextResponse.json({
        success: true,
        message: "Transcript saved, analysis triggered",
      });
    } else if (webhookData.status === "error") {
      console.error("Transcription failed:", webhookData.error);

      // Handle error
      await db
        .update(project)
        .set({
          status: "failed",
          errorMessage: webhookData.error || "Transcription failed",
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      return NextResponse.json({
        success: true,
        message: "Error status saved",
      });
    }

    // Still processing
    console.log("Transcription still processing...");
    return NextResponse.json({
      success: true,
      message: "Status acknowledged",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
