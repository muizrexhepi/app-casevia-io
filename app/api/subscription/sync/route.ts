import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { syncPlanWithDB } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user || !session.session.activeOrganizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    const orgId = session.session.activeOrganizationId;

    await syncPlanWithDB(orgId, planId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync subscription error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
