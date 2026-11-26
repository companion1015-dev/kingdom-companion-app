import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getCurrentUser, hostIdOf, isValidRoom } from "@/lib/prayer";

export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in to join." }, { status: 401 });
  const { room, listenOnly } = await req.json();
  if (!isValidRoom(room)) return NextResponse.json({ error: "This prayer link isn't valid." }, { status: 400 });

  const isHost = hostIdOf(room) === user.id;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: user.id,
    name: user.name,
    ttl: "4h",
    metadata: JSON.stringify({ role: isHost ? "host" : listenOnly ? "listener" : "participant" }),
  });
  at.addGrant({
    room,
    roomJoin: true,
    canSubscribe: true,
    canPublish: isHost || !listenOnly,
    canPublishData: true, // chat + prayer requests
    roomAdmin: isHost,
  });
  return NextResponse.json({ token: await at.toJwt(), role: isHost ? "host" : "participant" });
}
