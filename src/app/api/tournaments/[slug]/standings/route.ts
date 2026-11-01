import { NextRequest, NextResponse } from "next/server";
import { StandingsService } from "@/services/standings.service";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const standings = await StandingsService.getTournamentStandings(tournament.id);
    return NextResponse.json({ standings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
