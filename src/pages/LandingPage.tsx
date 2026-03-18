import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const roles = [
  {
    label: 'Teacher',
    description: 'Create courses, design assignments, and provide personalised feedback for your students.',
    emoji: '👨‍🏫',
    gradient: 'gradient-teacher',
    accent: 'border-primary/30 hover:border-primary',
  },
  {
    label: 'Student',
    description: 'Access your courses, study at your own pace, and complete assignments with built-in TTS support.',
    emoji: '👨‍🎓',
    gradient: 'gradient-student',
    accent: 'border-secondary/30 hover:border-secondary',
  },
  {
    label: 'Parent',
    description: "Monitor your child's progress, view teacher feedback, and stay connected with their learning journey.",
    emoji: '👨‍👩‍👧',
    gradient: 'gradient-parent',
    accent: 'border-accent/30 hover:border-accent',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (isAuthenticated && user) navigate(`/${user.role}`);
  }, [isAuthenticated, user, navigate]);

  return (
    <div className={`min-h-screen stars-bg ${isDark ? '' : ''} bg-background relative overflow-hidden`}>
      {/* Dark mode nebula */}
      {isDark && <div className="nebula-glow" aria-hidden="true" />}

      {/* Light mode sky backdrop */}
      {!isDark && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, hsl(200 85% 78%) 0%, hsl(205 70% 92%) 60%, hsl(210 50% 97%) 100%)' }} />
      )}

      {/* ── Header ───────────────────────────────── */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">

        <div className="inline-flex items-center gap-2 bg-card/70 backdrop-blur-sm border border-border/60 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in shadow-soft">
          <span className="text-lg" aria-hidden="true">✨</span>
          Inclusive Learning for Everyone
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-in leading-tight" style={{ animationDelay: '0.1s' }}>
          Learn Without<br />
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Boundaries
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in mb-10" style={{ animationDelay: '0.2s' }}>
          An accessible education platform designed for&nbsp;
          <strong className="text-foreground font-semibold">specially-abled students</strong>,
          connecting teachers, students, and parents in one unified space.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 hover:shadow-glow transition-all duration-200 hover:-translate-y-0.5 focus-accessible"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground font-semibold rounded-xl border border-border hover:bg-card hover:shadow-card transition-all duration-200 hover:-translate-y-0.5 focus-accessible"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ── Role Cards ───────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <button
              key={r.label}
              id={`role-${r.label.toLowerCase()}`}
              onClick={() => navigate('/auth')}
              className={`group bg-card/80 backdrop-blur-md rounded-2xl p-8 shadow-card hover:shadow-elevated transition-all duration-300 text-left focus-accessible animate-slide-up border ${r.accent} hover:-translate-y-1.5`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl ${r.gradient} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-md`} aria-hidden="true">
                {r.emoji}
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">{r.label} Portal</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{r.description}</p>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                Get Started <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>

        {/* Features strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: '🔊', label: 'Text-to-Speech' },
            { icon: '⏱️', label: 'Focus Timer' },
            { icon: '🌙', label: 'Dark Mode' },
            { icon: '♿', label: 'WCAG Accessible' },
          ].map((f) => (
            <div key={f.label} className="bg-card/60 backdrop-blur border border-border/50 rounded-xl py-4 px-3 animate-fade-in">
              <span className="text-2xl block mb-1" aria-hidden="true">{f.icon}</span>
              <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/50 bg-card/40 backdrop-blur-sm py-6 text-center text-sm text-muted-foreground">
        <p>Brightpath Learning — Empowering Inclusive Education</p>
      </footer>
    </div>
  );
}
