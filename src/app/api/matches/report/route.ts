import { NextRequest, NextResponse } from "next/server";
import { MatchService } from "@/services/match.service";
import { getSessionUser } from "@/lib/auth";
import { reportMatchResultSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = reportMatchResultSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedMatch = await MatchService.reportResult(
      session.userId,
      session.role,
      validated.data
    );

    return NextResponse.json({
      message: "Match result successfully reported and verified",
      match: updatedMatch,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
