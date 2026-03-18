import DashboardLayout from '@/components/DashboardLayout';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, ClipboardList, MessageSquare, Users, Plus, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/integrations/backend/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

export default function TeacherDashboard() {
  const { user, refreshProfile } = useAuth();
  const { courses } = useCourses();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editSchool, setEditSchool] = useState(user?.school || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    const name = editName.trim();
    if (!name || name.length > 200) { toast.error('Name is required and must be under 200 characters.'); return; }
    if (editSchool.length > 300) { toast.error('School must be under 300 characters.'); return; }
    if (editPhone.length > 50) { toast.error('Phone must be under 50 characters.'); return; }
    if (editBio.length > 2000) { toast.error('Bio must be under 2000 characters.'); return; }
    setSaving(true);
    try {
      const { error } = await getSupabaseClient().from('profiles').update({ name, school: editSchool.trim(), phone: editPhone.trim(), bio: editBio.trim() }).eq('user_id', user?.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated!');
      setEditOpen(false);
    } catch (err: any) { toast.error(err.message || 'Failed to update'); } finally { setSaving(false); }
  };

  const stats = [
    { label: 'Courses', value: courses.length, icon: BookOpen, color: 'bg-primary/10 text-primary' },
    { label: 'Assignments', value: 0, icon: ClipboardList, color: 'bg-secondary/10 text-secondary' },
    { label: 'Students', value: 0, icon: Users, color: 'bg-accent/10 text-accent' },
    { label: 'Pending Reviews', value: 0, icon: MessageSquare, color: 'bg-warning/10 text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'Teacher'} 👋
            </h1>
            <p className="text-muted-foreground text-accessible">Here's an overview of your teaching activities.</p>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><UserCog className="w-4 h-4" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-display">Edit Profile</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label htmlFor="editName">Full Name *</Label><Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="editSchool">School / Institution</Label><Input id="editSchool" value={editSchool} onChange={(e) => setEditSchool(e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="editPhone">Phone</Label><Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" /></div>
                <div><Label htmlFor="editBio">Bio</Label><Input id="editBio" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell us about yourself" className="mt-1" /></div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full gradient-teacher text-primary-foreground border-0">{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border shadow-soft animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/teacher/courses"><Button className="gap-2 gradient-teacher text-primary-foreground border-0"><Plus className="w-4 h-4" /> Create Course</Button></Link>
          <Link to="/teacher/assignments"><Button variant="outline" className="gap-2"><Plus className="w-4 h-4" /> Create Assignment</Button></Link>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">Your Courses</h2>
          {courses.length === 0 ? (
            <p className="text-muted-foreground">No courses yet. Create one to get started!</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, i) => (
                <Link key={course.id} to={`/teacher/courses/${course.id}`} className="block">
                  <div className="bg-card rounded-xl border border-border p-6 hover:shadow-elevated transition-all hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                    <span className="text-3xl mb-3 block">{course.icon || '📚'}</span>
                    <h3 className="font-display font-semibold text-foreground mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

