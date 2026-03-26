import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, CheckCircle, Clock, GraduationCap, Link2, UserCog, Megaphone, MessageCircle, User, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLinkedStudent, useChildSubmissions } from '@/hooks/useParentData';
import { useAllCourses } from '@/hooks/useStudentCourses';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useForumThreads } from '@/hooks/useForums';
import EditProfileModal from '@/components/EditProfileModal';
import LinkStudentDialog from '@/components/LinkStudentDialog';
import { formatDistanceToNow } from 'date-fns';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: child, isLoading: loadingChild } = useLinkedStudent();
  const { data: submissions = [] } = useChildSubmissions(child?.id);
  const { data: courses = [] } = useAllCourses();
  const { data: announcements = [] } = useAnnouncements(3);
  const { data: threads = [] } = useForumThreads(3);

  const [profileOpen, setProfileOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const completedAssignments = submissions.filter((s: any) => s.score != null).length;
  const pendingAssignments = submissions.filter((s: any) => s.score == null).length;

  const statCards = [
    { label: 'Courses Available',    value: courses.length,        icon: BarChart3,   color: 'from-violet-500 to-indigo-600' },
    { label: 'Assignments Done',     value: completedAssignments,  icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending',              value: pendingAssignments,    icon: Clock,       color: 'from-amber-500 to-orange-600' },
    { label: 'Progress Score',       value: completedAssignments > 0
        ? `${Math.round((completedAssignments / (completedAssignments + pendingAssignments)) * 100)}%`
        : '—',
      icon: Award, color: 'from-fuchsia-500 to-purple-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Parent Portal</p>
            <h1 className="font-display text-4xl font-bold text-foreground mb-1">
              {child ? `${child.name}'s Dashboard` : 'Parent Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {child ? `Monitoring ${child.name}'s learning journey` : "Link your child's account to get started"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setProfileOpen(true)} variant="outline" className="gap-2 rounded-full">
              <UserCog className="w-4 h-4" /> Edit Profile
            </Button>
            <Button onClick={() => setLinkOpen(true)} className="gradient-violet text-white border-0 shadow-violet rounded-full gap-2">
              <Link2 className="w-4 h-4" /> {child ? 'Manage Link' : 'Link Student'}
            </Button>
          </div>
        </div>

        {/* Child card */}
        {loadingChild && <div className="h-16 w-56 bg-muted animate-pulse rounded-2xl" />}
        {!loadingChild && child && (
          <div className="inline-flex items-center gap-3 card-premium px-5 py-3 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-violet">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{child.name}</p>
              <p className="text-xs text-muted-foreground">{child.email}</p>
            </div>
          </div>
        )}
        {!loadingChild && !child && (
          <button onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:shadow-md transition-all">
            <User className="w-5 h-5" />
            <div className="text-left">
              <p className="text-sm font-semibold">No student linked yet</p>
              <p className="text-xs opacity-75">Click here to link your child's account →</p>
            </div>
          </button>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="card-premium p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-violet`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-display font-bold text-foreground mb-0.5">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Course list + widgets */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submissions list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Recent Submissions</h2>
              <Link to="/parent/progress" className="text-sm text-primary hover:underline font-medium">View Progress →</Link>
            </div>
            {submissions.length === 0 ? (
              <div className="card-premium p-10 text-center">
                <CheckCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{child ? 'No assignments submitted yet.' : 'Link a student to see their submissions.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.id} className="card-premium p-4 flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.score != null ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'}`}>
                      {s.score != null ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{(s.assignments as any)?.title || 'Assignment'}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.score != null ? `Score: ${s.score}/${s.total_questions}` : 'Pending review'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Announcements widget */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Announcements</h3>
                </div>
                <Link to="/parent/announcements" className="text-xs text-primary hover:underline">View All →</Link>
              </div>
              {announcements.length === 0
                ? <p className="text-xs text-muted-foreground py-4 text-center">No announcements yet</p>
                : <div className="space-y-2">
                    {announcements.map(a => (
                      <div key={a.id} className="p-3 rounded-xl bg-muted/50">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{a.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Forums widget */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground">Forum Threads</h3>
                </div>
                <Link to="/parent/forums" className="text-xs text-primary hover:underline">View All →</Link>
              </div>
              {threads.length === 0
                ? <p className="text-xs text-muted-foreground py-4 text-center">No threads yet</p>
                : <div className="space-y-2">
                    {threads.map(t => (
                      <Link key={t.id} to={`/parent/forums/${t.id}`} className="block p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.reply_count} replies · {t.author_name}</p>
                      </Link>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <LinkStudentDialog open={linkOpen} onOpenChange={setLinkOpen} />
    </DashboardLayout>
  );
}
