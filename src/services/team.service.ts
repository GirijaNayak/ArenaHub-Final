import { prisma } from "@/lib/db";
import { z } from "zod";
import { createTeamSchema } from "@/lib/validations";

export class TeamService {
  static async create(userId: string, data: z.infer<typeof createTeamSchema>) {
    // Check if team tag already exists for this game
    const existing = await prisma.team.findFirst({
      where: {
        tag: data.tag.toUpperCase(),
        gameId: data.gameId,
      },
    });

    if (existing) {
      throw new Error("A team with this tag already exists for this game");
    }

    const team = await prisma.team.create({
      data: {
        name: data.name,
        tag: data.tag.toUpperCase(),
        gameId: data.gameId,
        captainId: userId,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        members: {
          create: {
            userId,
            role: "CAPTAIN",
          },
        },
      },
      include: {
        game: true,
        captain: {
          select: { id: true, name: true, username: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return team;
  }

  static async list({
    gameSlug,
    search,
    limit = 12,
  }: {
    gameSlug?: string;
    search?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (gameSlug) {
      where.game = { slug: gameSlug };
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tag: { contains: search } },
      ];
    }

    return prisma.team.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        game: true,
        captain: { select: { id: true, name: true, username: true } },
        _count: { select: { members: true, tournamentRegistrations: true } },
      },
    });
  }

  static async getById(teamId: string) {
    return prisma.team.findUnique({
      where: { id: teamId },
      include: {
        game: true,
        captain: { select: { id: true, name: true, username: true, avatarUrl: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatarUrl: true, role: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        invites: {
          include: {
            invitee: { select: { id: true, name: true, username: true } },
          },
        },
        tournamentRegistrations: {
          include: {
            tournament: {
              include: { game: true },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });
  }

  static async invitePlayer(
    captainId: string,
    teamId: string,
    usernameOrEmail: string
  ) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== captainId) {
      throw new Error("Only the team captain can invite new members");
    }

    const invitee = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase() },
          { email: usernameOrEmail.toLowerCase() },
        ],
      },
    });

    if (!invitee) {
      throw new Error("No user found with the provided username or email");
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: invitee.id },
      },
    });

    if (existingMember) {
      throw new Error("User is already a member of this team");
    }

    // Check if pending invite exists
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        inviteeId: invitee.id,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      throw new Error("A pending invitation has already been sent to this user");
    }

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        inviteeId: invitee.id,
        inviterId: captainId,
        status: "PENDING",
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        title: "Team Invitation Received",
        message: `You've been invited to join team ${team.name} [${team.tag}].`,
        type: "TEAM",
        linkUrl: `/dashboard/teams`,
      },
    });

    return invite;
  }

  static async respondToInvite(
    userId: string,
    inviteId: string,
    action: "ACCEPT" | "DECLINE"
  ) {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: { team: true },
    });

    if (!invite) throw new Error("Invitation not found");
    if (invite.inviteeId !== userId) {
      throw new Error("Unauthorized: Invitation was not addressed to you");
    }

    if (invite.status !== "PENDING") {
      throw new Error(`Invitation is no longer active (Status: ${invite.status})`);
    }

    if (action === "ACCEPT") {
      await prisma.$transaction([
        prisma.teamInvite.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" },
        }),
        prisma.teamMember.create({
          data: {
            teamId: invite.teamId,
            userId,
            role: "MEMBER",
          },
        }),
        prisma.notification.create({
          data: {
            userId: invite.team.captainId,
            title: "Invitation Accepted",
            message: `A new member has joined ${invite.team.name}!`,
            type: "TEAM",
            linkUrl: `/teams/${invite.teamId}`,
          },
        }),
      ]);

      return { status: "ACCEPTED" };
    } else {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINE" },
      });

      return { status: "DECLINED" };
    }
  }

  static async removeMember(captainId: string, teamId: string, memberUserId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) throw new Error("Team not found");
    if (team.captainId !== captainId && captainId !== memberUserId) {
      throw new Error("Unauthorized to remove member from team");
    }

    if (memberUserId === team.captainId) {
      throw new Error("Captain cannot be removed. Transfer leadership or disband team.");
    }

    await prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId: memberUserId },
      },
    });

    return { success: true };
  }
}
