import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type Phase = 'focus' | 'break';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export default function FocusTimer() {
  const { user } = useAuth();
  const storageKey = `brightpath-focus-sessions-${user?.id ?? 'anon'}`;

  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(storageKey) || '0', 10); } catch { return 0; }
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = phase === 'focus' ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!running) { clear(); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          beep();
          setRunning(false);
          if (phase === 'focus') {
            const next = sessions + 1;
            setSessions(next);
            try { localStorage.setItem(storageKey, String(next)); } catch {}
            setPhase('break');
            return BREAK_MINUTES * 60;
          } else {
            setPhase('focus');
            return FOCUS_MINUTES * 60;
          }
        }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [running, phase, sessions, storageKey, clear]);

  const reset = () => {
    setRunning(false);
    setPhase('focus');
    setSecondsLeft(FOCUS_MINUTES * 60);
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference - (progress / 100) * circumference;

  return (
    <div
      className="bg-card rounded-xl border border-border p-6 shadow-soft"
      role="region"
      aria-label="ADHD Focus Timer"
    >
      <div className="flex items-center gap-2 mb-5">
        <Timer className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="font-display font-semibold text-foreground">Focus Timer</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          Sessions today: <strong className="text-foreground">{sessions}</strong>
        </span>
      </div>

      <div className="flex flex-col items-center gap-5">
        {/* Circular progress */}
        <div className="relative w-36 h-36" aria-hidden="true">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={phase === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dash}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold text-foreground">{mins}:{secs}</span>
            <span className={`text-xs font-semibold capitalize ${phase === 'focus' ? 'text-primary' : 'text-secondary'}`}>
              {phase}
            </span>
          </div>
        </div>

        {/* Phase pill */}
        <div className="flex gap-3 text-sm">
          <span className={`px-3 py-1 rounded-full font-medium ${phase === 'focus' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            🧠 Focus — {FOCUS_MINUTES}m
          </span>
          <span className={`px-3 py-1 rounded-full font-medium ${phase === 'break' ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}`}>
            ☕ Break — {BREAK_MINUTES}m
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            onClick={() => setRunning((r) => !r)}
            className="gap-2"
            aria-label={running ? 'Pause timer' : 'Start timer'}
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Focus for {FOCUS_MINUTES} minutes, then take a {BREAK_MINUTES}-minute break. A beep will sound when time is up.
        </p>
      </div>
    </div>
  );
}
