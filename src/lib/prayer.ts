import { RoomServiceClient } from "livekit-server-sdk";
import { verifyAccessToken } from "@/lib/auth/service";
import { prisma } from "@/lib/db/client";

export type PrayerUser = { id: string; name: string };

// Reuses the app's own login: Bearer header or access_token cookie.
export async function getCurrentUser(req: Request): Promise<PrayerUser | null> {
  try {
    const header = req.headers.get("authorization");
    const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1];
    const token = header?.startsWith("Bearer ") ? header.slice(7) : cookie ? decodeURIComponent(cookie) : null;
    if (!token) return null;
    const payload = verifyAccessToken(token);
    if (payload.type !== "access") return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, deleted_at: null },
      select: { id: true, email: true, account_status: true },
    });
    if (!user || user.account_status !== "active") return null;
    return { id: user.id as string, name: (user.email as string).split("@")[0] };
  } catch {
    return null;
  }
}

export function canHost(userId: string) {
  const v = (process.env.PRAYER_HOSTS || "all").trim();
  return v === "all" || v.split(",").map((s) => s.trim()).includes(userId);
}

// Room names look like "<hostUserId>__<random>". The host is whoever's ID is the prefix.
export const hostIdOf = (room: string) => room.split("__")[0];
export const isValidRoom = (room: string) => /^[A-Za-z0-9_-]{3,100}$/.test(room) && room.includes("__");

export const roomService = () =>
  new RoomServiceClient(process.env.LIVEKIT_URL!.replace("wss://", "https://"), process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
