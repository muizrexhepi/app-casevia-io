import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project, planLimits } from "@/lib/auth/schema";
import { canUploadFile, incrementUsage } from "@/lib/limits";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const durationMinutes = Number(formData.get("duration")) || 0; // Sent from frontend

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

    // 6. Generate unique file path
    const projectId = nanoid();
    const fileExt = file.name.split(".").pop();
    const fileName = `${organizationId}/${projectId}.${fileExt}`;

    // 7. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("case-study-files")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // 8. Get public URL
    const { data: urlData } = supabase.storage
      .from("case-study-files")
      .getPublicUrl(fileName);

    // 9. Create project record
    await db.insert(project).values({
      id: projectId,
      organizationId,
      userId,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      status: "transcribing",
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      durationSeconds: durationMinutes * 60,
    });

    // 10. Increment usage
    await incrementUsage(organizationId, fileSizeMB);

    // 11. Trigger transcription (async - don't wait)
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/transcribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    ).catch(console.error);

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

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file upload
  },
};
