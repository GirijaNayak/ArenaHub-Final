import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { requirePlatformAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin(req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await AdminService.listUsers({ search, role, page, limit });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Forbidden: Platform administrator credentials required" },
      { status: error.message?.includes("Unauthorized") ? 401 : 403 }
    );
  }
}
