import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/services/organization.service";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await req.json();
    const { usernameOrEmail, role } = body;

    if (!usernameOrEmail || !role) {
      return NextResponse.json(
        { error: "usernameOrEmail and role ('TOURNAMENT_ORGANIZER' | 'REFEREE' | 'MEMBER') are required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase() },
          { email: usernameOrEmail.toLowerCase() },
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
      role
    );

    return NextResponse.json({ message: "Staff role assigned successfully", membership });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
