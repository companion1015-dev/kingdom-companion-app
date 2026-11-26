"use client";
import { authFetch } from "@/lib/prayer-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PrayerLobby() {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true); setErr("");
    const r = await authFetch("/api/prayer/create", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error);
    router.push(`/prayer-room/${d.room}`);
  }
  function join() {
    const room = link.trim().split("/prayer-room/").pop() || "";
    if (!room.includes("__")) return setErr("Paste the full prayer link you were sent.");
    router.push(`/prayer-room/${room}`);
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px", color: "#f3efe6" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Live Prayer</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>Pray together by video, with chat for prayer requests.</p>
      <button onClick={start} disabled={busy} style={btn(true)}>{busy ? "Starting…" : "Start a prayer room"}</button>
      <p style={{ margin: "28px 0 8px" }}>Have a link?</p>
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste prayer link" style={inp} />
      <button onClick={join} style={btn(false)}>Join prayer room</button>
      {err && <p role="alert" style={{ color: "#ffb4a8", marginTop: 12 }}>{err}</p>}
    </main>
  );
}
const btn = (primary: boolean): React.CSSProperties => ({
  width: "100%", padding: 14, borderRadius: 10, fontSize: 16, marginTop: 8, cursor: "pointer",
  border: primary ? "none" : "1px solid #c9a84c", background: primary ? "#c9a84c" : "transparent", color: primary ? "#0f2236" : "#c9a84c",
});
const inp: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #3a516b", background: "#162e47", color: "#f3efe6", fontSize: 16 };
