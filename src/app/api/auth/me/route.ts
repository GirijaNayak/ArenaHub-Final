import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { AuthService } from "@/services/auth.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const fullProfile = await AuthService.getProfile(session.userId);
    return NextResponse.json({ user: fullProfile }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
