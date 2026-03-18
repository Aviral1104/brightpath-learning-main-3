import DashboardLayout from '@/components/DashboardLayout';
import { useAllCourses } from '@/hooks/useStudentCourses';
import { useLinkedStudent, useChildSubmissions } from '@/hooks/useParentData';
import { Lock, User } from 'lucide-react';

export default function ParentProgress() {
  const { data: courses = [], isLoading: loadingCourses } = useAllCourses();
  const { data: child, isLoading: loadingChild } = useLinkedStudent();
  const { data: submissions = [] } = useChildSubmissions(child?.id);

  const getChildScore = (courseId: string) => {
    const courseSubs = submissions.filter((s: any) => {
      const assignment = s.assignments;
      return assignment && (assignment.course_id === courseId || assignment.course_title);
    });
    if (!courseSubs.length) return null;
    const total = courseSubs.reduce((a: number, s: any) => a + (s.total_questions || 0), 0);
    const score = courseSubs.reduce((a: number, s: any) => a + (s.score || 0), 0);
    return total > 0 ? Math.round((score / total) * 100) : null;
  };

  if (loadingChild) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!child) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">No Student Linked</h2>
          <p className="text-muted-foreground max-w-sm">
            Contact your school administrator to link your account to your child's profile.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Detailed Progress</h1>
            <p className="text-muted-foreground">
              Course-by-course breakdown for <span className="font-semibold text-foreground">{child.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">{child.name}</span>
          </div>
        </div>

        {loadingCourses && (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        )}

        <div className="space-y-4">
          {courses.map((course, i) => {
            const totalLessons = course.chapters.reduce((a, ch) => a + ch.subchapters.length, 0);
            const childScore = getChildScore(course.id);
            return (
              <div
                key={course.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-soft animate-slide-up hover:shadow-elevated transition-all"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">{course.icon || '📚'}</span>
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{course.title}</h2>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    </div>
                  </div>
                  {childScore !== null && (
                    <span className={`font-display text-xl font-bold ${childScore >= 80 ? 'text-success' : 'text-warning'}`}>
                      {childScore}%
                    </span>
                  )}
                </div>

                {childScore !== null && (
                  <div className="mb-5">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Assignment Score</span>
                      <span>{childScore}%</span>
                    </div>
                    <div
                      className="w-full bg-muted rounded-full h-2.5"
                      role="progressbar" aria-valuenow={childScore} aria-valuemin={0} aria-valuemax={100}
                    >
                      <div
                        className={`h-2.5 rounded-full transition-all ${childScore >= 80 ? 'bg-success' : 'bg-warning'}`}
                        style={{ width: `${childScore}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Chapters', value: course.chapters.length },
                    { label: 'Lessons', value: totalLessons },
                    { label: 'Instructor', value: (course as any).teacherName || 'Teacher' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="font-display font-bold text-foreground text-sm">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!loadingCourses && courses.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <span className="text-5xl block mb-4" aria-hidden="true">📊</span>
              <p className="text-muted-foreground">No courses to track yet.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
