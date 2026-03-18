import DashboardLayout from '@/components/DashboardLayout';
import { useTeacherSubmissions, useGiveFeedback } from '@/hooks/useAssignments';
import { MessageSquare, Star, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function TeacherFeedback() {
  const { data: submissions, isLoading } = useTeacherSubmissions();
  const giveFeedback = useGiveFeedback();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [insightsText, setInsightsText] = useState('');

  const startEditing = (sub: any) => {
    setEditingId(sub.id);
    setFeedbackText(sub.feedback || '');
    setInsightsText(sub.insights || '');
  };

  const handleSave = (submissionId: string) => {
    giveFeedback.mutate(
      { submissionId, feedback: feedbackText, insights: insightsText || undefined },
      { onSuccess: () => setEditingId(null) }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Student Feedback</h1>
          <p className="text-muted-foreground">Review submissions and provide personalized feedback.</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading submissions...</p>
        ) : !submissions || submissions.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📬</span>
            <p className="text-muted-foreground text-lg">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub: any) => {
              const scorePercent = sub.total_questions > 0 ? Math.round((sub.score / sub.total_questions) * 100) : 0;
              const isEditing = editingId === sub.id;

              return (
                <div key={sub.id} className="bg-card rounded-xl border border-border p-6 shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold text-foreground">{sub.student_name}</h2>
                      <p className="text-sm text-muted-foreground">{sub.assignment_title}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-2xl font-bold ${scorePercent >= 80 ? 'text-success' : scorePercent >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        {scorePercent}%
                      </p>
                      <p className="text-xs text-muted-foreground">{sub.score}/{sub.total_questions} correct</p>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-3 mb-4">
                    <div
                      className={`h-3 rounded-full transition-all ${scorePercent >= 80 ? 'bg-success' : scorePercent >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Feedback</label>
                        <Textarea
                          value={feedbackText}
                          onChange={e => setFeedbackText(e.target.value)}
                          placeholder="Write feedback for the student..."
                          maxLength={2000}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Performance Insights (optional)</label>
                        <Textarea
                          value={insightsText}
                          onChange={e => setInsightsText(e.target.value)}
                          placeholder="Add performance insights..."
                          maxLength={2000}
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSave(sub.id)} disabled={giveFeedback.isPending} className="gap-2">
                          <Send className="w-4 h-4" />
                          {giveFeedback.isPending ? 'Saving...' : 'Save Feedback'}
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {sub.feedback ? (
                        <div className="bg-primary/5 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">Feedback</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{sub.feedback}</p>
                        </div>
                      ) : null}

                      {sub.insights ? (
                        <div className="bg-secondary/10 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-secondary" />
                            <span className="text-sm font-semibold text-secondary">Performance Insights</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{sub.insights}</p>
                        </div>
                      ) : null}

                      <Button variant="outline" size="sm" onClick={() => startEditing(sub)} className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {sub.feedback ? 'Edit Feedback' : 'Give Feedback'}
                      </Button>
                    </>
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
