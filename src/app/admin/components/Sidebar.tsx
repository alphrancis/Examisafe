import { useState } from "react";
import { Icon, icons } from "../icons";
import { SCHOOL_NAME, display, mono } from "../lib";
import { canOpen, type Page, type Role } from "../types";

interface NavItem {
  id: Page;
  label: string;
  icon: typeof icons.dashboard;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
  { id: "exam-schedules", label: "Exam Schedules", icon: icons.examSchedules },
  { id: "app-update", label: "App Update", icon: icons.appUpdate },
  { id: "completion", label: "Completion Message", icon: icons.congratulatory },
  { id: "passwords", label: "Passwords", icon: icons.passwords },
  { id: "webconfig", label: "Web Config", icon: icons.webconfig },
  { id: "add-users", label: "Add Users", icon: icons.addUsers },
  { id: "who-online", label: "Who Is Online", icon: icons.whoOnline },
  { id: "activity-log", label: "Activity Log", icon: icons.pulse },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  page: Page;
  role: Role | null;
  onlineCount: number | null;
  setPage: (p: Page) => void;
  onLogout: () => void;
  onCollapse: () => void;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, page, role, onlineCount, setPage, onLogout, onCollapse, onMobileClose }: SidebarProps) {
  const [hovered, setHovered] = useState(false);
  const expanded = !collapsed || hovered;

  const handleNav = (id: Page) => {
    setPage(id);
    onMobileClose();
  };

  const items = role ? navItems.filter((i) => canOpen(role, i.id)) : [];
  const common = { page, items, onlineCount, onNav: handleNav, onLogout };

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-transparent transition-all duration-300 ease-in-out shrink-0 ${expanded ? "w-60" : "w-16"}`}
        style={{ height: "100vh" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <SidebarContent {...common} collapsed={!expanded} onCollapse={onCollapse} />
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-30 w-60 bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-transparent flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent {...common} collapsed={false} onCollapse={onMobileClose} isMobileClose />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  page: Page;
  items: NavItem[];
  onlineCount: number | null;
  onNav: (p: Page) => void;
  onLogout: () => void;
  onCollapse: () => void;
  isMobileClose?: boolean;
}

function SidebarContent({ collapsed, page, items, onlineCount, onNav, onLogout, onCollapse, isMobileClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-white/[0.06] shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center shrink-0">
          <Icon def={icons.shield} size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[#0F172A] dark:text-white text-sm font-semibold leading-tight truncate" style={display}>
              {SCHOOL_NAME}
            </div>
            <div className="text-slate-500 text-[10px] tracking-widest uppercase mt-0.5" style={mono}>
              Admin
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {items.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
                active ? "bg-[#4F46E5] text-white" : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                def={item.icon}
                size={18}
                className={`shrink-0 ${active ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-[#0F172A] dark:group-hover:text-white"}`}
              />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {!collapsed && item.id === "who-online" && onlineCount !== null && (
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className={`text-[10px] font-medium ${active ? "text-white" : "text-emerald-400"}`} style={mono}>
                    {onlineCount}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-200 dark:border-white/[0.06] p-2 space-y-0.5">
        <button
          onClick={onCollapse}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <Icon def={isMobileClose ? icons.x : collapsed ? icons.chevronRight : icons.chevronLeft} size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{isMobileClose ? "Close menu" : "Collapse"}</span>}
        </button>

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <Icon def={icons.logout} size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
