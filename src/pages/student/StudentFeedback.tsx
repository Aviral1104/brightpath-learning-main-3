import DashboardLayout from '@/components/DashboardLayout';
import { useStudentSubmissions, useStudentAssignments } from '@/hooks/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Star } from 'lucide-react';
import TextToSpeech from '@/components/TextToSpeech';

export default function StudentFeedback() {
  const { user } = useAuth();
  const { data: submissions } = useStudentSubmissions();
  const { data: assignments } = useStudentAssignments();

  const assignmentMap = Object.fromEntries((assignments || []).map(a => [a.id, a]));
  const withFeedback = (submissions || []).filter(s => s.feedback);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">My Feedback</h1>
          <p className="text-muted-foreground text-accessible">See what your teacher says about your work.</p>
        </div>

        {withFeedback.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4" aria-hidden="true">📝</span>
            <p className="text-muted-foreground text-lg">No feedback yet. Complete an assignment to receive feedback!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withFeedback.map((sub) => {
              const assignment = assignmentMap[sub.assignment_id];
              const scorePercent = sub.total_questions > 0 ? Math.round((sub.score / sub.total_questions) * 100) : 0;
              return (
                <div key={sub.id} className="bg-card rounded-xl border border-border p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold text-foreground">{assignment?.title || 'Assignment'}</h2>
                    <span className={`font-display text-xl font-bold ${scorePercent >= 80 ? 'text-success' : 'text-warning'}`}>
                      {scorePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-4" role="progressbar" aria-valuenow={scorePercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Score: ${scorePercent}%`}>
                    <div className={`h-2 rounded-full ${scorePercent >= 80 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${scorePercent}%` }} />
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span className="text-sm font-semibold text-primary">Teacher's Message</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{sub.feedback}</p>
                    <div className="mt-2">
                      <TextToSpeech text={sub.feedback || ''} label="Read teacher feedback aloud" />
                    </div>
                  </div>
                  {sub.insights && (
                    <div className="bg-secondary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-secondary" aria-hidden="true" />
                        <span className="text-sm font-semibold text-secondary">Insights</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{sub.insights}</p>
                      <div className="mt-2">
                        <TextToSpeech text={sub.insights} label="Read insights aloud" />
                      </div>
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
