import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../components/ThemeProvider";
import Sidebar from "../admin/components/Sidebar";
import TopBar from "../admin/components/TopBar";
import { ExamsProvider } from "../admin/ExamsContext";
import { useHeartbeat, useOnlineUsers, presenceStatus } from "../admin/usePresence";
import { adminApi } from "../admin/lib";
import { PAGES, canOpen, type Page } from "../admin/types";
import { SessionProvider, useSession } from "../admin/SessionContext";
import Profile from "../admin/pages/Profile";
import ActivityLog from "../admin/pages/ActivityLog";
import DashboardHome from "../admin/pages/DashboardHome";
import ExamSchedules from "../admin/pages/ExamSchedules";
import AppUpdate from "../admin/pages/AppUpdate";
import CompletionMessage from "../admin/pages/CompletionMessage";
import Passwords from "../admin/pages/Passwords";
import Webconfig from "../admin/pages/Webconfig";
import AddUsers from "../admin/pages/AddUsers";
import WhoIsOnline from "../admin/pages/WhoIsOnline";

function pageFromHash(): Page {
  const h = window.location.hash.replace("#", "") as Page;
  return PAGES.includes(h) ? h : "dashboard";
}

function PageContent({ page, dark, setPage }: { page: Page; dark: boolean; setPage: (p: Page) => void }) {
  const { role, isSuper } = useSession();
  if (!canOpen(role, page)) page = "dashboard";
  switch (page) {
    case "exam-schedules": return <ExamSchedules dark={dark} />;
    case "app-update": return <AppUpdate />;
    case "completion": return <CompletionMessage />;
    case "passwords": return <Passwords readOnly={!isSuper} />;
    case "webconfig": return <Webconfig />;
    case "add-users": return <AddUsers />;
    case "who-online": return <WhoIsOnline dark={dark} />;
    case "profile": return <Profile />;
    case "activity-log": return <ActivityLog />;
    default: return <DashboardHome dark={dark} onOpenSchedules={() => setPage("exam-schedules")} />;
  }
}

export default function AdminDashboard() {
  return (
    <SessionProvider>
      <DashboardShell />
    </SessionProvider>
  );
}

function DashboardShell() {
  const { user, logout } = useAuth();
  const session = useSession();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const [page, setPageState] = useState<Page>(pageFromHash);
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Remember the open page in the URL so a refresh stays on it.
  const setPage = (p: Page) => {
    setPageState(p);
    window.history.replaceState(null, "", `#${p}`);
  };
  // Teachers who open a super-admin page (e.g. an old link) go to the dashboard.
  useEffect(() => {
    if (session.role && !canOpen(session.role, page)) setPage("dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.role, page]);
  useEffect(() => {
    const onHash = () => setPageState(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useHeartbeat(!!user, { name: session.name || user?.displayName || "", photo: session.photo });
  const { users: online, serverNow } = useOnlineUsers(30_000);
  const onlineCount = online ? online.filter((u) => presenceStatus(u, serverNow) !== "Away").length : null;

  const handleLogout = async () => {
    await adminApi("presence", { op: "leave" }).catch(() => {});
    await logout();
    navigate("/admin");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA] dark:bg-[#0D1117]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20" onClick={() => setMobileOpen(false)} />}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        page={page}
        role={session.role}
        onlineCount={onlineCount}
        setPage={setPage}
        onLogout={handleLogout}
        onCollapse={() => setCollapsed(!collapsed)}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          page={page}
          dark={dark}
          userName={session.name || user?.displayName || ""}
          userEmail={user?.email || ""}
          photo={session.photo}
          role={session.role}
          onOpenProfile={() => setPage("profile")}
          onToggleDark={toggleTheme}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <ExamsProvider>
              <PageContent page={page} dark={dark} setPage={setPage} />
            </ExamsProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
