import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useForumThreads, useCreateThread } from '@/hooks/useForums';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageCircle, Plus, Clock, MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function ForumsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { data: threads = [], isLoading } = useForumThreads();
  const createMutation = useCreateThread();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const roleBase = location.pathname.split('/')[1]; // 'teacher' | 'student' | 'parent'
  const canPost = user?.role === 'teacher' || user?.role === 'student';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required'); return; }
    setSaving(true);
    try {
      await createMutation.mutateAsync({ title, body });
      toast.success('Thread posted!');
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
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              Discussion Forums
            </h1>
            <p className="text-muted-foreground">
              {canPost ? 'Ask questions, share ideas, and discuss topics.' : 'Browse discussions from students and teachers.'}
            </p>
          </div>
          {canPost && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gradient-violet text-white border-0 shadow-violet rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancel' : 'New Thread'}
            </Button>
          )}
        </div>

        {/* Create Form */}
        {showForm && canPost && (
          <div className="card-premium p-6 animate-fade-in-scale">
            <h2 className="font-display text-lg font-semibold mb-4">Start a Discussion</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="th-title">Title *</Label>
                <Input id="th-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's your topic?" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="th-body">Description *</Label>
                <Textarea id="th-body" value={body} onChange={e => setBody(e.target.value)} placeholder="Provide more details..." className="mt-1 resize-none" rows={4} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={saving} className="gradient-violet text-white border-0 rounded-full shadow-violet gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting...</> : 'Post Thread'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Thread list */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-premium p-5 animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-muted rounded-xl shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && threads.length === 0 && (
          <div className="card-premium p-16 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-display text-xl text-foreground mb-1">No discussions yet</p>
            <p className="text-sm text-muted-foreground">
              {canPost ? 'Start the first thread!' : 'Discussions will appear here once posted.'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {threads.map((thread, i) => (
            <Link
              key={thread.id}
              to={`/${roleBase}/forums/${thread.id}`}
              className="block card-premium p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all animate-slide-up group"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center shrink-0 shadow-violet">
                  <MessageCircle className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{thread.body}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="font-medium text-primary">{thread.author_name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
