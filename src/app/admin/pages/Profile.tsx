import { useRef, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../../api/firebase-client";
import { Icon, icons } from "../icons";
import { adminApi, cardCls, display, inputCls, labelCls, mono } from "../lib";
import { ROLE_LABEL } from "../types";
import { resizeAvatar, useSession } from "../SessionContext";
import { Alert, Avatar, RoleBadge, SaveButton, SectionHeader, Spinner } from "../components/ui";

export default function Profile() {
  const session = useSession();
  const user = auth.currentUser;
  const email = user?.email || "";
  const fileRef = useRef<HTMLInputElement>(null);

  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const [name, setName] = useState(session.name || user?.displayName || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  const [acct, setAcct] = useState({ email, password: "", confirm: "", current: "" });
  const [acctBusy, setAcctBusy] = useState(false);
  const [acctError, setAcctError] = useState("");
  const [acctDone, setAcctDone] = useState("");
  const [showPass, setShowPass] = useState(false);

  const savePhoto = async (photo: string | null) => {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const r = await adminApi<{ photo: string | null }>("me", { op: "photo", photo });
      session.setPhoto(r.photo);
    } catch (e: any) {
      setPhotoError(e.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await savePhoto(await resizeAvatar(file));
    } catch (err: any) {
      setPhotoError(err.message);
    }
  };

  const saveName = async () => {
    setNameBusy(true);
    setNameError("");
    try {
      await adminApi("me", { op: "update", name });
      await auth.currentUser?.reload();
      session.setName(name.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2500);
    } catch (e: any) {
      setNameError(e.message);
    } finally {
      setNameBusy(false);
    }
  };

  const newEmail = acct.email.trim();
  const emailChanged = !!newEmail && newEmail.toLowerCase() !== email.toLowerCase();
  const acctDirty = emailChanged || !!acct.password;

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcctError("");
    setAcctDone("");
    if (acct.password && acct.password.length < 6) return setAcctError("New password must be at least 6 characters.");
    if (acct.password !== acct.confirm) return setAcctError("New passwords don't match.");
    if (!acct.current) return setAcctError("Enter your current password to confirm.");
    if (!user) return;

    setAcctBusy(true);
    try {
      // Confirm it's really them, then get a fresh token the server will accept.
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, acct.current));
      } catch {
        throw new Error("Your current password is incorrect.");
      }
      await user.getIdToken(true);
      await adminApi("me", {
        op: "update",
        ...(emailChanged ? { email: newEmail } : {}),
        ...(acct.password ? { password: acct.password } : {}),
      });
      // Changing email/password ends the old session; sign straight back in.
      await signInWithEmailAndPassword(auth, emailChanged ? newEmail : email, acct.password || acct.current);
      setAcct({ email: emailChanged ? newEmail : email, password: "", confirm: "", current: "" });
      setAcctDone(emailChanged && acct.password ? "Email and password updated." : emailChanged ? "Email updated." : "Password updated.");
    } catch (err: any) {
      setAcctError(err.message);
    } finally {
      setAcctBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className={`${cardCls} p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5`}>
        <div className="relative">
          <Avatar name={name || email} photo={session.photo} size={96} />
          {photoBusy && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <Spinner className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="text-lg font-semibold text-[#0F172A] dark:text-white truncate" style={display}>
            {session.name || user?.displayName || "No name"}
          </div>
          <div className="text-xs text-slate-400 truncate" style={mono}>{email}</div>
          <div className="mt-2">{session.role && <RoleBadge role={session.role} />}</div>
          <p className="text-[11px] text-slate-400 mt-3">Your picture is shown to everyone on Who Is Online.</p>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              className="h-8 px-3 text-xs font-medium text-[#4F46E5] bg-[#4F46E5]/10 dark:bg-[#4F46E5]/20 hover:bg-[#4F46E5]/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon def={icons.upload} size={12} />
              {session.photo ? "Change picture" : "Upload picture"}
            </button>
            {session.photo && (
              <button
                onClick={() => savePhoto(null)}
                disabled={photoBusy}
                className="h-8 px-3 text-xs text-slate-500 hover:text-red-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          {photoError && <div className="mt-3"><Alert kind="error">{photoError}</Alert></div>}
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <SectionHeader icon={icons.edit} title="Display Name" />
        <div className="p-5 space-y-3">
          <div>
            <label className={labelCls}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mrs. Maria Santos" className={inputCls} />
          </div>
          {nameError && <Alert kind="error">{nameError}</Alert>}
          <SaveButton
            small
            saving={nameBusy}
            saved={nameSaved}
            disabled={name.trim() === (session.name || user?.displayName || "")}
            onClick={saveName}
          />
        </div>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <SectionHeader icon={icons.key} title="Email & Password" tone="amber" />
        <form onSubmit={saveAccount} className="p-5 space-y-3">
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" required value={acct.email} onChange={(e) => setAcct((a) => ({ ...a, email: e.target.value }))} className={inputCls} style={mono} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New Password</label>
              <input
                type={showPass ? "text" : "password"}
                value={acct.password}
                onChange={(e) => setAcct((a) => ({ ...a, password: e.target.value }))}
                placeholder="Leave blank to keep"
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type={showPass ? "text" : "password"}
                value={acct.confirm}
                onChange={(e) => setAcct((a) => ({ ...a, confirm: e.target.value }))}
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} />
            Show passwords
          </label>
          {acctDirty && (
            <div>
              <label className={labelCls}>Current Password</label>
              <input
                type="password"
                value={acct.current}
                onChange={(e) => setAcct((a) => ({ ...a, current: e.target.value }))}
                placeholder="Required to confirm this change"
                className={inputCls}
                autoComplete="current-password"
              />
            </div>
          )}
          {acctError && <Alert kind="error">{acctError}</Alert>}
          {acctDone && <Alert kind="success">{acctDone}</Alert>}
          <SaveButton small type="submit" saving={acctBusy} disabled={!acctDirty} label="Update account" />
          <p className="text-[10px] text-slate-400">Role: {session.role ? ROLE_LABEL[session.role] : "…"} · Only an admin can change roles.</p>
        </form>
      </div>
    </div>
  );
}
