import { prisma } from "@/lib/db";
import { z } from "zod";
import { createOrgSchema, updateOrgStatusSchema } from "@/lib/validations";

export class OrganizationService {
  /**
   * Create an organization (tenant)
   */
  static async create(
    ownerId: string,
    data: z.infer<typeof createOrgSchema>
  ) {
    const existing = await prisma.organization.findUnique({
      where: { slug: data.slug.toLowerCase() },
    });

    if (existing) {
      throw new Error(`An organization with slug '${data.slug}' already exists`);
    }

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase(),
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "TOURNAMENT_ORGANIZER",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, username: true } },
        members: true,
      },
    });

    // Update user role to TOURNAMENT_ORGANIZER if PLAYER
    await prisma.user.updateMany({
      where: { id: ownerId, role: "PLAYER" },
      data: { role: "TOURNAMENT_ORGANIZER" },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: ownerId,
        organizationId: org.id,
        action: "ORGANIZATION_CREATED",
        entityType: "ORGANIZATION",
        entityId: org.id,
        metadata: JSON.stringify({ name: org.name, slug: org.slug }),
      },
    });

    return org;
  }

  /**
   * Add or update member in organization
   */
  static async setMemberRole(
    actorId: string,
    organizationId: string,
    targetUserId: string,
    role: "TOURNAMENT_ORGANIZER" | "REFEREE" | "MEMBER"
  ) {
    // Check actor authorization (must be owner or organizer)
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { members: { where: { userId: actorId } } },
    });

    if (!org) throw new Error("Organization not found");
    if (org.status === "SUSPENDED") {
      throw new Error("Cannot modify members in a suspended organization");
    }

    const isAuthorized =
      org.ownerId === actorId ||
      org.members.some((m) => m.role === "TOURNAMENT_ORGANIZER");

    if (!isAuthorized) {
      throw new Error("Forbidden: Only organization owners or organizers can assign staff roles");
    }

    const membership = await prisma.orgMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
      update: { role },
      create: {
        organizationId,
        userId: targetUserId,
        role,
      },
      include: { user: { select: { id: true, username: true, name: true } } },
    });

    // Update user role if referee
    if (role === "REFEREE") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { role: "REFEREE" },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        organizationId,
        action: "ORG_MEMBER_ROLE_UPDATED",
        entityType: "ORG_MEMBERSHIP",
        entityId: membership.id,
        metadata: JSON.stringify({ targetUserId, role }),
      },
    });

    return membership;
  }

  /**
   * Get organization profile by slug
   */
  static async getBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          },
        },
        tournaments: {
          include: {
            _count: { select: { registrations: true, lobbies: true } },
          },
          orderBy: { tournamentStart: "desc" },
        },
      },
    });
  }

  /**
   * List organizations
   */
  static async list({
    search,
    limit = 20,
  }: {
    search?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    return prisma.organization.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, username: true } },
        _count: { select: { tournaments: true, members: true } },
      },
    });
  }

  /**
   * Platform Admin: Suspend or Reactivate Organization
   */
  static async updateStatus(
    adminId: string,
    organizationId: string,
    status: "ACTIVE" | "SUSPENDED"
  ) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) throw new Error("Organization not found");

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { status },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        organizationId,
        action: status === "SUSPENDED" ? "ORGANIZATION_SUSPENDED" : "ORGANIZATION_REACTIVATED",
        entityType: "ORGANIZATION",
        entityId: organizationId,
        metadata: JSON.stringify({ previousStatus: org.status, newStatus: status }),
      },
    });

    return updated;
  }
}
