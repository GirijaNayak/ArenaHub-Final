import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/services/organization.service";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setOrgMemberRoleSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    const { slug } = await params;
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (org.status === "SUSPENDED") {
      return NextResponse.json({ error: "Forbidden: This organization is currently suspended" }, { status: 403 });
    }

    const body = await req.json();
    const validated = setOrgMemberRoleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validated.data.usernameOrEmail.toLowerCase() },
          { email: validated.data.usernameOrEmail.toLowerCase() },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const membership = await OrganizationService.setMemberRole(
      session.userId,
      org.id,
      targetUser.id,
      validated.data.role
    );

    return NextResponse.json({ message: "Staff role assigned successfully", membership });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
