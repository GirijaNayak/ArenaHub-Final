import { z } from "zod";

/**
 * Strict HTTP/HTTPS URL schema preventing javascript: or data: XSS payloads
 */
export const safeHttpUrlSchema = z
  .string()
  .refine(
    (url) => !url || /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(url),
    "URL must start with http:// or https://"
  )
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(25)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters, underscores, and dashes"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Security Hardening: Public self-registration only permits competitor/spectator roles.
  // Administrative & Referee roles can only be granted by org owners or platform admins.
  role: z
    .enum(["PLAYER", "TEAM_CAPTAIN", "SPECTATOR"])
    .default("PLAYER"),
  inGameId: z.string().optional(),
  inGameName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createOrgSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters").max(60),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(300).optional(),
  logoUrl: safeHttpUrlSchema,
});

export const updateOrgStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const setOrgMemberRoleSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  role: z.enum(["TOURNAMENT_ORGANIZER", "REFEREE", "MEMBER"]),
});

export const createTournamentSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  title: z.string().min(4, "Title must be at least 4 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  game: z.string().default("BGMI"),
  rules: z.string().min(10, "Rules must be specified"),
  teamCapacity: z.number().int().min(4).max(100).default(20),
  teamSize: z.number().int().min(1).max(5).default(4),
  scoringConfig: z.string().optional(), // JSON string
  registrationStart: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  registrationEnd: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  tournamentStart: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  tournamentEnd: z.string().optional(),
  prizePool: z.number().int().min(0).default(0),
  bannerUrl: safeHttpUrlSchema,
});

export const updateTournamentStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(40),
  tag: z
    .string()
    .min(2, "Tag must be 2-6 characters")
    .max(6)
    .regex(/^[a-zA-Z0-9]+$/, "Tag must be alphanumeric")
    .toUpperCase(),
  description: z.string().max(250).optional(),
  logoUrl: safeHttpUrlSchema,
  players: z
    .array(
      z.object({
        playerName: z.string().min(2, "IGN must be at least 2 characters"),
        inGameId: z.string().min(4, "Game ID must be at least 4 characters"),
        role: z.enum(["CAPTAIN", "PLAYER", "SUBSTITUTE"]).default("PLAYER"),
      })
    )
    .min(1, "Team must have at least 1 player")
    .max(5, "Max 5 players allowed (4 squad + 1 sub)"),
});

export const addTeamPlayerSchema = z.object({
  playerName: z.string().min(2, "IGN must be at least 2 characters"),
  inGameId: z.string().min(4, "Game ID must be at least 4 characters"),
  role: z.enum(["CAPTAIN", "PLAYER", "SUBSTITUTE"]).default("PLAYER"),
});

export const registerTeamTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  teamId: z.string().min(1),
});

export const createLobbySchema = z.object({
  tournamentId: z.string().min(1),
  lobbyNumber: z.number().int().min(1),
  title: z.string().min(3).max(80),
  mapName: z.enum(["Erangel", "Miramar", "Sanhok", "Vikendi"]).default("Erangel"),
  scheduledTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  revealTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  roomId: z.string().optional(),
  roomPassword: z.string().optional(),
});

export const updateLobbyCredentialsSchema = z.object({
  roomId: z.string().optional().or(z.literal("")),
  roomPassword: z.string().optional().or(z.literal("")),
  revealTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
  status: z
    .enum(["SCHEDULED", "ROOM_POSTED", "LIVE", "RESULTS_PENDING", "COMPLETED", "CANCELLED"])
    .optional(),
});

export const assignLobbyTeamSchema = z.object({
  teamId: z.string().min(1),
  slotNumber: z.number().int().min(1).max(25),
});

export const submitLobbyResultSchema = z.object({
  lobbyId: z.string().min(1),
  teamId: z.string().min(1),
  placement: z.number().int().min(1, "Placement must be at least 1").max(50),
  kills: z.number().int().min(0, "Kills cannot be negative"),
  screenshotUrl: safeHttpUrlSchema,
});

export const verifyLobbyResultSchema = z.object({
  placement: z.number().int().min(1).max(50),
  kills: z.number().int().min(0),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED", "DISPUTED"]).default("VERIFIED"),
});

export const createDisputeSchema = z.object({
  tournamentId: z.string().min(1),
  lobbyId: z.string().min(1),
  teamId: z.string().min(1),
  resultId: z.string().optional(),
  reason: z.enum([
    "INCORRECT_KILLS",
    "INCORRECT_PLACEMENT",
    "UNAUTHORIZED_PLAYER",
    "ROOM_TIMING_ISSUE",
    "OTHER",
  ]),
  description: z.string().min(10, "Please provide detailed context for your dispute"),
  evidenceUrl: safeHttpUrlSchema,
});

export const resolveDisputeSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  resolutionNotes: z.string().min(5, "Resolution notes are required for dispute moderation"),
  correctedPlacement: z.number().int().min(1).max(50).optional(),
  correctedKills: z.number().int().min(0).optional(),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    "PLAYER",
    "TEAM_CAPTAIN",
    "TOURNAMENT_ORGANIZER",
    "REFEREE",
    "SPECTATOR",
    "PLATFORM_ADMIN",
  ]),
});
