import DashboardLayout from '@/components/DashboardLayout';
import { useTeacherAssignments, useCreateAssignment, CreateAssignmentInput, FullAssignment } from '@/hooks/useAssignments';
import { useCourses } from '@/hooks/useCourses';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const difficultyColors: Record<string, string> = {
  easy: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  hard: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface QuestionDraft {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string; is_correct: boolean }[];
}

const emptyQuestion = (): QuestionDraft => ({
  question: '',
  difficulty: 'medium',
  options: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ],
});

export default function TeacherAssignments() {
  const { data: assignments, isLoading } = useTeacherAssignments();
  const { courses } = useCourses();
  const createAssignment = useCreateAssignment();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  const resetForm = () => {
    setTitle('');
    setCourseId('');
    setDifficulty('medium');
    setDueDate('');
    setQuestions([emptyQuestion()]);
    setShowForm(false);
  };

  const updateQuestion = (qi: number, field: keyof QuestionDraft, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const newOpts = q.options.map((o, j) => {
        if (field === 'is_correct') {
          return j === oi ? { ...o, is_correct: true } : { ...o, is_correct: false };
        }
        return j === oi ? { ...o, [field]: value } : o;
      });
      return { ...q, options: newOpts };
    }));
  };

  const addOption = (qi: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi ? { ...q, options: [...q.options, { text: '', is_correct: false }] } : q
    ));
  };

  const removeOption = (qi: number, oi: number) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q
    ));
  };

  const handleSubmit = () => {
    const input: CreateAssignmentInput = {
      title,
      course_id: courseId,
      difficulty,
      due_date: dueDate || undefined,
      questions,
    };
    createAssignment.mutate(input, { onSuccess: resetForm });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Assignments</h1>
            <p className="text-muted-foreground">Create and manage MCQ assignments for your students.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Assignment'}
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-soft space-y-6 animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground">Create New Assignment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Assignment title" maxLength={200} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Difficulty</label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Due Date</label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-foreground">Questions</h3>
                <Button variant="outline" size="sm" onClick={() => setQuestions(prev => [...prev, emptyQuestion()])} className="gap-1">
                  <Plus className="w-3 h-3" /> Add Question
                </Button>
              </div>

              {questions.map((q, qi) => (
                <div key={qi} className="bg-muted/50 rounded-lg p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Question {qi + 1}</label>
                      <Input
                        value={q.question}
                        onChange={e => updateQuestion(qi, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        maxLength={1000}
                      />
                    </div>
                    {questions.length > 1 && (
                      <Button variant="ghost" size="icon" className="text-destructive mt-5" onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qi))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Options (click radio to mark correct answer)</label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateOption(qi, oi, 'is_correct', true)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            opt.is_correct ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}
                        >
                          {opt.is_correct && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                        </button>
                        <Input
                          value={opt.text}
                          onChange={e => updateOption(qi, oi, 'text', e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1"
                          maxLength={500}
                        />
                        {q.options.length > 2 && (
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeOption(qi, oi)}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <Button variant="ghost" size="sm" onClick={() => addOption(qi)} className="text-xs gap-1">
                        <Plus className="w-3 h-3" /> Add Option
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createAssignment.isPending || !title.trim() || !courseId}
              className="w-full py-6 text-lg font-semibold"
            >
              {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        )}

        {/* Assignment List */}
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading assignments...</p>
        ) : !assignments || assignments.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📝</span>
            <p className="text-muted-foreground text-lg">No assignments yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-card rounded-xl border border-border p-6 shadow-soft">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{assignment.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.course_icon} {assignment.course_title}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border capitalize ${difficultyColors[assignment.difficulty]}`}>
                    {assignment.difficulty}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                  <span>{assignment.questions.length} questions</span>
                  {assignment.due_date && <span>Due: {assignment.due_date}</span>}
                </div>
                <div className="space-y-3">
                  {assignment.questions.map((q, qi) => (
                    <div key={q.id} className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium text-foreground text-sm mb-2">{qi + 1}. {q.question}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`text-xs px-3 py-2 rounded-lg border ${
                              opt.is_correct
                                ? 'bg-success/10 border-success/30 text-success'
                                : 'bg-card border-border text-muted-foreground'
                            }`}
                          >
                            {opt.text} {opt.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
