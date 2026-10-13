import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { getSessionUser, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || !requireRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Forbidden: Admin credentials required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const result = await AdminService.getAuditLogs(page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
