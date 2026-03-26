import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ClipboardList, MessageSquare, Users, Plus, UserCog, Megaphone, MessageCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCourses } from '@/hooks/useCourses';
import { useTeacherStats } from '@/hooks/useTeacherStats';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useForumThreads } from '@/hooks/useForums';
import EditProfileModal from '@/components/EditProfileModal';
import { formatDistanceToNow } from 'date-fns';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const { data: stats } = useTeacherStats();
  const { data: announcements = [] } = useAnnouncements(3);
  const { data: threads = [] } = useForumThreads(3);

  const [profileOpen, setProfileOpen] = useState(false);

  const statCards = [
    { label: 'My Courses',       value: courses.length,                      icon: BookOpen,    color: 'from-violet-500 to-indigo-600' },
    { label: 'Total Assignments', value: stats?.totalAssignments ?? '—',      icon: ClipboardList, color: 'from-indigo-500 to-blue-600' },
    { label: 'Students Enrolled', value: stats?.enrolledStudents ?? '—',     icon: Users,       color: 'from-purple-500 to-violet-600' },
    { label: 'Pending Reviews',   value: stats?.pendingReviews ?? '—',        icon: MessageSquare, color: 'from-fuchsia-500 to-purple-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Good day 👨‍🏫</p>
            <h1 className="font-display text-4xl font-bold text-foreground mb-1">
              Welcome, {user?.name?.split(' ')[0] || 'Teacher'}
            </h1>
            <p className="text-muted-foreground">Here's an overview of your teaching activities.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setProfileOpen(true)} variant="outline" className="gap-2 rounded-full">
              <UserCog className="w-4 h-4" /> Edit Profile
            </Button>
            <Link to="/teacher/courses">
              <Button className="gradient-violet text-white border-0 shadow-violet rounded-full gap-2">
                <Plus className="w-4 h-4" /> New Course
              </Button>
            </Link>
          </div>
        </div>

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

        {/* Courses + Announcements + Forums */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Your Courses</h2>
              <Link to="/teacher/courses" className="text-sm text-primary hover:underline font-medium">View All →</Link>
            </div>
            {courses.length === 0 ? (
              <div className="card-premium p-10 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No courses yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {courses.slice(0, 4).map((course, i) => (
                  <Link key={course.id} to={`/teacher/courses/${course.id}`} className="block">
                    <div className="card-premium p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all animate-fade-in group" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                      <span className="text-3xl mb-3 block">{course.icon || '📚'}</span>
                      <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{course.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                    </div>
                  </Link>
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
                <Link to="/teacher/announcements" className="text-xs text-primary hover:underline">View All →</Link>
              </div>
              {announcements.length === 0
                ? <p className="text-xs text-muted-foreground py-4 text-center">No announcements yet</p>
                : <div className="space-y-2">
                    {announcements.map(a => (
                      <div key={a.id} className="p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
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
                <Link to="/teacher/forums" className="text-xs text-primary hover:underline">View All →</Link>
              </div>
              {threads.length === 0
                ? <p className="text-xs text-muted-foreground py-4 text-center">No threads yet</p>
                : <div className="space-y-2">
                    {threads.map(t => (
                      <Link key={t.id} to={`/teacher/forums/${t.id}`} className="block p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
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
    </DashboardLayout>
  );
}
