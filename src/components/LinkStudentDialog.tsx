import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedStudent } from '@/hooks/useParentData';
import { useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Search, GraduationCap, Link2, Unlink, Loader2, CheckCircle } from 'lucide-react';

interface LinkStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentPreview {
  id: string;
  name: string;
  email: string;
  school?: string;
}

export default function LinkStudentDialog({ open, onOpenChange }: LinkStudentDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: linkedStudent } = useLinkedStudent();

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<StudentPreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 8) { toast.error('Student code must be exactly 8 characters'); return; }
    setSearching(true);
    setPreview(null);
    try {
      // Student code is first 8 chars of uid (no dashes)
      const snap = await getDocs(query(collection(db, 'profiles'), where('role', '==', 'student')));
      const match = snap.docs.find(d => {
        const shortCode = d.id.replace(/-/g, '').slice(0, 8).toUpperCase();
        return shortCode === trimmed;
      });
      if (!match) { toast.error('No student found with that code'); return; }
      const p = match.data();
      setPreview({ id: match.id, name: p.name, email: p.email, school: p.school });
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!preview || !user?.id) return;
    setLinking(true);
    try {
      // Remove existing link first
      const existing = await getDocs(query(collection(db, 'parent_student_links'), where('parent_id', '==', user.id)));
      await Promise.all(existing.docs.map(d => deleteDoc(d.ref)));
      await addDoc(collection(db, 'parent_student_links'), {
        parent_id: user.id,
        student_id: preview.id,
        created_at: serverTimestamp(),
      });
      queryClient.invalidateQueries({ queryKey: ['linked-student'] });
      toast.success(`Linked to ${preview.name}!`);
      setCode(''); setPreview(null);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Linking failed');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!user?.id) return;
    setUnlinking(true);
    try {
      const snap = await getDocs(query(collection(db, 'parent_student_links'), where('parent_id', '==', user.id)));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      queryClient.invalidateQueries({ queryKey: ['linked-student'] });
      toast.success('Student unlinked.');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Unlink failed');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" /> Link Student
          </DialogTitle>
        </DialogHeader>

        {linkedStudent && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300">Currently Linked</p>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{linkedStudent.name}</p>
                  <p className="text-xs text-muted-foreground">{linkedStudent.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={unlinking}
                className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0 text-xs gap-1">
                {unlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                Unlink
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-3 text-sm text-violet-700 dark:text-violet-300">
            Ask your child to open their Edit Profile — their <strong>8-character Student Code</strong> will be displayed there.
          </div>
          <div>
            <Label htmlFor="student-code">Student Code</Label>
            <div className="flex gap-2 mt-1">
              <Input id="student-code" value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. A1B2C3D4" className="tracking-widest font-mono uppercase" maxLength={8} />
              <Button onClick={handleSearch} disabled={searching || code.trim().length !== 8}
                variant="outline" className="shrink-0 gap-1.5 rounded-xl">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Find
              </Button>
            </div>
          </div>
          {preview && (
            <div className="bg-muted/60 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  {preview.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.email}</p>
                  {preview.school && <p className="text-xs text-muted-foreground">{preview.school}</p>}
                </div>
              </div>
              <Button onClick={handleLink} disabled={linking}
                className="w-full rounded-full gradient-violet text-white border-0 shadow-violet gap-2">
                {linking ? <><Loader2 className="w-4 h-4 animate-spin" />Linking...</> : <><Link2 className="w-4 h-4" />Link to {preview.name}</>}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
