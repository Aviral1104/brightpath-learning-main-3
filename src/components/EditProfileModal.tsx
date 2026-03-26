import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '@/integrations/firebase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, X, Plus, Copy, Check, Eye, EyeOff, Loader2 } from 'lucide-react';

// Compress image to 200×200 base64 JPEG — stores directly in Firestore (no Storage needed)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      // crop to square
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = url;
  });
}


interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [expertise, setExpertise] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (user && open) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setSchool(user.school || '');
      setAvatarPreview(user.avatar_url || null);
      setAvatarFile(null);
      setNewPassword('');
    }
  }, [user, open]);

  // Short code for students
  const studentCode = user?.id ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase() : '';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !expertise.includes(tag) && expertise.length < 10) {
      setExpertise([...expertise, tag]);
      setTagInput('');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(studentCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      // Compress & store avatar as base64 in Firestore (no Storage plan needed)
      let avatarUrl = user?.avatar_url || '';
      if (avatarFile && user?.id) {
        avatarUrl = await compressImage(avatarFile);
      }

      // Update Firestore profile
      const updatePayload: Record<string, any> = {
        name: name.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        school: school.trim(),
        avatar_url: avatarUrl,
        updated_at: serverTimestamp(),
      };
      if (user?.role === 'teacher') updatePayload.expertise = expertise;

      await updateDoc(doc(db, 'profiles', user!.id), updatePayload);

      // Change password if provided
      if (newPassword) {
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); setSaving(false); return; }
        const currentUser = auth.currentUser;
        if (currentUser) await updatePassword(currentUser, newPassword);
      }

      await refreshProfile();
      toast.success('Profile updated!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitials = (name || user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-violet overflow-hidden">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  : avatarInitials
                }
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Photo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-primary hover:underline mt-0.5">
                Upload new photo
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Student code */}
          {user?.role === 'student' && (
            <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1">Your Student Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold text-violet-800 dark:text-violet-200 tracking-widest">{studentCode}</code>
                <button onClick={handleCopyCode} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors">
                  {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {codeCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">Share this code with your parent to link accounts.</p>
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="ep-name">Full Name *</Label>
            <Input id="ep-name" value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Your full name" />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="ep-email">Email</Label>
            <Input id="ep-email" value={user?.email || ''} readOnly disabled className="mt-1 opacity-60 cursor-not-allowed" />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="ep-phone">Contact Number</Label>
            <Input id="ep-phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+91 00000 00000" />
          </div>

          {/* School */}
          {(user?.role === 'teacher' || user?.role === 'student') && (
            <div>
              <Label htmlFor="ep-school">{user.role === 'teacher' ? 'School / Institution' : 'School'}</Label>
              <Input id="ep-school" value={school} onChange={e => setSchool(e.target.value)} className="mt-1" placeholder="Your school name" />
            </div>
          )}

          {/* Bio */}
          <div>
            <Label htmlFor="ep-bio">Bio</Label>
            <Textarea id="ep-bio" value={bio} onChange={e => setBio(e.target.value)} className="mt-1 resize-none" rows={3} placeholder="Tell us a little about yourself..." />
          </div>

          {/* Teacher expertise */}
          {user?.role === 'teacher' && (
            <div>
              <Label>Subject Expertise</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl border border-border bg-muted/30">
                {expertise.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    {tag}
                    <button onClick={() => setExpertise(expertise.filter(t => t !== tag))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="e.g. Mathematics, Physics..." className="text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTag} className="shrink-0 gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <Label htmlFor="ep-password">New Password</Label>
            <div className="relative mt-1">
              <Input id="ep-password" type={showPassword ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-full">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-full gradient-violet text-white border-0 shadow-violet">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
