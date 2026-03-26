import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Loader2 } from 'lucide-react';
import { UserRole } from '@/contexts/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/integrations/firebase/client';
import { toast } from 'sonner';

const DEV_BYPASS_STORAGE_KEY = 'dev_bypass_user';

const roles: { role: UserRole; emoji: string; label: string; path: string }[] = [
  { role: 'teacher', emoji: '👨‍🏫', label: 'Teacher', path: '/teacher' },
  { role: 'student', emoji: '👨‍🎓', label: 'Student', path: '/student' },
  { role: 'parent', emoji: '👨‍👩‍👧', label: 'Parent', path: '/parent' },
];

const DEV_ACCOUNTS: Record<UserRole, { email: string; password: string }> = {
  teacher: { email: 'dev-teacher@brightpath.local', password: 'DevPass123!' },
  student: { email: 'dev-student@brightpath.local', password: 'DevPass123!' },
  parent: { email: 'dev-parent@brightpath.local', password: 'DevPass123!' },
};

function saveLocalBypassUser(role: UserRole, label: string, email: string) {
  try {
    sessionStorage.setItem(DEV_BYPASS_STORAGE_KEY, JSON.stringify({
      id: `dev-${role}`, role, name: `Dev ${label}`, email, school: 'Dev School',
    }));
  } catch {}
}

export default function DevBypass() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<UserRole | null>(null);
  const navigate = useNavigate();

  const handleSelect = async (r: typeof roles[number]) => {
    setLoading(r.role);
    const creds = DEV_ACCOUNTS[r.role];
    try {
      // Try sign in
      await signInWithEmailAndPassword(auth, creds.email, creds.password);
    } catch (signInErr: any) {
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        try {
          // Create dev account
          const { user } = await createUserWithEmailAndPassword(auth, creds.email, creds.password);
          await setDoc(doc(db, 'profiles', user.uid), {
            name: `Dev ${r.label}`, email: creds.email, role: r.role,
            school: 'Dev School', phone: '', bio: '', avatar_url: '', expertise: [],
            created_at: serverTimestamp(), updated_at: serverTimestamp(),
          });
        } catch (signUpErr: any) {
          // Fall back to local bypass
          saveLocalBypassUser(r.role, r.label, creds.email);
          toast.warning(`Using local dev mode for ${r.label}`);
          setOpen(false);
          navigate(r.path);
          setLoading(null);
          return;
        }
      } else {
        // Network or other error — use local bypass
        saveLocalBypassUser(r.role, r.label, creds.email);
        toast.warning(`Using local dev mode for ${r.label}`);
        setOpen(false);
        navigate(r.path);
        setLoading(null);
        return;
      }
    }

    try { sessionStorage.removeItem(DEV_BYPASS_STORAGE_KEY); } catch {}
    toast.success(`Signed in as Dev ${r.label}`);
    setOpen(false);
    navigate(r.path);
    setLoading(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {open && (
        <div className="mb-2 bg-card border border-border rounded-xl shadow-elevated p-3 space-y-2 animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground px-1">Dev Access</p>
          {roles.map((r) => (
            <button key={r.role} onClick={() => handleSelect(r)} disabled={loading !== null}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground disabled:opacity-50">
              {loading === r.role ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{r.emoji}</span>}
              {r.label} Dashboard
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-muted border border-border shadow-soft flex items-center justify-center hover:bg-accent transition-colors"
        title="Developer Bypass">
        <Code2 className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
