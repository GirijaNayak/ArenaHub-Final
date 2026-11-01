import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin(req);
    const metrics = await AdminService.getOverviewMetrics();
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Forbidden: Platform administrator credentials required" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}
