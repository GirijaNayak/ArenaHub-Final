import { NextRequest, NextResponse } from "next/server";
import { LobbyService } from "@/services/lobby.service";
import { getSessionUser } from "@/lib/auth";
import { verifyLobbyResultSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: resultId } = await params;
    const body = await req.json();
    const validated = verifyLobbyResultSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await LobbyService.verifyResult(session.userId, resultId, validated.data);
    return NextResponse.json({ message: "Result verified and updated", result: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
