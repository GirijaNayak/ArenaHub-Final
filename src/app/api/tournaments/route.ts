import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament.service";
import { getSessionUser } from "@/lib/auth";
import { createTournamentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const game = searchParams.get("game") || undefined;
    const status = searchParams.get("status") || undefined;
    const organizationId = searchParams.get("organizationId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await TournamentService.list({
      search,
      game,
      status,
      organizationId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTournamentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const tournament = await TournamentService.create(session.userId, validated.data);
    return NextResponse.json({ message: "Tournament created successfully", tournament }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
