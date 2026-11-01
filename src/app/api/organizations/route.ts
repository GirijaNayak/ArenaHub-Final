import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/services/organization.service";
import { getSessionUser } from "@/lib/auth";
import { createOrgSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const organizations = await OrganizationService.list({ search, limit });
    return NextResponse.json({ organizations });
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
    const validated = createOrgSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const organization = await OrganizationService.create(session.userId, validated.data);
    return NextResponse.json({ message: "Organization created", organization }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
