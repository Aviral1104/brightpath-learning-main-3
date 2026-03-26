import DashboardLayout from '@/components/DashboardLayout';
import { useLinkedStudent, useChildSubmissions } from '@/hooks/useParentData';
import { MessageSquare, Star, User, Lock } from 'lucide-react';

export default function ParentFeedback() {
  const { data: child, isLoading: loadingChild } = useLinkedStudent();
  const { data: submissions = [], isLoading: loadingSubs } = useChildSubmissions(child?.id);

  const withFeedback = submissions.filter((s: any) => s.feedback);

  if (loadingChild) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
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
            Your account is not yet linked to a student. Please contact your school administrator to set up the parent-student connection.
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
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Teacher Feedback</h1>
            <p className="text-muted-foreground">
              Feedback received by <span className="font-semibold text-foreground">{child.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-primary">{child.name}</span>
          </div>
        </div>

        {loadingSubs ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : withFeedback.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <span className="text-5xl block mb-4" aria-hidden="true">💬</span>
            <p className="text-muted-foreground text-lg">{child.name} hasn't received any feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withFeedback.map((sub: any, i: number) => {
              const total = sub.total_questions || sub.totalQuestions || 1;
              const score = sub.score || 0;
              const scorePercent = Math.round((score / total) * 100);
              const assignmentTitle = sub.assignmentTitle || sub.assignments?.title || 'Assignment';
              return (
                <div
                  key={sub.id}
                  className="bg-card rounded-2xl border border-border p-6 shadow-soft animate-slide-up hover:shadow-elevated transition-all"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold text-foreground">{assignmentTitle}</h2>
                    <span className={`font-display text-xl font-bold ${scorePercent >= 80 ? 'text-success' : 'text-warning'}`}>
                      {scorePercent}%
                    </span>
                  </div>
                  <div
                    className="w-full bg-muted rounded-full h-2 mb-5"
                    role="progressbar" aria-valuenow={scorePercent} aria-valuemin={0} aria-valuemax={100}
                    aria-label={`${child.name}'s score: ${scorePercent}%`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all ${scorePercent >= 80 ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <div className="bg-primary/6 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-sm font-semibold text-primary">Teacher's Message</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{sub.feedback}</p>
                  </div>
                  {sub.insights && (
                    <div className="bg-secondary/8 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-secondary" aria-hidden="true" />
                        <p className="text-sm font-semibold text-secondary">Performance Insights</p>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{sub.insights}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
