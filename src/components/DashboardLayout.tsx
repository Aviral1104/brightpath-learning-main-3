import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, MessageSquare, LayoutDashboard, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

const navItems = {
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
    { label: 'Courses', icon: BookOpen, path: '/teacher/courses' },
    { label: 'Assignments', icon: ClipboardList, path: '/teacher/assignments' },
    { label: 'Feedback', icon: MessageSquare, path: '/teacher/feedback' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
    { label: 'My Courses', icon: BookOpen, path: '/student/courses' },
    { label: 'Assignments', icon: ClipboardList, path: '/student/assignments' },
    { label: 'My Feedback', icon: MessageSquare, path: '/student/feedback' },
  ],
  parent: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/parent' },
    { label: 'Progress', icon: BarChart3, path: '/parent/progress' },
    { label: 'Feedback', icon: MessageSquare, path: '/parent/feedback' },
  ],
};

const roleGradient = {
  teacher: 'gradient-teacher',
  student: 'gradient-student',
  parent: 'gradient-parent',
};

const roleAccentColor = {
  teacher: 'hsl(215 85% 50%)',
  student: 'hsl(170 55% 42%)',
  parent: 'hsl(30 90% 55%)',
};

/** Pill-style animated day/night toggle, inspired by the reference screenshots */
function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex items-center rounded-full transition-all duration-500 focus-accessible
        ${compact ? 'w-12 h-6' : 'w-14 h-7'}
        ${isDark
          ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 border border-purple-500/40 shadow-[0_0_12px_hsl(270_80%_50%/0.4)]'
          : 'bg-gradient-to-r from-amber-100 to-sky-200 border border-sky-300/60 shadow-[0_0_12px_hsl(200_80%_70%/0.4)]'
        }`}
    >
      {/* Track icons */}
      <span className={`absolute left-1 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`}>⭐</span>
      <span className={`absolute right-1 text-[10px] transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
      {/* Thumb */}
      <span
        className={`absolute flex items-center justify-center rounded-full shadow-md transition-all duration-500 font-medium
          ${compact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'}
          ${isDark
            ? `${compact ? 'translate-x-[26px]' : 'translate-x-[31px]'} bg-gradient-to-br from-purple-600 to-indigo-700 text-white`
            : 'translate-x-[2px] bg-white text-amber-500'
          }`}
      >
        {isDark ? '🌙' : '☀'}
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

  if (!user) return null;

  const items = navItems[user.role] || [];
  const gradient = roleGradient[user.role] || 'gradient-teacher';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background stars-bg">
      {/* Night sky nebula glow (dark mode only) */}
      {isDark && <div className="nebula-glow" aria-hidden="true" />}

      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:shadow-elevated focus-accessible"
      >
        Skip to main content
      </a>

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-64 flex flex-col border-r border-border bg-card/90 backdrop-blur-xl shadow-card hidden md:flex relative z-10" aria-label="Sidebar navigation">
        {/* Header */}
        <div className={`p-5 ${gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl shadow-md ring-2 ring-white/30" aria-hidden="true">
              {user.role === 'teacher' ? '👨‍🏫' : user.role === 'student' ? '👨‍🎓' : '👨‍👩‍👧'}
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm">{user.name}</p>
              <p className="text-xs text-white/75 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5" role="navigation" aria-label="Main navigation">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all focus-accessible
                  ${isActive
                    ? 'bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${isActive ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground group-hover:bg-muted text-foreground'}`}>
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border flex items-center gap-2">
          <Button
            variant="ghost"
            className="flex-1 justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-sm rounded-xl"
            onClick={handleLogout}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign Out
          </Button>
          <ThemeToggle compact />
        </div>
      </aside>

      {/* ── Mobile Header ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-2.5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base" aria-hidden="true">
              {user.role === 'teacher' ? '👨‍🏫' : user.role === 'student' ? '👨‍🎓' : '👨‍👩‍👧'}
            </div>
            <span className="font-display font-semibold text-sm text-foreground">{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Sign out" className="text-muted-foreground">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 mt-2 overflow-x-auto pb-1 scrollbar-hide" role="navigation" aria-label="Main navigation">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border
                  ${isActive
                    ? 'bg-primary text-primary-foreground border-primary/50 shadow-sm'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="w-3.5 h-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main Content ────────────────────────── */}
      <main id="main-content" className="flex-1 overflow-auto md:p-8 p-4 pt-28 md:pt-8 relative z-10" tabIndex={-1}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
