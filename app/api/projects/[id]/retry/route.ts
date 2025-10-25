// app/api/projects/[id]/retry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.session.activeOrganizationId;
    const projectId = params.id;

    // Fetch project
    const [projectData] = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, organizationId)
        )
      );

    if (!projectData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (projectData.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed projects can be retried" },
        { status: 400 }
      );
    }

    // Reset project to transcribing status
    await db
      .update(project)
      .set({
        status: "transcribing",
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(project.id, projectId));

    // Trigger transcription again
    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/projects/${projectId}/transcribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    ).catch(console.error);

    // Fetch updated project
    const [updatedProject] = await db
      .select()
      .from(project)
      .where(eq(project.id, projectId));

    return NextResponse.json({
      success: true,
      project: updatedProject,
      message: "Processing restarted",
    });
  } catch (error) {
    console.error("Failed to retry project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
