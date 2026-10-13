import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, signSessionToken, SessionPayload } from "@/lib/auth";
import { z } from "zod";
import { registerSchema, loginSchema, updateProfileSchema } from "@/lib/validations";

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new Error("An account with this email address already exists");
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase() },
    });
    if (existingUsername) {
      throw new Error("This username is already taken");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role || "PLAYER",
      },
    });

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as "PLAYER" | "ORGANIZER" | "ADMIN",
    };

    const token = await signSessionToken(sessionPayload);

    // Create initial welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to ArenaHub!",
        message: "Your competitive journey starts here. Explore tournaments, join teams, and compete.",
        type: "SYSTEM",
        linkUrl: "/tournaments",
      },
    });

    return { user: sessionPayload, token };
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as "PLAYER" | "ORGANIZER" | "ADMIN",
    };

    const token = await signSessionToken(sessionPayload);
    return { user: sessionPayload, token };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        region: true,
        preferredGame: true,
        discordTag: true,
        createdAt: true,
        teamsLed: {
          select: { id: true, name: true, tag: true, logoUrl: true, game: true },
        },
        teamMemberships: {
          include: {
            team: {
              include: { game: true },
            },
          },
        },
        registrations: {
          include: {
            tournament: {
              include: { game: true },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    return user;
  }

  static async updateProfile(userId: string, data: z.infer<typeof updateProfileSchema>) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.region && { region: data.region }),
        ...(data.preferredGame !== undefined && { preferredGame: data.preferredGame }),
        ...(data.discordTag !== undefined && { discordTag: data.discordTag }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        bio: true,
        region: true,
        preferredGame: true,
        discordTag: true,
      },
    });

    return updated;
  }

  static async getPublicPlayerProfile(username: string) {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        bio: true,
        region: true,
        preferredGame: true,
        createdAt: true,
        teamMemberships: {
          include: {
            team: {
              include: { game: true },
            },
          },
        },
        registrations: {
          include: {
            tournament: {
              include: { game: true },
            },
          },
          take: 10,
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    return user;
  }
}
