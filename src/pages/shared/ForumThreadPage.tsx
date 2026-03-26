import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useForumThread, useForumReplies, useCreateReply } from '@/hooks/useForums';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, Clock, ArrowLeft, Send, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ForumThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const { data: thread, isLoading: loadingThread } = useForumThread(threadId);
  const { data: replies = [], isLoading: loadingReplies } = useForumReplies(threadId);
  const createReply = useCreateReply();

  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  const roleBase = location.pathname.split('/')[1];
  const canReply = user?.role === 'teacher' || user?.role === 'student';

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !threadId) return;
    setSending(true);
    try {
      await createReply.mutateAsync({ thread_id: threadId, body: replyBody });
      setReplyBody('');
      toast.success('Reply posted!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const avatarFor = (name: string) => (name || 'M').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        {/* Back */}
        <Link
          to={`/${roleBase}/forums`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Forums
        </Link>

        {/* Thread */}
        {loadingThread && (
          <div className="card-premium p-8 animate-pulse">
            <div className="h-7 bg-muted rounded-lg w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        )}

        {thread && (
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full gradient-violet flex items-center justify-center text-white text-xs font-bold">
                {avatarFor(thread.author_name || '')}
              </div>
              <span className="text-sm font-medium text-primary">{thread.author_name}</span>
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">{thread.title}</h1>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
          </div>
        )}

        {/* Replies section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </h2>
          </div>

          {loadingReplies && (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="card-premium p-5 animate-pulse h-20" />)}
            </div>
          )}

          {!loadingReplies && replies.length === 0 && (
            <div className="card-premium p-10 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {canReply ? 'Be the first to reply!' : 'No replies yet.'}
              </p>
            </div>
          )}

          {replies.map((reply, i) => (
            <div
              key={reply.id}
              className="card-premium p-5 animate-slide-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {avatarFor(reply.author_name || '')}
                </div>
                <span className="text-sm font-medium text-foreground">{reply.author_name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap pl-9">{reply.body}</p>
            </div>
          ))}
        </div>

        {/* Reply composer */}
        {canReply && (
          <div className="card-premium p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Add a Reply</h3>
            <form onSubmit={handleReply} className="space-y-3">
              <Textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write your reply..."
                className="resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sending || !replyBody.trim()}
                  className="gradient-violet text-white border-0 rounded-full shadow-violet gap-2"
                >
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Posting...</> : <><Send className="w-4 h-4" />Post Reply</>}
                </Button>
              </div>
            </form>
          </div>
        )}

        {user?.role === 'parent' && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">Parents can view but not reply to discussions</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
