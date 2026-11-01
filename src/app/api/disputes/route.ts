import { NextRequest, NextResponse } from "next/server";
import { DisputeService } from "@/services/dispute.service";
import { getSessionUser } from "@/lib/auth";
import { createDisputeSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId") || undefined;
    const organizationId = searchParams.get("organizationId") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await DisputeService.listDisputes({
      tournamentId,
      organizationId,
      status,
      page,
      limit,
    });

    return NextResponse.json(data);
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
    const validated = createDisputeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dispute = await DisputeService.createDispute(session.userId, validated.data);
    return NextResponse.json({ message: "Dispute submitted to tournament referees", dispute }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
