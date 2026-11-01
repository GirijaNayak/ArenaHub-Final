import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { registerSchema } from "@/lib/validations";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 registration attempts per minute per IP
    const clientIp = rateLimiter.getClientIp(req);
    const limitResult = rateLimiter.check(`register:${clientIp}`, 5, 60 * 1000);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many accounts created from this IP. Please wait before retrying." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(limitResult.resetInMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user, token } = await AuthService.register(validated.data);

    const response = NextResponse.json(
      { message: "Registration successful", user },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during registration" },
      { status: 400 }
    );
  }
}
