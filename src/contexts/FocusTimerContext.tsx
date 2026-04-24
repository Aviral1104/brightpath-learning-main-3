import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Phase = 'focus' | 'break';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

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

interface FocusTimerContextType {
  phase: Phase;
  secondsLeft: number;
  running: boolean;
  sessions: number;
  toggle: () => void;
  reset: () => void;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `brightpath-focus-sessions-${user?.id ?? 'anon'}`;

  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(storageKey) || '0', 10); } catch { return 0; }
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(phase);
  const sessionsRef = useRef(sessions);
  const storageKeyRef = useRef(storageKey);

  // Keep refs in sync so the interval closure always reads the latest values
  phaseRef.current = phase;
  sessionsRef.current = sessions;
  storageKeyRef.current = storageKey;

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
          if (phaseRef.current === 'focus') {
            const next = sessionsRef.current + 1;
            setSessions(next);
            try { localStorage.setItem(storageKeyRef.current, String(next)); } catch {}
            setPhase('break');
            return BREAK_SECONDS;
          } else {
            setPhase('focus');
            return FOCUS_SECONDS;
          }
        }
        return s - 1;
      });
    }, 1000);
    return clear;
  }, [running, clear]);

  const toggle = useCallback(() => setRunning((r) => !r), []);

  const reset = useCallback(() => {
    setRunning(false);
    setPhase('focus');
    setSecondsLeft(FOCUS_SECONDS);
  }, []);

  return (
    <FocusTimerContext.Provider value={{ phase, secondsLeft, running, sessions, toggle, reset }}>
      {children}
    </FocusTimerContext.Provider>
  );
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider');
  return ctx;
}
