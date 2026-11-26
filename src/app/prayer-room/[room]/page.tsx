"use client";
import { authFetch } from "@/lib/prayer-client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference, useParticipants, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

export default function PrayerRoom() {
  const { room } = useParams<{ room: string }>();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [listen, setListen] = useState<boolean | null>(null);

  useEffect(() => {
    if (listen === null) return;
    authFetch("/api/prayer/token", { method: "POST", body: JSON.stringify({ room, listenOnly: listen }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setToken(d.token); setRole(d.role); })
      .catch((e) => setErr(e.message));
  }, [room, listen]);

  const copy = async () => { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (err) return <p role="alert" style={{ padding: 24, color: "#ffb4a8" }}>{err} <button onClick={() => router.push("/prayer-room")}>Back</button></p>;

  if (listen === null) return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 24, color: "#f3efe6" }}>
      <h1>Join prayer</h1>
      <p>Allow camera and microphone access when your browser asks.</p>
      <button onClick={() => setListen(false)} style={b}>Join with camera and mic</button>
      <button onClick={() => setListen(true)} style={{ ...b, background: "transparent", color: "#c9a84c", border: "1px solid #c9a84c" }}>Listen only</button>
    </main>
  );

  if (!token) return <p style={{ padding: 24, color: "#f3efe6" }}>Connecting…</p>;

  return (
    <LiveKitRoom serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} token={token} connect video={!listen} audio={!listen}
      data-lk-theme="default" style={{ height: "100dvh" }} onDisconnected={() => router.push("/prayer-room")}
      onError={(e) => setErr("Connection problem: " + e.message + " | LiveKit URL in browser: " + (process.env.NEXT_PUBLIC_LIVEKIT_URL ? "set" : "MISSING"))}>
      <VideoConference />
      <RoomAudioRenderer />
      <div style={{ position: "fixed", top: 8, right: 8, display: "flex", gap: 8, zIndex: 20 }}>
        <button onClick={copy} style={chip}>{copied ? "Link copied" : "Copy invite link"}</button>
        {role === "host" && <HostPanel room={room} />}
      </div>
    </LiveKitRoom>
  );
}

function HostPanel({ room }: { room: string }) {
  const [open, setOpen] = useState(false);
  const people = useParticipants();
  const act = (identity: string, action: string) =>
    authFetch("/api/prayer/moderate", { method: "POST", body: JSON.stringify({ room, identity, action }) });
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={chip}>Manage people ({people.length})</button>
      {open && (
        <div style={{ background: "#0f2236", border: "1px solid #3a516b", borderRadius: 10, padding: 10, marginTop: 6, width: 260, maxHeight: "60dvh", overflow: "auto" }}>
          {people.map((p) => (
            <div key={p.identity} style={{ padding: "6px 0", borderBottom: "1px solid #223a55", color: "#f3efe6" }}>
              <div>{p.name || p.identity}{p.isLocal ? " (you)" : ""}</div>
              {!p.isLocal && (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <button style={sm} onClick={() => act(p.identity, "silence")}>Silence</button>
                  <button style={sm} onClick={() => act(p.identity, "allow")}>Allow</button>
                  <button style={sm} onClick={() => confirm("Remove this person?") && act(p.identity, "remove")}>Remove</button>
                </div>
              )}
            </div>
          ))}
          <button style={{ ...sm, marginTop: 10, background: "#8c2f2f", color: "#fff" }}
            onClick={() => confirm("End the prayer for everyone?") && act("", "end")}>End for everyone</button>
        </div>
      )}
    </div>
  );
}
const b: React.CSSProperties = { display: "block", width: "100%", padding: 14, borderRadius: 10, fontSize: 16, marginTop: 10, border: "none", background: "#c9a84c", color: "#0f2236", cursor: "pointer" };
const chip: React.CSSProperties = { padding: "8px 12px", borderRadius: 999, border: "1px solid #c9a84c", background: "#0f2236", color: "#f3efe6", fontSize: 13, cursor: "pointer" };
const sm: React.CSSProperties = { padding: "4px 8px", borderRadius: 6, border: "1px solid #3a516b", background: "#162e47", color: "#f3efe6", fontSize: 12, cursor: "pointer" };
