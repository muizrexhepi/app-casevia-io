// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/drizzle";
import { project } from "@/lib/auth/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
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

    return NextResponse.json({
      success: true,
      project: projectData,
    });
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
