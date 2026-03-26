import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  BookOpen, ClipboardList, MessageSquare, LayoutDashboard,
  LogOut, BarChart3, Menu, X, ChevronRight, Megaphone,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

type NavItem = { label: string; icon: React.ElementType; path: string };

const navItems: Record<string, NavItem[]> = {
  teacher: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/teacher' },
    { label: 'Courses',       icon: BookOpen,        path: '/teacher/courses' },
    { label: 'Assignments',   icon: ClipboardList,   path: '/teacher/assignments' },
    { label: 'Feedback',      icon: MessageSquare,   path: '/teacher/feedback' },
    { label: 'Announcements', icon: Megaphone,       path: '/teacher/announcements' },
    { label: 'Forums',        icon: MessageCircle,   path: '/teacher/forums' },
  ],
  student: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/student' },
    { label: 'My Courses',    icon: BookOpen,        path: '/student/courses' },
    { label: 'Assignments',   icon: ClipboardList,   path: '/student/assignments' },
    { label: 'Feedback',      icon: MessageSquare,   path: '/student/feedback' },
    { label: 'Announcements', icon: Megaphone,       path: '/student/announcements' },
    { label: 'Forums',        icon: MessageCircle,   path: '/student/forums' },
  ],
  parent: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/parent' },
    { label: 'Progress',      icon: BarChart3,       path: '/parent/progress' },
    { label: 'Feedback',      icon: MessageSquare,   path: '/parent/feedback' },
    { label: 'Announcements', icon: Megaphone,       path: '/parent/announcements' },
    { label: 'Forums',        icon: MessageCircle,   path: '/parent/forums' },
  ],
};

const roleEmoji: Record<string, string> = { teacher: '👨‍🏫', student: '👨‍🎓', parent: '👨‍👩‍👧' };
const roleAccentClass: Record<string, string> = {
  teacher: 'from-violet-600 to-indigo-600',
  student: 'from-indigo-600 to-blue-600',
  parent:  'from-purple-600 to-violet-600',
};

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className={`relative flex items-center rounded-full transition-all duration-500 focus-accessible shrink-0 w-12 h-6
        ${isDark
          ? 'bg-gradient-to-r from-violet-900/80 to-indigo-900/80 border border-violet-500/40 shadow-[0_0_12px_hsl(272_80%_50%/0.3)]'
          : 'bg-gradient-to-r from-sky-200 to-violet-100 border border-sky-300/60'
        }`}
    >
      <span className={`absolute left-1.5 text-[9px] transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
      <span className={`absolute right-1.5 text-[9px] transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
      <span className={`absolute rounded-full shadow-md transition-all duration-500 text-[10px] w-4 h-4 flex items-center justify-center
        ${isDark ? 'translate-x-[28px] bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'translate-x-[2px] bg-white text-amber-500'}`}>
        {isDark ? '⭐' : '☀'}
      </span>
    </button>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.role] || [];
  const accentGrad = roleAccentClass[user.role] || 'from-violet-600 to-indigo-600';
  const emoji = roleEmoji[user.role] || '🎓';
  const avatarInitials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => { await logout(); navigate('/'); };

  const SidebarContent = ({ isDrawer = false }: { isDrawer?: boolean }) => {
    const isCollapsed = collapsed && !isDrawer;
    return (
      <>
        {/* Header row */}
        <div className={`flex items-center border-b border-border/50 shrink-0
          ${isCollapsed ? 'flex-col py-4 px-2 gap-3' : 'flex-row gap-3 px-4 py-4'}`}>

          {/* Hamburger (always visible in header) */}
          {!isDrawer && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-muted/70 hover:bg-primary hover:text-white text-muted-foreground transition-all focus-accessible"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Avatar — clipped, no overflowing emoji in collapsed */}
          {!isCollapsed && (
            <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-violet text-sm overflow-hidden">
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.name || ''} className="w-full h-full object-cover" />
                : avatarInitials
              }
              {/* emoji badge only when expanded */}
              <span className="absolute bottom-0 right-0 text-[13px] leading-none bg-black/20 rounded-tl-lg px-0.5">{emoji}</span>
            </div>
          )}

          {/* Name + role (hidden when collapsed) */}
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground text-sm truncate leading-tight">{user.name}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r ${accentGrad} text-white mt-0.5`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          )}

          {/* Collapsed avatar */}
          {isCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-violet overflow-hidden">
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.name || ''} className="w-full h-full object-cover" />
                : avatarInitials
              }
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-hide" aria-label="Main navigation">
          {items.map((item) => {
            const exactMatch = item.path === `/${user.role}`;
            const active = exactMatch
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-accessible
                  ${isCollapsed ? 'justify-center' : ''}
                  ${active
                    ? 'text-white shadow-violet'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                style={active ? { background: 'linear-gradient(135deg, hsl(272 72% 38%), hsl(248 70% 52%))' } : {}}
                aria-current={active ? 'page' : undefined}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${active ? 'bg-white/20' : 'bg-muted/60 group-hover:bg-muted'}`}>
                  <item.icon className="w-4 h-4" aria-hidden />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`p-2 border-t border-border/50 flex items-center gap-2 shrink-0
          ${isCollapsed ? 'flex-col justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-sm transition-all focus-accessible
              ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'flex-1'}`}
            aria-label="Sign out"
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
          <ThemeToggle />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex bg-background stars-bg relative">
      {isDark && <div className="nebula-glow" aria-hidden />}

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to main content
      </a>

      {/* ── Desktop Sidebar ─────────────────────── */}
      <aside
        className={`hidden md:flex flex-col glass-sidebar shadow-card z-20 relative overflow-hidden sidebar-collapse h-screen sticky top-0
          ${collapsed ? 'w-[68px]' : 'w-64'}`}
        aria-label="Sidebar navigation"
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ───────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      {/* ── Mobile Drawer ────────────────────────── */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 glass-sidebar shadow-elevated z-50 flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
          <span className="font-display font-bold text-foreground">{user.name?.split(' ')[0]}</span>
          <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent isDrawer />
      </aside>

      {/* ── Mobile Top Bar ───────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 glass-sidebar border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────── */}
      <main id="main-content" className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 relative z-10 min-w-0" tabIndex={-1}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
