import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/services/team.service";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: inviteId } = await params;
    const body = await req.json();
    const action = body?.action; // "ACCEPT" | "DECLINE"

    if (action !== "ACCEPT" && action !== "DECLINE") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'ACCEPT' or 'DECLINE'" },
        { status: 400 }
      );
    }

    const result = await TeamService.respondToInvite(session.userId, inviteId, action);
    return NextResponse.json({ message: `Invitation ${action.toLowerCase()}ed`, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
