import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament.service";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please sign in to register" }, { status: 401 });
    }

    const { slug } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const teamId = body?.teamId;

    const registration = await TournamentService.register(
      session.userId,
      tournament.id,
      teamId
    );

    return NextResponse.json(
      { message: "Successfully registered for tournament", registration },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
