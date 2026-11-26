import { NextResponse } from "next/server";
import { getCurrentUser, hostIdOf, isValidRoom, roomService } from "@/lib/prayer";

// Host-only. actions: silence | allow | remove | end
export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  const { room, identity, action } = await req.json();
  if (!user || !isValidRoom(room) || hostIdOf(room) !== user.id)
    return NextResponse.json({ error: "Only the host can do this." }, { status: 403 });

  const svc = roomService();
  try {
    if (action === "silence" || action === "allow")
      await svc.updateParticipant(room, identity, undefined, {
        canPublish: action === "allow", canSubscribe: true, canPublishData: action === "allow",
      });
    else if (action === "remove") await svc.removeParticipant(room, identity);
    else if (action === "end") await svc.deleteRoom(room);
    else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "That didn't work. The person may have already left." }, { status: 502 });
  }
}
