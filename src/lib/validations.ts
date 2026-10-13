import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(25)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and dashes"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["PLAYER", "ORGANIZER"]).default("PLAYER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  region: z.enum(["NA", "EU", "APAC", "GLOBAL"]).optional(),
  preferredGame: z.string().max(50).optional(),
  discordTag: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const createTournamentSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  gameId: z.string().min(1, "Game selection is required"),
  type: z.enum(["SOLO", "TEAM"]).default("SOLO"),
  format: z.enum(["SINGLE_ELIMINATION"]).default("SINGLE_ELIMINATION"),
  maxParticipants: z.number().int().min(4).max(64),
  registrationDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  rulesText: z.string().min(10, "Rules text is required"),
  prizePool: z.number().int().min(0).default(0),
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

export const updateTournamentStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "UPCOMING",
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "ONGOING",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const registerTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  teamId: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(40),
  tag: z.string().min(2, "Tag must be 2-6 characters").max(6).toUpperCase(),
  gameId: z.string().min(1, "Game selection is required"),
  description: z.string().max(250).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const inviteMemberSchema = z.object({
  usernameOrEmail: z.string().min(3, "Username or email is required"),
});

export const reportMatchResultSchema = z.object({
  matchId: z.string().min(1),
  score1: z.number().int().min(0, "Score cannot be negative").max(100),
  score2: z.number().int().min(0, "Score cannot be negative").max(100),
  winnerId: z.string().min(1, "Winner must be specified"),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["PLAYER", "ORGANIZER", "ADMIN"]),
});
