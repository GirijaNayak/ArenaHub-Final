import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";
import { getSessionUser, requireRole } from "@/lib/auth";
import { updateUserRoleSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || !requireRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Forbidden: Admin credentials required" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await req.json();
    const validated = updateUserRoleSchema.safeParse({ userId: targetUserId, role: body?.role });

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await AdminService.updateUserRole(
      session.userId,
      targetUserId,
      validated.data.role
    );

    return NextResponse.json({ message: "User role updated successfully", user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
