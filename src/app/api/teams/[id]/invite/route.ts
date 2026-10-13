import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/services/team.service";
import { getSessionUser } from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body = await req.json();
    const validated = inviteMemberSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const invite = await TeamService.invitePlayer(
      session.userId,
      teamId,
      validated.data.usernameOrEmail
    );

    return NextResponse.json(
      { message: "Invitation sent successfully", invite },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
