import { NextRequest, NextResponse } from "next/server";
import { TeamService } from "@/services/team.service";
import { getSessionUser } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const teams = await TeamService.list({ search, limit });
    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Please sign in to create a team" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createTeamSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const team = await TeamService.create(session.userId, validated.data);
    return NextResponse.json(
      { message: "Squad team created successfully", team },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
