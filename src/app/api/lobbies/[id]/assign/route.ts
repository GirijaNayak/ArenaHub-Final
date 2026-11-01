import { NextRequest, NextResponse } from "next/server";
import { LobbyService } from "@/services/lobby.service";
import { getSessionUser } from "@/lib/auth";
import { assignLobbyTeamSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    if (session.role === "PLAYER" || session.role === "SPECTATOR" || session.role === "TEAM_CAPTAIN") {
      return NextResponse.json(
        { error: "Forbidden: Only tournament organizers can assign teams to slots" },
        { status: 403 }
      );
    }

    const { id: lobbyId } = await params;
    const body = await req.json();
    const validated = assignLobbyTeamSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const assignment = await LobbyService.assignTeam(
      session.userId,
      lobbyId,
      validated.data
    );

    return NextResponse.json({ message: "Team assigned to lobby slot", assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
