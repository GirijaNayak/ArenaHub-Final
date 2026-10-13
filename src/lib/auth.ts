import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "arenahub_session";
const JWT_SECRET =
  process.env.AUTH_SECRET || "arenahub-super-secret-development-key-32-chars-long!";

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  name: string;
  role: "PLAYER" | "ORGANIZER" | "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export function requireRole(
  user: SessionPayload | null,
  allowedRoles: Array<"PLAYER" | "ORGANIZER" | "ADMIN">
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true; // Admins have super-user privileges
  return allowedRoles.includes(user.role);
}
