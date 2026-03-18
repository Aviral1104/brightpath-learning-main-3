import DashboardLayout from '@/components/DashboardLayout';
import { useStudentAssignments, useStudentSubmissions, useSubmitAssignment, FullAssignment } from '@/hooks/useAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TextToSpeech from '@/components/TextToSpeech';

export default function StudentAssignments() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useStudentAssignments();
  const { data: submissions } = useStudentSubmissions();
  const submitAssignment = useSubmitAssignment();

  const submittedMap = new Map((submissions || []).map(s => [s.assignment_id, s]));

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = (assignment: FullAssignment) => {
    submitAssignment.mutate(
      { assignment, answers: selectedAnswers },
      {
        onSuccess: () => {
          setSelectedAnswers({});
          setActiveAssignment(null);
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">My Assignments</h1>
          <p className="text-muted-foreground text-accessible">Complete your assignments at your own pace.</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading assignments...</p>
        ) : !assignments || assignments.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4" aria-hidden="true">📝</span>
            <p className="text-muted-foreground text-lg">No assignments available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = submittedMap.get(assignment.id);
              const submitted = !!submission;
              const isActive = activeAssignment === assignment.id;

              return (
                <div key={assignment.id} className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                  <button
                    onClick={() => setActiveAssignment(isActive ? null : assignment.id)}
                    className="w-full p-6 flex items-center justify-between text-left focus-accessible"
                    aria-expanded={isActive}
                    aria-controls={`assignment-panel-${assignment.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${submitted ? 'bg-success/10' : 'bg-primary/10'}`} aria-hidden="true">
                        {submitted ? <CheckCircle className="w-6 h-6 text-success" /> : <Circle className="w-6 h-6 text-primary" />}
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-bold text-foreground">{assignment.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {assignment.course_icon} {assignment.course_title}
                          {assignment.due_date && ` • Due: ${assignment.due_date}`}
                        </p>
                      </div>
                    </div>
                    {submitted && (
                      <span className="font-display font-bold text-success text-xl" aria-label={`Score: ${submission.score} out of ${submission.total_questions}`}>
                        {submission.score}/{submission.total_questions}
                      </span>
                    )}
                  </button>

                  {isActive && !submitted && (
                    <div id={`assignment-panel-${assignment.id}`} className="px-6 pb-6 space-y-4 animate-fade-in">
                      {assignment.questions.map((q, qi) => (
                        <div key={q.id} className="bg-muted/50 rounded-lg p-5">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <p className="font-semibold text-foreground text-accessible flex-1">
                              {qi + 1}. {q.question}
                            </p>
                            <TextToSpeech text={q.question} label={`Read question ${qi + 1} aloud`} />
                          </div>
                          <div className="grid gap-2" role="radiogroup" aria-label={`Options for question ${qi + 1}`}>
                            {q.options.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => handleSelect(q.id, opt.id)}
                                role="radio"
                                aria-checked={selectedAnswers[q.id] === opt.id}
                                className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all focus-accessible ${
                                  selectedAnswers[q.id] === opt.id
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-card border-border text-foreground hover:bg-muted'
                                }`}
                              >
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => handleSubmit(assignment)}
                        disabled={submitAssignment.isPending || assignment.questions.some(q => !selectedAnswers[q.id])}
                        className="w-full py-6 text-lg font-semibold"
                      >
                        {submitAssignment.isPending ? 'Submitting...' : 'Submit Assignment'}
                      </Button>
                    </div>
                  )}

                  {isActive && submitted && submission?.feedback && (
                    <div id={`assignment-panel-${assignment.id}`} className="px-6 pb-6 animate-fade-in">
                      <div className="bg-primary/5 rounded-lg p-4">
                        <p className="text-sm font-semibold text-primary mb-1">Teacher Feedback</p>
                        <p className="text-sm text-foreground leading-relaxed">{submission.feedback}</p>
                        <div className="mt-2">
                          <TextToSpeech text={submission.feedback} label="Read feedback aloud" />
                        </div>
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
