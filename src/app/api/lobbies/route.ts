import { NextRequest, NextResponse } from "next/server";
import { LobbyService } from "@/services/lobby.service";
import { getSessionUser } from "@/lib/auth";
import { createLobbySchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createLobbySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const lobby = await LobbyService.create(session.userId, validated.data);
    return NextResponse.json({ message: "Lobby created successfully", lobby }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
