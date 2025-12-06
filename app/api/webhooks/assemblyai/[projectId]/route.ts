// app/api/webhooks/assemblyai/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { project, user } from "@/lib/auth/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import CaseStudyReadyEmail from "@/components/emails/case-study-ready";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;

    // 1. Verify webhook authenticity (AssemblyAI doesn't send a secret by default,
    //    but you can verify the request came from their IPs or use a custom token)
    // For now, we'll just log the origin
    console.log("📥 Webhook received from:", request.headers.get("origin"));
    console.log("📦 Project ID:", projectId);

    const webhookData = await request.json();
    console.log("📊 Status:", webhookData.status);

    // 2. Get project data
    const [projectData] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId));

    if (!projectData) {
      console.error("❌ Project not found:", projectId);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Handle completion
    if (webhookData.status === "completed") {
      console.log("✅ Transcription completed");

      // Save transcript
      await db
        .update(project)
        .set({
          status: "analyzing",
          transcript: webhookData.text,
          speakerLabels: webhookData.utterances || [],
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      console.log("💾 Transcript saved");

      // Trigger analysis in background (fire and forget)
      triggerAnalysis(projectId);

      // Optionally: Send "processing started" email
      await sendProcessingEmail(projectData.userId, "transcription_complete");

      return NextResponse.json({
        success: true,
        message: "Transcription saved, analysis queued",
      });
    }

    // 4. Handle error
    if (webhookData.status === "error") {
      console.error("❌ Transcription failed:", webhookData.error);

      await db
        .update(project)
        .set({
          status: "failed",
          errorMessage: webhookData.error || "Transcription failed",
          updatedAt: new Date(),
        })
        .where(eq(project.id, projectId));

      // Send error notification
      await sendProcessingEmail(projectData.userId, "transcription_failed");

      return NextResponse.json({
        success: true,
        message: "Error status saved",
      });
    }

    // 5. Still processing
    console.log("⏳ Still processing...");
    return NextResponse.json({
      success: true,
      message: "Processing",
    });
  } catch (error) {
    console.error("💥 Webhook error:", error);

    // IMPORTANT: Return 200 even on error so AssemblyAI doesn't retry
    // We log the error but don't want endless retries
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 200 } // Changed from 500
    );
  }
}

// Helper: Trigger analysis (non-blocking)
async function triggerAnalysis(projectId: string) {
  try {
    console.log("🎯 Triggering analysis for:", projectId);

    // Fire and forget - don't await
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": process.env.INTERNAL_API_SECRET!, // Verify internal calls
        },
      }
    ).catch((err) => {
      console.error("Analysis trigger failed:", err);
      // Could add to a dead letter queue or retry logic here
    });
  } catch (error) {
    console.error("Failed to trigger analysis:", error);
  }
}

// Helper: Send status update emails
async function sendProcessingEmail(userId: string, type: string) {
  try {
    const [userData] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId));

    if (!userData?.email) return;

    if (type === "transcription_complete") {
      // Optional: Let user know transcription is done, analysis starting
      // Most users don't need this email
    } else if (type === "transcription_failed") {
      await resend.emails.send({
        from: `Casevia <${process.env.RESEND_FROM_EMAIL}>`,
        to: userData.email,
        subject: "⚠️ Project Processing Failed",
        html: `
          <div>
            <h2>Your project processing failed</h2>
            <p>We encountered an error while transcribing your audio file.</p>
            <p>Please try uploading again or contact support if the issue persists.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects">View Projects</a>
          </div>
        `,
      });
    }
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}
