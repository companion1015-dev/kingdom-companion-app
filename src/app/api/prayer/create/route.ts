import { NextResponse } from "next/server";
import { getCurrentUser, canHost } from "@/lib/prayer";

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in to start a prayer room." }, { status: 401 });
  if (!canHost(user.id)) return NextResponse.json({ error: "Your account can't start rooms yet. Ask an admin for host access." }, { status: 403 });
  const slug = Math.random().toString(36).slice(2, 8);
  return NextResponse.json({ room: `${user.id}__${slug}` });
}
