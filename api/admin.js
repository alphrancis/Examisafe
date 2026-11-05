// Admin-only API. Every request must carry a Firebase ID token of a signed-in
// dashboard user:  Authorization: Bearer <idToken>
//
//   GET  /api/admin?r=exams              -> full exams/all doc (with links)
//   POST /api/admin?r=exams    {op, ...} -> add / update / delete a subject
//   GET  /api/admin?r=users              -> Firebase Auth accounts        (admin)
//   POST /api/admin?r=users    {op, ...} -> create / update / delete     (admin)
//   GET  /api/admin?r=presence           -> who is online
//   POST /api/admin?r=presence {op, ...} -> heartbeat / leave / kick (kick: admin)
//   GET  /api/admin?r=audit&before=<ms>  -> activity log, newest first (admin)
//   GET  /api/admin?r=me                 -> my role + profile picture
//   POST /api/admin?r=me       {op, ...} -> update my name / email / password / photo
//
// Roles live in Firebase Auth custom claims ({ role: "super_admin" | "teacher" }),
// so checking them costs no Firestore reads. Accounts with no role are teachers;
// the owner emails in SUPER_ADMIN_EMAILS are always admins.
import admin from "firebase-admin";
import { db } from "./_firebase.js";

const EXAMS_DOC = db.collection("exams").doc("all");
const PRESENCE = db.collection("TNHSAAdminPresence");
const PROFILES = db.collection("TNHSAAdminProfiles");
const AUDIT = db.collection("TNHSAAuditLog");
const PRESENCE_TTL_MS = 30 * 60 * 1000; // forget sessions idle longer than 30 min
const ROLES = ["super_admin", "teacher"];
const MAX_PHOTO_CHARS = 200 * 1024; // the client resizes to ~10 KB; hard cap here

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Owner accounts that are always admins (comma-separated env var overrides).
const OWNER_EMAILS = (process.env.SUPER_ADMIN_EMAILS || "tnhsa@admin.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Works for both a decoded ID token and an Auth user record. Accounts with no
// role are teachers until an admin promotes them.
function roleOf(u) {
  if (OWNER_EMAILS.includes(String(u?.email || "").toLowerCase())) return "super_admin";
  const role = u?.role ?? u?.customClaims?.role;
  return ROLES.includes(role) ? role : "teacher";
}

function requireSuper(me) {
  if (roleOf(me) !== "super_admin") throw new HttpError(403, "Only an admin can do that");
}

function cleanRole(role) {
  if (!ROLES.includes(role)) throw new HttpError(400, "Choose a role");
  return role;
}

function cleanPhoto(photo) {
  if (photo === null || photo === undefined || photo === "") return null;
  if (typeof photo !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)) {
    throw new HttpError(400, "Invalid image");
  }
  if (photo.length > MAX_PHOTO_CHARS) throw new HttpError(400, "Image is too large");
  return photo;
}

function checkPassword(password) {
  if (String(password).length < 6) throw new HttpError(400, "Password must be at least 6 characters");
}

function authError(err) {
  if (err instanceof HttpError) return err;
  if (err.code === "auth/email-already-exists") return new HttpError(400, "That email already has an account");
  if (err.code === "auth/invalid-email") return new HttpError(400, "Invalid email address");
  if (err.code === "auth/invalid-password") return new HttpError(400, "Password must be at least 6 characters");
  if (err.code === "auth/user-not-found") return new HttpError(404, "That user no longer exists");
  return err;
}

async function requireUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Not signed in");
  try {
    // checkRevoked=true so "Force Logout" takes effect immediately.
    return await admin.auth().verifyIdToken(token, true);
  } catch (err) {
    throw new HttpError(401, err.code === "auth/id-token-revoked" ? "Session revoked" : "Invalid session");
  }
}

function body(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}

// Same format the Android app and existing data use: 2026-09-07T16:45:35+08:00
function manilaNowIso() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 19) + "+08:00";
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/;

function cleanSubject(s) {
  const subject = String(s?.subject || "").trim();
  if (!subject) throw new HttpError(400, "Subject name is required");
  const start = s.start || null;
  const end = s.end || null;
  if ((start && !end) || (!start && end)) throw new HttpError(400, "Set both start and end, or neither");
  if (start && (!ISO_RE.test(start) || !ISO_RE.test(end))) throw new HttpError(400, "Invalid date/time");
  if (start && new Date(end) <= new Date(start)) throw new HttpError(400, "End time must be after start time");
  const link = s.link ? String(s.link).trim() : null;
  return { subject, link: link || null, start, end };
}

// ── Activity log ───────────────────────────────────────────────────────────
// One small write per change. Logging never blocks or fails the change itself.
async function audit(me, action, details = {}) {
  try {
    await AUDIT.add({
      at: Date.now(),
      uid: me.uid,
      email: me.email || "",
      name: me.name || "",
      role: roleOf(me),
      action,
      ...details,
    });
  } catch (err) {
    console.error("audit log write failed:", err);
  }
}

async function auditRoute(req, res, me) {
  requireSuper(me);
  const before = Number(req.query.before) || 0;
  let q = AUDIT.orderBy("at", "desc");
  if (before) q = q.where("at", "<", before);
  const snap = await q.limit(50).get();
  return res.status(200).json({ entries: snap.docs.map((d) => ({ id: d.id, ...d.data() })), more: snap.size === 50 });
}

// ── Exams ──────────────────────────────────────────────────────────────────
async function exams(req, res, me) {
  if (req.method === "GET") {
    const snap = await EXAMS_DOC.get();
    return res.status(200).json(snap.exists ? snap.data() : { grades: {} });
  }

  const { op, grade, original } = body(req);
  if (!grade) throw new HttpError(400, "Missing grade");

  // Every grade lives in one document, so teachers saving at the same moment
  // contend on it. Firestore re-runs the transaction on contention, so no save
  // overwrites another. Edits/deletes find their row by name, not by position,
  // so a subject added or removed by someone else in the meantime doesn't break them.
  let result;
  let change = null; // { before, after } for the activity log
  try {
    result = await db.runTransaction(
      async (tx) => {
        const snap = await tx.get(EXAMS_DOC);
        const data = snap.exists ? snap.data() : { grades: {} };
        const grades = data.grades || {};
        if (!/^Grade (7|8|9|10|11|12)$/.test(grade)) throw new HttpError(400, "Unknown grade");
        const g = grades[grade] || { subjects: [] };
        const subjects = [...(g.subjects || [])];

        const findTarget = () => {
          const name = String(original || "").toLowerCase();
          const i = subjects.findIndex((s) => s.subject.toLowerCase() === name);
          if (i === -1) throw new HttpError(409, "This exam was renamed or removed by someone else. Refresh and try again.");
          // Never silently overwrite a change someone else saved after you opened it.
          const exp = body(req).expected;
          if (exp) {
            const cur = subjects[i];
            const same = ["subject", "link", "start", "end"].every((k) => (cur[k] ?? null) === (exp[k] ?? null));
            if (!same) throw new HttpError(409, "Someone else just changed this exam. It has been refreshed, please check it and try again.");
          }
          return i;
        };
        const checkUnique = (name, skip) => {
          if (subjects.some((s, i) => i !== skip && s.subject.toLowerCase() === name.toLowerCase())) {
            throw new HttpError(400, `${grade} already has a subject named "${name}"`);
          }
        };

        if (op === "add") {
          const s = cleanSubject(body(req).subject);
          checkUnique(s.subject, -1);
          subjects.push(s);
          change = { before: null, after: s };
        } else if (op === "update") {
          const i = findTarget();
          const s = cleanSubject(body(req).subject);
          checkUnique(s.subject, i);
          change = { before: subjects[i], after: s };
          subjects[i] = s;
        } else if (op === "delete") {
          const i = findTarget();
          change = { before: subjects[i], after: null };
          subjects.splice(i, 1);
        } else {
          throw new HttpError(400, "Unknown operation");
        }

        const next = { ...data, grades: { ...grades, [grade]: { ...g, subjects } }, updatedAt: manilaNowIso() };
        tx.set(EXAMS_DOC, next);
        return next;
      },
      { maxAttempts: 15 }
    );
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // gRPC ABORTED (10): still contended after every retry.
    if (err.code === 10 || /aborted|contention/i.test(err.message || "")) {
      throw new HttpError(503, "Many people are saving at once. Please try again.");
    }
    throw err;
  }

  await audit(me, `exam.${op}`, { grade, ...change });
  return res.status(200).json(result);
}

// ── Users (admin only) ───────────────────────────────────────────────
async function ensureAnotherSuper(uid) {
  const list = await admin.auth().listUsers(1000);
  const others = list.users.filter((u) => u.uid !== uid && !u.disabled && roleOf(u) === "super_admin");
  if (!others.length) throw new HttpError(400, "There must be at least one admin");
}

async function users(req, res, me) {
  requireSuper(me);

  if (req.method === "GET") {
    const [list, profiles] = await Promise.all([admin.auth().listUsers(1000), PROFILES.get()]);
    const photos = Object.fromEntries(profiles.docs.map((d) => [d.id, d.data().photo || null]));
    return res.status(200).json(
      list.users.map((u) => ({
        uid: u.uid,
        email: u.email || "",
        name: u.displayName || "",
        role: roleOf(u),
        photo: photos[u.uid] || null,
        disabled: u.disabled,
        createdAt: u.metadata.creationTime,
        lastSignIn: u.metadata.lastSignInTime || null,
      }))
    );
  }

  const { op, uid, name, email, password, role } = body(req);

  if (op === "create") {
    if (!email || !password) throw new HttpError(400, "Email and password are required");
    checkPassword(password);
    const r = cleanRole(role);
    try {
      const u = await admin.auth().createUser({
        email: String(email).trim(),
        password: String(password),
        displayName: name ? String(name).trim() : undefined,
      });
      await admin.auth().setCustomUserClaims(u.uid, { role: r });
      await audit(me, "user.create", { target: { email: u.email, name: u.displayName || "", role: r } });
      return res.status(200).json({ uid: u.uid });
    } catch (err) {
      throw authError(err);
    }
  }

  if (!uid) throw new HttpError(400, "Missing user");

  if (op === "update") {
    try {
      const target = await admin.auth().getUser(uid);
      const oldRole = roleOf(target);
      const changes = {};
      if (typeof name === "string" && name.trim() !== (target.displayName || "")) changes.displayName = name.trim() || null;
      if (typeof email === "string" && email.trim() && email.trim().toLowerCase() !== (target.email || "").toLowerCase()) {
        changes.email = email.trim();
      }
      if (password) {
        checkPassword(password);
        changes.password = String(password);
      }
      const newRole = role === undefined ? oldRole : cleanRole(role);
      if (OWNER_EMAILS.includes(String(target.email || "").toLowerCase()) && newRole !== "super_admin") {
        throw new HttpError(400, "The main admin account can't be changed to a teacher");
      }
      if (uid === me.uid && newRole !== "super_admin") throw new HttpError(400, "You can't remove your own admin role");
      if (oldRole === "super_admin" && newRole !== "super_admin") await ensureAnotherSuper(uid);

      if (Object.keys(changes).length) await admin.auth().updateUser(uid, changes);
      if (newRole !== oldRole || target.customClaims?.role !== newRole) {
        await admin.auth().setCustomUserClaims(uid, { ...(target.customClaims || {}), role: newRole });
      }
      // Sign them out so a new role, email or password takes effect right away.
      const signedOut = uid !== me.uid && (newRole !== oldRole || !!changes.email || !!changes.password);
      if (signedOut) {
        await admin.auth().revokeRefreshTokens(uid);
        await PRESENCE.doc(uid).delete();
    patchPresence(uid, null);
      } else if (changes.displayName !== undefined) {
        const pres = PRESENCE.doc(uid);
        if ((await pres.get()).exists) await pres.update({ name: changes.displayName || "" });
        if (presenceCache?.users.has(uid)) patchPresence(uid, { name: changes.displayName || "" });
      }
      const changed = Object.keys(changes).map((k) => (k === "displayName" ? "name" : k));
      if (newRole !== oldRole) changed.push("role");
      if (changed.length) {
        await audit(me, "user.update", {
          target: { email: target.email || "", name: target.displayName || "" },
          changed,
          before: { name: target.displayName || "", email: target.email || "", role: oldRole },
          after: { name: changes.displayName ?? target.displayName ?? "", email: changes.email ?? target.email ?? "", role: newRole },
        });
      }
      return res.status(200).json({ ok: true, signedOut });
    } catch (err) {
      throw authError(err);
    }
  }

  if (op === "delete") {
    if (uid === me.uid) throw new HttpError(400, "You can't remove your own account");
    try {
      const target = await admin.auth().getUser(uid);
      if (roleOf(target) === "super_admin") await ensureAnotherSuper(uid);
      await admin.auth().deleteUser(uid);
      await audit(me, "user.delete", { target: { email: target.email || "", name: target.displayName || "", role: roleOf(target) } });
    } catch (err) {
      throw authError(err);
    }
    await Promise.all([PRESENCE.doc(uid).delete(), PROFILES.doc(uid).delete()]);
    patchPresence(uid, null);
    return res.status(200).json({ ok: true });
  }

  throw new HttpError(400, "Unknown operation");
}

// ── Me (own profile) ───────────────────────────────────────────────────────
async function meRoute(req, res, me) {
  if (req.method === "GET") {
    const snap = await PROFILES.doc(me.uid).get();
    return res.status(200).json({ role: roleOf(me), photo: snap.exists ? snap.data().photo || null : null });
  }

  const { op, name, email, password, photo } = body(req);

  if (op === "photo") {
    const p = cleanPhoto(photo);
    await PROFILES.doc(me.uid).set({ photo: p, updatedAt: Date.now() });
    const pres = PRESENCE.doc(me.uid);
    if ((await pres.get()).exists) await pres.update({ photo: p });
    if (presenceCache?.users.has(me.uid)) patchPresence(me.uid, { photo: p });
    return res.status(200).json({ photo: p });
  }

  if (op === "update") {
    const changes = {};
    if (typeof name === "string") changes.displayName = name.trim() || null;
    const wantsEmail = typeof email === "string" && email.trim() && email.trim().toLowerCase() !== (me.email || "").toLowerCase();
    if (wantsEmail) changes.email = email.trim();
    if (password) {
      checkPassword(password);
      changes.password = String(password);
    }
    // Email / password changes need a fresh sign-in: the client re-confirms the
    // current password right before this call.
    if ((wantsEmail || password) && Date.now() / 1000 - (me.auth_time || 0) > 5 * 60) {
      throw new HttpError(400, "Please confirm your current password again");
    }
    try {
      if (Object.keys(changes).length) await admin.auth().updateUser(me.uid, changes);
    } catch (err) {
      throw authError(err);
    }
    if (changes.displayName !== undefined) {
      const pres = PRESENCE.doc(me.uid);
      if ((await pres.get()).exists) await pres.update({ name: changes.displayName || "" });
      if (presenceCache?.users.has(me.uid)) patchPresence(me.uid, { name: changes.displayName || "" });
    }
    return res.status(200).json({ ok: true });
  }

  throw new HttpError(400, "Unknown operation");
}

// ── Presence ───────────────────────────────────────────────────────────────
// Every open dashboard polls this. Instead of each poll reading every presence
// doc, a server instance reuses its last read for PRESENCE_CACHE_MS, and its
// own writes (heartbeat / leave / kick) patch that copy so it stays accurate.
const PRESENCE_CACHE_MS = 15_000;
let presenceCache = null; // { at, users: Map<uid, data> }

async function loadPresence() {
  const now = Date.now();
  if (presenceCache && now - presenceCache.at < PRESENCE_CACHE_MS) return presenceCache.users;
  const snap = await PRESENCE.get();
  const users = new Map();
  const stale = [];
  for (const d of snap.docs) {
    const p = d.data();
    if (now - (p.lastSeen || 0) > PRESENCE_TTL_MS) stale.push(d.ref);
    else users.set(d.id, p);
  }
  await Promise.all(stale.map((r) => r.delete()));
  presenceCache = { at: now, users };
  return users;
}

function patchPresence(uid, data) {
  if (!presenceCache) return;
  if (data) presenceCache.users.set(uid, { ...(presenceCache.users.get(uid) || {}), ...data });
  else presenceCache.users.delete(uid);
}

async function presence(req, res, me) {
  if (req.method === "GET") {
    const users = await loadPresence();
    const now = Date.now();
    const online = [...users.entries()]
      .filter(([, p]) => now - (p.lastSeen || 0) <= PRESENCE_TTL_MS)
      .map(([uid, p]) => ({ uid, ...p }));
    return res.status(200).json({ now, users: online });
  }

  const { op, uid, sessionStart, lastActivity, name, photo } = body(req);
  if (op === "heartbeat") {
    let p = null;
    try {
      p = cleanPhoto(photo);
    } catch {
      p = null;
    }
    const doc = {
      email: me.email || "",
      name: typeof name === "string" ? name.slice(0, 120) : me.name || "",
      role: roleOf(me),
      photo: p,
      loginAt: Number(sessionStart) || Date.now(),
      lastActivity: Number(lastActivity) || Date.now(),
      lastSeen: Date.now(),
    };
    await PRESENCE.doc(me.uid).set(doc);
    patchPresence(me.uid, doc);
    return res.status(200).json({ ok: true });
  }
  if (op === "leave") {
    await PRESENCE.doc(me.uid).delete();
    patchPresence(me.uid, null);
    return res.status(200).json({ ok: true });
  }
  if (op === "kick") {
    requireSuper(me);
    if (!uid) throw new HttpError(400, "Missing user");
    if (uid === me.uid) throw new HttpError(400, "You can't force-logout yourself");
    await admin.auth().revokeRefreshTokens(uid);
    const t = await admin.auth().getUser(uid).catch(() => null);
    await audit(me, "user.kick", { target: { email: t?.email || "", name: t?.displayName || "" } });
    await PRESENCE.doc(uid).delete();
    patchPresence(uid, null);
    return res.status(200).json({ ok: true });
  }
  throw new HttpError(400, "Unknown operation");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "GET" && req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const me = await requireUser(req);
    const r = req.query.r;
    if (r === "exams") return await exams(req, res, me);
    if (r === "users") return await users(req, res, me);
    if (r === "presence") return await presence(req, res, me);
    if (r === "me") return await meRoute(req, res, me);
    if (r === "audit") return await auditRoute(req, res, me);
    throw new HttpError(404, "Unknown resource");
  } catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    console.error("admin api error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
