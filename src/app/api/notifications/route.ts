import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/services/notification.service";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const data = await NotificationService.getUserNotifications(session.userId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const notificationId = body?.notificationId;

    if (notificationId) {
      await NotificationService.markAsRead(session.userId, notificationId);
    } else {
      await NotificationService.markAllAsRead(session.userId);
    }

    return NextResponse.json({ message: "Notifications updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
