import DashboardLayout from '@/components/DashboardLayout';
import { useCourses } from '@/hooks/useCourses';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const iconOptions = ['📚', '🏛️', '🧮', '📐', '🔬', '🎨', '🌍', '💻', '📝', '🎵'];

export default function TeacherCourses() {
  const { courses, isLoading, createCourse, deleteCourse } = useCourses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('📚');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createCourse.mutateAsync({ title: newTitle, description: newDesc, icon: newIcon });
    setNewTitle(''); setNewDesc(''); setNewIcon('📚'); setDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Your Courses</h1>
            <p className="text-muted-foreground">Manage your courses, chapters, and subchapters.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-teacher text-primary-foreground border-0">
                <Plus className="w-4 h-4" /> Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Course Icon</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {iconOptions.map((icon) => (
                      <button key={icon} onClick={() => setNewIcon(icon)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${newIcon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border bg-muted hover:bg-muted/80'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="courseTitle">Title *</Label>
                  <Input id="courseTitle" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. World History" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="courseDesc">Description</Label>
                  <Input id="courseDesc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description" className="mt-1" />
                </div>
                <Button onClick={handleCreate} disabled={createCourse.isPending} className="w-full gradient-teacher text-primary-foreground border-0">
                  {createCourse.isPending ? 'Creating...' : 'Create Course'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <p className="text-muted-foreground text-center py-8">Loading courses...</p>}

        {!isLoading && courses.length === 0 && (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <span className="text-5xl block mb-4">📚</span>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to get started.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-card rounded-xl border border-border p-6 shadow-soft hover:shadow-elevated transition-all group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{course.icon || '📚'}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteCourse.mutate(course.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{course.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
              <Link to={`/teacher/courses/${course.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Open & Edit Course
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
