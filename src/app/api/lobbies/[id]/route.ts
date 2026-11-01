import { NextRequest, NextResponse } from "next/server";
import { LobbyService } from "@/services/lobby.service";
import { getSessionUser } from "@/lib/auth";
import { updateLobbyCredentialsSchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    const { id } = await params;

    const lobby = await LobbyService.getLobbySecure(
      id,
      session?.userId,
      session?.role
    );

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    return NextResponse.json({ lobby });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateLobbyCredentialsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await LobbyService.updateCredentials(
      session.userId,
      id,
      validated.data
    );

    return NextResponse.json({ message: "Lobby updated successfully", lobby: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
