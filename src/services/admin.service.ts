import { prisma } from "@/lib/db";

export class AdminService {
  static async getOverviewMetrics() {
    const [totalUsers, totalTournaments, totalMatches, totalTeams, recentTournaments] =
      await Promise.all([
        prisma.user.count(),
        prisma.tournament.count(),
        prisma.match.count(),
        prisma.team.count(),
        prisma.tournament.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { game: true, organizer: { select: { username: true } } },
        }),
      ]);

    const activeTournaments = await prisma.tournament.count({
      where: { status: { in: ["REGISTRATION_OPEN", "ONGOING"] } },
    });

    return {
      totalUsers,
      totalTournaments,
      activeTournaments,
      totalMatches,
      totalTeams,
      recentTournaments,
    };
  }

  static async listUsers({
    search,
    role,
    page = 1,
    limit = 20,
  }: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          region: true,
          createdAt: true,
          _count: {
            select: {
              registrations: true,
              tournamentsOrganized: true,
              teamsLed: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateUserRole(adminUserId: string, targetUserId: string, newRole: string) {
    if (adminUserId === targetUserId && newRole !== "ADMIN") {
      throw new Error("Admins cannot revoke their own admin permissions");
    }

    const prevUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, username: true, role: true },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "USER_ROLE_CHANGED",
        targetType: "USER",
        targetId: targetUserId,
        metadata: JSON.stringify({
          fromRole: prevUser?.role,
          toRole: newRole,
        }),
      },
    });

    return updated;
  }

  static async getAuditLogs(page = 1, limit = 25) {
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          actor: { select: { id: true, username: true, role: true } },
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
