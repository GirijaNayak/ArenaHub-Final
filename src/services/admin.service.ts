import { prisma } from "@/lib/db";

export class AdminService {
  /**
   * Get Platform-wide KPIs across all tenants
   */
  static async getOverviewMetrics() {
    const [
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalUsers,
      totalTournaments,
      totalLobbies,
      totalDisputes,
      pendingDisputes,
      recentOrgs,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "ACTIVE" } }),
      prisma.organization.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.lobby.count(),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { username: true } },
          _count: { select: { tournaments: true, members: true } },
        },
      }),
    ]);

    return {
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalUsers,
      totalTournaments,
      totalLobbies,
      totalDisputes,
      pendingDisputes,
      recentOrganizations: recentOrgs,
    };
  }

  /**
   * List platform users with role filtering & search
   */
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
          inGameId: true,
          createdAt: true,
          orgMemberships: {
            include: { organization: { select: { name: true, slug: true } } },
          },
          _count: {
            select: {
              teamsLed: true,
              tournamentsOrganized: true,
              disputesRaised: true,
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

  /**
   * Update platform user role
   */
  static async updateUserRole(adminUserId: string, targetUserId: string, newRole: string) {
    if (adminUserId === targetUserId && newRole !== "PLATFORM_ADMIN") {
      throw new Error("Admins cannot revoke their own administrator permissions");
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
        entityType: "USER",
        entityId: targetUserId,
        metadata: JSON.stringify({
          fromRole: prevUser?.role,
          toRole: newRole,
        }),
      },
    });

    return updated;
  }

  /**
   * Platform audit logs stream
   */
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
          organization: { select: { id: true, name: true, slug: true } },
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
