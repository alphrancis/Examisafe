import { Icon, icons } from "../icons";
import { display, mono } from "../lib";
import { ROLE_LABEL, type Page, type Role } from "../types";
import { Avatar } from "./ui";

const pageTitles: Record<Page, string> = {
  dashboard: "Dashboard",
  "app-update": "App Update",
  completion: "Completion Message",
  passwords: "Passwords",
  webconfig: "Web Configuration",
  "add-users": "Add Users",
  "exam-schedules": "Exam Schedules",
  "who-online": "Who Is Online",
  profile: "My Profile",
  "activity-log": "Activity Log",
};

interface TopBarProps {
  page: Page;
  dark: boolean;
  userName: string;
  userEmail: string;
  photo: string | null;
  role: Role | null;
  onOpenProfile: () => void;
  onToggleDark: (e: React.MouseEvent) => void;
  onMenuOpen: () => void;
}

export default function TopBar({ page, dark, userName, userEmail, photo, role, onOpenProfile, onToggleDark, onMenuOpen }: TopBarProps) {
  const dateStr = new Date().toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0D1117] shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuOpen}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-[#334155] active:scale-95 transition-all shrink-0"
          aria-label="Open navigation menu"
        >
          <Icon def={icons.menu} size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="text-[#0F172A] dark:text-white text-base lg:text-lg font-semibold leading-tight truncate" style={display}>
            {pageTitles[page]}
          </h1>
          <p className="text-slate-400 text-xs hidden sm:block">{dateStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleDark}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Icon def={dark ? icons.sun : icons.moon} size={18} />
        </button>

        <button
          onClick={onOpenProfile}
          title="My profile"
          className={`flex items-center gap-2.5 ml-1 pl-3 pr-2 py-1 border-l border-slate-100 dark:border-slate-800 rounded-r-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left ${page === "profile" ? "bg-slate-50 dark:bg-slate-800/60" : ""}`}
        >
          <Avatar name={userName || userEmail} photo={photo} size={32} />
          <div className="hidden sm:block max-w-[180px]">
            <div className="text-xs font-medium text-[#0F172A] dark:text-white leading-tight truncate">{userName || "Admin"}</div>
            <div className="text-[10px] text-slate-400 truncate" style={mono}>
              {role ? ROLE_LABEL[role] : userEmail}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
