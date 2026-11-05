import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "./lib";

export interface OnlineUser {
  uid: string;
  email: string;
  name: string;
  role?: "super_admin" | "teacher";
  photo?: string | null;
  loginAt: number;
  lastActivity: number;
  lastSeen: number;
}

export type PresenceStatus = "Active" | "Idle" | "Away";

// Online  = heartbeat within the last 3 min.
// Active  = online and used the dashboard within the last 2 min.
export function presenceStatus(u: OnlineUser, now: number): PresenceStatus {
  if (now - u.lastSeen > 3 * 60_000) return "Away";
  if (now - u.lastActivity > 2 * 60_000) return "Idle";
  return "Active";
}

const HEARTBEAT_MS = 30_000;

/** Sends this admin's heartbeat while the dashboard is open. */
export function useHeartbeat(enabled: boolean, profile: { name: string; photo: string | null }) {
  const sessionStart = useRef(Date.now());
  const lastActivity = useRef(Date.now());
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (!enabled) return;
    const mark = () => (lastActivity.current = Date.now());
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const beat = () =>
      adminApi("presence", {
        op: "heartbeat",
        sessionStart: sessionStart.current,
        lastActivity: lastActivity.current,
        name: profileRef.current.name,
        photo: profileRef.current.photo,
      }).catch(() => {});

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [enabled]);
}

/** Polls the list of online admins. */
export function useOnlineUsers(pollMs: number) {
  const [users, setUsers] = useState<OnlineUser[] | null>(null);
  const [serverNow, setServerNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi<{ now: number; users: OnlineUser[] }>("presence");
      setUsers([...(r.users || [])].sort((a, b) => b.lastSeen - a.lastSeen));
      setServerNow(r.now);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { users, serverNow, error, reload: load, setUsers };
}
