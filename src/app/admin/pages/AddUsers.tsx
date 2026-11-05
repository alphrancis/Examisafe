import { useCallback, useEffect, useState } from "react";
import { auth } from "../../../../api/firebase-client";
import { Icon, icons } from "../icons";
import { adminApi, cardCls, display, fmtDate, mono } from "../lib";
import { ROLE_LABEL, type Role } from "../types";
import { Alert, Avatar, ConfirmDialog, ErrorCard, LoadingCard, RoleBadge, Spinner } from "../components/ui";

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  photo: string | null;
  disabled: boolean;
  createdAt: string;
  lastSignIn: string | null;
}

const fieldCls =
  "w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 outline-none focus:border-[#4F46E5] transition-all";
const smallLabel = "block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1";

export default function AddUsers() {
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "teacher" as Role });
  const [showPass, setShowPass] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [kickTarget, setKickTarget] = useState<AuthUser | null>(null);
  const [editTarget, setEditTarget] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [search, setSearch] = useState("");
  const myUid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await adminApi<AuthUser[]>("users");
      setUsers([...(Array.isArray(list) ? list : [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loadError && !users) return <ErrorCard message={loadError} onRetry={load} />;
  if (!users) return <LoadingCard />;

  const q = search.trim().toLowerCase();
  const filtered = users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      await adminApi("users", { op: "create", ...form });
      flash(`${ROLE_LABEL[form.role]} account created for ${form.email}.`);
      setForm({ name: "", email: "", password: "", role: form.role });
      await load();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setDialogError("");
    try {
      await fn();
    } catch (err: any) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () =>
    run(async () => {
      const t = deleteTarget!;
      await adminApi("users", { op: "delete", uid: t.uid });
      setUsers((prev) => prev?.filter((u) => u.uid !== t.uid) ?? null);
      setDeleteTarget(null);
      flash(`${t.email} was removed.`);
    });

  const handleKick = () =>
    run(async () => {
      const t = kickTarget!;
      await adminApi("presence", { op: "kick", uid: t.uid });
      setKickTarget(null);
      flash(`${t.name || t.email} was signed out.`);
    });

  const handleEdit = (changes: { name: string; email: string; password: string; role: Role }) =>
    run(async () => {
      const t = editTarget!;
      const r = await adminApi<{ signedOut: boolean }>("users", {
        op: "update",
        uid: t.uid,
        name: changes.name,
        email: changes.email,
        role: changes.role,
        ...(changes.password ? { password: changes.password } : {}),
      });
      setEditTarget(null);
      flash(`${changes.name || changes.email} was updated.${r.signedOut ? " They were signed out and must sign in again." : ""}`);
      await load();
    });

  const open = (setter: (u: AuthUser) => void) => (u: AuthUser) => {
    setDialogError("");
    setter(u);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="lg:col-span-1">
          <div className={`${cardCls} p-5`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon def={icons.addUsers} size={16} className="text-[#4F46E5]" />
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white" style={display}>
                New Account
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-5">They'll sign in to this dashboard with this email and password.</p>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className={smallLabel}>Role</label>
                <RolePicker value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} />
              </div>
              <div>
                <label className={smallLabel}>Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Mrs. Maria Santos"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={smallLabel}>Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="teacher@gmail.com"
                  className={fieldCls}
                  style={{ ...mono, fontSize: "12px" }}
                />
              </div>
              <div>
                <label className={smallLabel}>Password</label>
                <div className="relative">
                  <input
                    required
                    minLength={6}
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    className={`${fieldCls} pr-9`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <Icon def={showPass ? icons.eyeOff : icons.eye} size={15} />
                  </button>
                </div>
              </div>
              {addError && <Alert kind="error">{addError}</Alert>}
              <button
                type="submit"
                disabled={adding}
                className="w-full h-10 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {adding ? (
                  <>
                    <Spinner />
                    Adding…
                  </>
                ) : (
                  <>
                    <Icon def={icons.plus} size={16} className="text-white" />
                    Add {ROLE_LABEL[form.role]}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {notice && <Alert kind="success">{notice}</Alert>}
          <div className={`${cardCls} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon def={icons.search} size={15} className="text-slate-400" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users…"
                  className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-[#0F172A] dark:text-white placeholder-slate-400 outline-none focus:border-[#4F46E5] transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 shrink-0" style={mono}>
                {users.length} account{users.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    {["User", "Role", "Last Sign-in", ""].map((h, i) => (
                      <th key={i} className={`text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${h === "Last Sign-in" ? "hidden md:table-cell" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isMe = u.uid === myUid;
                    return (
                      <tr key={u.uid} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name || u.email} photo={u.photo} size={30} />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-[#0F172A] dark:text-white flex items-center gap-1.5">
                                {u.name || <span className="text-slate-400">No name</span>}
                                {isMe && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5]">You</span>}
                                {u.disabled && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">Disabled</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate" style={mono}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.lastSignIn ? fmtDate(u.lastSignIn) : "Never"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => open(setEditTarget)(u)} title="Edit user" className="text-slate-400 hover:text-[#4F46E5] transition-colors">
                              <Icon def={icons.edit} size={15} />
                            </button>
                            {!isMe && (
                              <>
                                <button onClick={() => open(setKickTarget)(u)} title="Force logout" className="text-slate-400 hover:text-amber-500 transition-colors">
                                  <Icon def={icons.logout} size={15} />
                                </button>
                                <button onClick={() => open(setDeleteTarget)(u)} title="Remove user" className="text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors">
                                  <Icon def={icons.trash} size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No users match “{search}”.</div>}
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Remove user?"
          message={
            <>
              <span className="font-medium">{deleteTarget.email}</span> will be deleted and lose access immediately. This can't be undone.
            </>
          }
          confirmLabel="Remove"
          busy={busy}
          error={dialogError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}

      {kickTarget && (
        <ConfirmDialog
          title="Force logout?"
          message={<>{kickTarget.name || kickTarget.email} will be signed out of the dashboard on all devices. They can sign in again with their password.</>}
          confirmLabel="Sign them out"
          busy={busy}
          error={dialogError}
          onCancel={() => setKickTarget(null)}
          onConfirm={handleKick}
        />
      )}

      {editTarget && (
        <EditUserDialog
          user={editTarget}
          isMe={editTarget.uid === myUid}
          busy={busy}
          error={dialogError}
          onCancel={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}

function RolePicker({ value, onChange, disabled }: { value: Role; onChange: (r: Role) => void; disabled?: boolean }) {
  const opts: { role: Role; hint: string }[] = [
    { role: "teacher", hint: "Dashboard, schedules, view passwords, who's online" },
    { role: "super_admin", hint: "Full access, manages users & settings" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((o) => {
        const active = value === o.role;
        return (
          <button
            key={o.role}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.role)}
            className={`text-left p-2.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              active ? "border-[#4F46E5] bg-[#4F46E5]/5 dark:bg-[#4F46E5]/15" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <div className={`text-xs font-semibold ${active ? "text-[#4F46E5]" : "text-[#0F172A] dark:text-white"}`}>{ROLE_LABEL[o.role]}</div>
            <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{o.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

function EditUserDialog({
  user,
  isMe,
  busy,
  error,
  onCancel,
  onSave,
}: {
  user: AuthUser;
  isMe: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSave: (c: { name: string; email: string; password: string; role: Role }) => void;
}) {
  const [f, setF] = useState({ name: user.name, email: user.email, password: "", role: user.role });
  const [showPass, setShowPass] = useState(false);
  const willSignOut = !isMe && (f.role !== user.role || f.email.trim().toLowerCase() !== user.email.toLowerCase() || !!f.password);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(f);
        }}
        className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-100 dark:border-slate-800 p-6 w-full max-w-md shadow-xl space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-2">
          <Avatar name={user.name || user.email} photo={user.photo} size={36} />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white" style={display}>Edit user</h4>
            <div className="text-[11px] text-slate-400 truncate" style={mono}>{user.email}</div>
          </div>
        </div>
        <div>
          <label className={smallLabel}>Role</label>
          <RolePicker value={f.role} onChange={(role) => setF((p) => ({ ...p, role }))} disabled={isMe} />
          {isMe && <p className="text-[10px] text-slate-400 mt-1">You can't change your own role.</p>}
        </div>
        <div>
          <label className={smallLabel}>Full Name</label>
          <input value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} className={fieldCls} />
        </div>
        <div>
          <label className={smallLabel}>Email</label>
          <input required disabled={isMe} type="email" value={f.email} onChange={(e) => setF((p) => ({ ...p, email: e.target.value }))} className={fieldCls} style={{ ...mono, fontSize: "12px" }} />
        </div>
        <div>
          <label className={smallLabel}>New Password</label>
          <div className="relative">
            <input
              minLength={6}
              disabled={isMe}
              type={showPass ? "text" : "password"}
              value={f.password}
              onChange={(e) => setF((p) => ({ ...p, password: e.target.value }))}
              placeholder="Leave blank to keep current password"
              className={`${fieldCls} pr-9`}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <Icon def={showPass ? icons.eyeOff : icons.eye} size={15} />
            </button>
          </div>
          {isMe && <p className="text-[10px] text-slate-400 mt-1">Change your own email or password from My Profile.</p>}
        </div>
        {willSignOut && <p className="text-[11px] text-amber-600 dark:text-amber-400">They'll be signed out and must sign in again for this to take effect.</p>}
        {error && <Alert kind="error">{error}</Alert>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} disabled={busy} className="flex-1 h-9 text-sm text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 h-9 text-sm font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2">
            {busy && <Spinner />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
