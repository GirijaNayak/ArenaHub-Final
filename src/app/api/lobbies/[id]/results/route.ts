import { NextRequest, NextResponse } from "next/server";
import { LobbyService } from "@/services/lobby.service";
import { getSessionUser } from "@/lib/auth";
import { submitLobbyResultSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: lobbyId } = await params;
    const body = await req.json();
    const validated = submitLobbyResultSchema.safeParse({ ...body, lobbyId });

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await LobbyService.submitResult(session.userId, validated.data);
    return NextResponse.json({ message: "Match result submitted", result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
