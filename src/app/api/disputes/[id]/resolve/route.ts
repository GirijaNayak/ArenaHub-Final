import { NextRequest, NextResponse } from "next/server";
import { DisputeService } from "@/services/dispute.service";
import { getSessionUser } from "@/lib/auth";
import { resolveDisputeSchema } from "@/lib/validations";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    if (session.role === "PLAYER" || session.role === "SPECTATOR" || session.role === "TEAM_CAPTAIN") {
      return NextResponse.json(
        { error: "Forbidden: Only tournament referees or organizers can adjudicate disputes" },
        { status: 403 }
      );
    }

    const { id: disputeId } = await params;
    const body = await req.json();
    const validated = resolveDisputeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const resolved = await DisputeService.resolveDispute(
      session.userId,
      disputeId,
      validated.data
    );

    return NextResponse.json({ message: "Dispute decision recorded", dispute: resolved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
