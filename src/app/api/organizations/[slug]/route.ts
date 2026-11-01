import { NextRequest, NextResponse } from "next/server";
import { OrganizationService } from "@/services/organization.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const organization = await OrganizationService.getBySlug(slug);

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
