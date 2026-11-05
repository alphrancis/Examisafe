import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Icon, icons } from "../admin/icons";
import { SCHOOL_NAME, display, mono } from "../admin/lib";
import { Spinner } from "../admin/components/ui";

function friendlyError(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Invalid credentials. Please check your email and password.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection.";
    default:
      return "Could not sign in. Please try again.";
  }
}

const inputCls =
  "w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#161B22] text-[#0F172A] dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 transition-all";

export default function AdminLogin() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ exams: number; grades: number } | null>(null);

  // Public, CDN-cached schedule (no extra Firestore read).
  useEffect(() => {
    fetch("/api/schedule-all")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.grades) return;
        const grades = Object.values(d.grades) as { subjects?: unknown[] }[];
        setStats({ grades: grades.length, exams: grades.reduce((n, g) => n + (g.subjects?.length || 0), 0) });
      })
      .catch(() => {});
  }, []);

  if (!authLoading && user) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(friendlyError(err?.code || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-[#0D1117]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#4F46E5] opacity-10 blur-[80px]" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full bg-[#0EA5E9] opacity-[0.08] blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[#4F46E5] rounded-lg flex items-center justify-center">
              <Icon def={icons.shield} size={18} className="text-white" />
            </div>
            <span className="text-white text-xl font-semibold tracking-tight" style={display}>
              {SCHOOL_NAME}
            </span>
          </div>
          <p className="text-slate-400 text-xs tracking-[0.2em] uppercase mt-1" style={mono}>
            Admin Portal
          </p>
        </div>

        <div className="relative z-10">
          <h1 className="text-white text-4xl xl:text-5xl font-semibold leading-tight mb-6" style={display}>
            Secure exam
            <br />
            management
            <br />
            <span className="text-[#818CF8]">for educators.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            A centralized platform for managing high school examinations and schedules — built for Tinajero National High School - Annex.
          </p>
        </div>

        <div className="relative z-10 flex gap-8 min-h-[52px]">
          {stats &&
            [
              { label: "Scheduled Exams", value: stats.exams },
              { label: "Grade Levels", value: stats.grades },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white text-2xl font-semibold" style={display}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 xl:px-24 bg-white dark:bg-[#0D1117]">
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
            <Icon def={icons.shield} size={16} className="text-white" />
          </div>
          <span className="text-[#0F172A] dark:text-white text-lg font-semibold tracking-tight" style={display}>
            {SCHOOL_NAME}
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-[#0F172A] dark:text-white text-2xl font-semibold mb-1.5" style={display}>
              Sign in to your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Admin access only. Contact your IT coordinator if you need help.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juandelacruz@gmail.com"
                autoComplete="username"
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  <Icon def={showPass ? icons.eyeOff : icons.eye} size={17} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <Icon def={icons.x} size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
