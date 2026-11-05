import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "../../../api/firebase-client";
import { adminApi } from "./lib";
import type { Role } from "./types";

interface SessionCtx {
  role: Role | null; // null while loading
  isSuper: boolean;
  photo: string | null;
  name: string;
  setPhoto: (p: string | null) => void;
  setName: (n: string) => void;
}

const Ctx = createContext<SessionCtx | undefined>(undefined);

/** The signed-in dashboard user's role and profile picture (1 Firestore read on load). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState(auth.currentUser?.displayName || "");

  const load = useCallback(async () => {
    try {
      const r = await adminApi<{ role: Role; photo: string | null }>("me");
      setRole(r.role);
      setPhoto(r.photo);
    } catch {
      // If the API can't be reached, show the restricted (teacher) view.
      setRole("teacher");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Ctx.Provider value={{ role, isSuper: role === "super_admin", photo, name, setPhoto, setName }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be used inside SessionProvider");
  return c;
}

/** Resize an image file to a small square JPEG data URL for use as an avatar. */
export function resizeAvatar(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}
