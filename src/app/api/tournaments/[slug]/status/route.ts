import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament.service";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTournamentStatusSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = updateTournamentStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await TournamentService.updateStatus(
      session.userId,
      tournament.id,
      validated.data.status
    );

    return NextResponse.json({
      message: `Tournament status updated to ${validated.data.status}`,
      tournament: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
