import DashboardLayout from '@/components/DashboardLayout';
import { useAllCourses } from '@/hooks/useStudentCourses';
import { useLinkedStudent, useChildSubmissions } from '@/hooks/useParentData';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Award, TrendingUp, Clock, User, GraduationCap, CheckCircle } from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading: loadingCourses } = useAllCourses();
  const { data: child, isLoading: loadingChild } = useLinkedStudent();
  const { data: submissions = [] } = useChildSubmissions(child?.id);

  const totalChapters = courses.reduce((a, c) => a + c.chapters.length, 0);
  const totalLessons = courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.subchapters.length, 0), 0);
  const completedAssignments = submissions.filter((s: any) => s.score != null).length;

  const stats = [
    { label: 'Courses Available', value: courses.length, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Chapters', value: totalChapters, icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Total Lessons', value: totalLessons, icon: Award, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Assignments Done', value: completedAssignments, icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Hero header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Parent Dashboard
            </h1>
            <p className="text-muted-foreground">
              {child ? `Monitoring ${child.name}'s learning journey` : "Monitor your child's learning journey"}
            </p>
          </div>

          {/* Child profile card */}
          {loadingChild ? (
            <div className="h-16 w-48 bg-muted animate-pulse rounded-xl" />
          ) : child ? (
            <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-soft animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{child.name}</p>
                <p className="text-xs text-muted-foreground">{child.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-400/30 rounded-xl px-4 py-3 text-amber-700 dark:text-amber-400">
              <User className="w-5 h-5" aria-hidden="true" />
              <p className="text-sm font-medium">No student linked yet</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-5 border border-border shadow-soft animate-slide-up hover:shadow-elevated transition-all hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-4`} aria-hidden="true">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-display font-bold text-foreground mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Course overview */}
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Available Courses</h2>
          {loadingCourses && <p className="text-muted-foreground">Loading...</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((course, i) => (
              <div
                key={course.id}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-elevated transition-all hover:-translate-y-0.5 animate-slide-up"
                style={{ animationDelay: `${0.1 + i * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl" aria-hidden="true">{course.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground">By {(course as any).teacherName || 'Teacher'}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                <div className="flex gap-3 pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{course.chapters.length} chapters</span>
                  <span className="text-xs text-muted-foreground">{course.chapters.reduce((a, ch) => a + ch.subchapters.length, 0)} lessons</span>
                </div>
              </div>
            ))}
          </div>
          {!loadingCourses && courses.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <span className="text-5xl block mb-4" aria-hidden="true">📚</span>
              <p className="text-muted-foreground">No courses available yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
