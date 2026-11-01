import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/services/organization.service";
import { getSessionUser, requirePlatformAdmin } from "@/lib/auth";
import { updateOrgStatusSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePlatformAdmin(req);
    const { id: organizationId } = await params;

    const body = await req.json();
    const validated = updateOrgStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await OrganizationService.updateStatus(
      session.userId,
      organizationId,
      validated.data.status
    );

    return NextResponse.json({
      message: `Organization status set to ${validated.data.status}`,
      organization: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
