import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validations";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { rateLimiter } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 login attempts per minute per IP
    const clientIp = rateLimiter.getClientIp(req);
    const limitResult = rateLimiter.check(`login:${clientIp}`, 10, 60 * 1000);

    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 60 seconds before retrying." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(limitResult.resetInMs / 1000).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { user, token } = await AuthService.login(validated.data);

    const response = NextResponse.json({
      message: "Login successful",
      user,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
