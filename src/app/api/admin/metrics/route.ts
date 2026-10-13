import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { getSessionUser, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !requireRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Forbidden: Admin credentials required" }, { status: 403 });
    }

    const metrics = await AdminService.getOverviewMetrics();
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
