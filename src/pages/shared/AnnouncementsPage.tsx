import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2, Loader2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { data: announcements = [], isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required'); return; }
    setSaving(true);
    try {
      await createMutation.mutateAsync({ title, body });
      toast.success('Announcement posted!');
      setTitle(''); setBody(''); setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center shadow-violet">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              Announcements
            </h1>
            <p className="text-muted-foreground">Stay up to date with the latest from your teachers.</p>
          </div>
          {user?.role === 'teacher' && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gradient-violet text-white border-0 shadow-violet rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancel' : 'New Announcement'}
            </Button>
          )}
        </div>

        {/* Create Form (Teachers) */}
        {showForm && user?.role === 'teacher' && (
          <div className="card-premium p-6 animate-fade-in-scale">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">New Announcement</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="ann-title">Title *</Label>
                <Input id="ann-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ann-body">Message *</Label>
                <Textarea id="ann-body" value={body} onChange={e => setBody(e.target.value)} placeholder="Write your announcement..." className="mt-1 resize-none" rows={4} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={saving} className="gradient-violet text-white border-0 rounded-full shadow-violet gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting...</> : 'Post Announcement'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-premium p-6 animate-pulse">
                <div className="h-5 bg-muted rounded-lg w-2/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && announcements.length === 0 && (
          <div className="card-premium p-16 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-xl text-foreground mb-1">No announcements yet</p>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'teacher' ? 'Post your first announcement above.' : 'Your teachers haven\'t posted any announcements yet.'}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {announcements.map((a, i) => (
            <div
              key={a.id}
              className="card-premium p-6 hover:shadow-elevated transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-violet flex items-center justify-center">
                      <Megaphone className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-primary">{a.teacher_name}</span>
                  </div>
                  <h3 className="font-display font-semibold text-foreground text-lg mb-2">{a.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </div>
                </div>
                {user?.role === 'teacher' && user.id === a.teacher_id && (
                  <button
                    onClick={() => deleteMutation.mutate(a.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
