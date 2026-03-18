import DashboardLayout from '@/components/DashboardLayout';
import { useAllCourses } from '@/hooks/useStudentCourses';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ClipboardList, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import FocusTimer from '@/components/FocusTimer';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: courses = [], isLoading } = useAllCourses();

  const stats = [
    { label: 'Available Courses', value: courses.length, icon: BookOpen, color: 'bg-secondary/10 text-secondary' },
    { label: 'Total Chapters', value: courses.reduce((a, c) => a + c.chapters.length, 0), icon: ClipboardList, color: 'bg-primary/10 text-primary' },
    { label: 'Total Lessons', value: courses.reduce((a, c) => a + c.chapters.reduce((b, ch) => b + ch.subchapters.length, 0), 0), icon: Award, color: 'bg-accent/10 text-accent' },
    { label: 'Keep Going!', value: '🌟', icon: TrendingUp, color: 'bg-success/10 text-success' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">
            Hi, {user?.name?.split(' ')[0]}! 🎉
          </h1>
          <p className="text-muted-foreground text-accessible">
            Ready to learn something amazing today?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-soft animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`} aria-hidden="true">
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ADHD Focus Timer */}
        <FocusTimer />

        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">My Courses</h2>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {!isLoading && courses.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <span className="text-4xl block mb-2" aria-hidden="true">📚</span>
              <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => (
              <Link key={course.id} to="/student/courses" className="block">
                <div className="bg-card rounded-xl border border-border p-6 hover:shadow-elevated transition-all hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                  <span className="text-4xl mb-3 block" aria-hidden="true">{course.icon || '📚'}</span>
                  <h3 className="font-display font-semibold text-foreground mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                  <p className="text-xs text-muted-foreground">{course.chapters.length} chapters • {(course as any).teacherName || 'Teacher'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
