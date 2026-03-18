import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useCourseDetail, useCourses } from '@/hooks/useCourses';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Save, ArrowLeft,
  FileText, Video, Volume2, File, Image, Code2, Link, Layers,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import MediaBlockPicker, { MediaBlockPreview, MediaBlock, MediaType } from '@/components/MediaBlockPicker';

const mediaIcons: Record<string, any> = {
  text: FileText, video: Video, audio: Volume2, document: File,
  image: Image, code: Code2, file: File, embed: Link,
};

const mediaColors: Record<string, string> = {
  text: 'text-muted-foreground', video: 'text-red-500', audio: 'text-purple-500',
  image: 'text-blue-500', code: 'text-green-500', file: 'text-amber-500', embed: 'text-cyan-500',
};

export default function TeacherCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { course, isLoading, addChapter, updateChapter, deleteChapter, addSubchapter, updateSubchapter, deleteSubchapter } = useCourseDetail(courseId);
  const { updateCourse } = useCourses();

  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // Edit course info
  const [editingCourse, setEditingCourse] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // Add chapter dialog
  const [chapterDialog, setChapterDialog] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');

  // Edit chapter
  const [editChapterId, setEditChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterDesc, setEditChapterDesc] = useState('');

  // Add/Edit subchapter state
  const [subDialog, setSubDialog] = useState<string | null>(null); // chapter id
  const [subTitle, setSubTitle] = useState('');
  const [subContent, setSubContent] = useState('');
  const [subMediaBlocks, setSubMediaBlocks] = useState<MediaBlock[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Edit subchapter
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editSubContent, setEditSubContent] = useState('');
  const [editSubMediaBlocks, setEditSubMediaBlocks] = useState<MediaBlock[]>([]);
  const [showEditBlockPicker, setShowEditBlockPicker] = useState(false);

  if (isLoading) return <DashboardLayout><p className="text-muted-foreground text-center py-16">Loading course...</p></DashboardLayout>;
  if (!course) return <DashboardLayout><p className="text-muted-foreground text-center py-16">Course not found.</p></DashboardLayout>;

  const startEditCourse = () => {
    setEditTitle(course.title);
    setEditDesc(course.description || '');
    setEditIcon(course.icon || '📚');
    setEditingCourse(true);
  };

  const saveCourse = async () => {
    await updateCourse.mutateAsync({ id: course.id, title: editTitle, description: editDesc, icon: editIcon });
    setEditingCourse(false);
  };

  const handleAddChapter = async () => {
    if (!chapterTitle.trim()) return;
    await addChapter.mutateAsync({ title: chapterTitle, description: chapterDesc });
    setChapterTitle(''); setChapterDesc(''); setChapterDialog(false);
  };

  const startEditChapter = (ch: any) => {
    setEditChapterId(ch.id); setEditChapterTitle(ch.title); setEditChapterDesc(ch.description || '');
  };

  const saveChapter = async () => {
    if (!editChapterId) return;
    await updateChapter.mutateAsync({ id: editChapterId, title: editChapterTitle, description: editChapterDesc });
    setEditChapterId(null);
  };

  /** Serialise media blocks array into the content field as JSON */
  const serialise = (blocks: MediaBlock[]) => blocks.length ? JSON.stringify(blocks) : undefined;

  /** Try to parse media blocks from JSON content, fallback to plain string */
  const parseBlocks = (content: string | undefined): MediaBlock[] => {
    if (!content) return [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* not JSON — treat as plain text subchapter */ }
    return [];
  };

  const openAddSub = (chapterId: string) => {
    setSubTitle(''); setSubContent(''); setSubMediaBlocks([]);
    setShowBlockPicker(false);
    setSubDialog(chapterId);
  };

  const handleAddSub = async () => {
    if (!subDialog || !subTitle.trim()) return;
    const mediaType: MediaType = subMediaBlocks.length > 0 ? subMediaBlocks[0].type : 'text';
    const content = subMediaBlocks.length > 0 ? serialise(subMediaBlocks) : subContent;
    await addSubchapter.mutateAsync({
      chapter_id: subDialog,
      title: subTitle,
      content: content || '',
      media_type: mediaType,
    });
    setSubTitle(''); setSubContent(''); setSubMediaBlocks([]); setSubDialog(null);
  };

  const startEditSub = (sub: any) => {
    setEditSubId(sub.id);
    setEditSubTitle(sub.title);
    const blocks = parseBlocks(sub.content);
    setEditSubMediaBlocks(blocks);
    setEditSubContent(blocks.length ? '' : sub.content || '');
    setShowEditBlockPicker(false);
  };

  const saveSub = async () => {
    if (!editSubId) return;
    const mediaType: MediaType = editSubMediaBlocks.length > 0 ? editSubMediaBlocks[0].type : 'text';
    const content = editSubMediaBlocks.length > 0 ? serialise(editSubMediaBlocks) : editSubContent;
    await updateSubchapter.mutateAsync({
      id: editSubId,
      title: editSubTitle,
      content: content || '',
      media_type: mediaType,
    });
    setEditSubId(null);
  };

  const removeBlock = (idx: number, isEdit: boolean) => {
    if (isEdit) setEditSubMediaBlocks(prev => prev.filter((_, i) => i !== idx));
    else setSubMediaBlocks(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button onClick={() => navigate('/teacher/courses')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors focus-accessible">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Courses
        </button>

        {/* Course Header */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          {editingCourse ? (
            <div className="space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Title</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className="mt-1 w-20 text-center text-xl" />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveCourse} disabled={updateCourse.isPending} className="gap-2 gradient-teacher text-primary-foreground border-0">
                  <Save className="w-4 h-4" /> {updateCourse.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="ghost" onClick={() => setEditingCourse(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <span className="text-4xl" aria-hidden="true">{course.icon || '📚'}</span>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold text-foreground">{course.title}</h1>
                <p className="text-muted-foreground mt-1">{course.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{course.chapters.length} chapters</p>
              </div>
              <Button variant="outline" size="sm" onClick={startEditCourse} className="gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
            </div>
          )}
        </div>

        {/* Chapters */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Chapters</h2>
          <Button size="sm" onClick={() => setChapterDialog(true)} className="gap-2 gradient-teacher text-primary-foreground border-0">
            <Plus className="w-4 h-4" /> Add Chapter
          </Button>
        </div>

        {course.chapters.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No chapters yet. Add your first chapter to start building content.</p>
          </div>
        )}

        <div className="space-y-4">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
              <div className="p-4 flex items-center gap-3">
                <button
                  onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                  className="flex items-center gap-3 flex-1 text-left focus-accessible"
                  aria-expanded={expandedChapter === chapter.id}
                >
                  {expandedChapter === chapter.id
                    ? <ChevronDown className="w-5 h-5 text-primary" aria-hidden="true" />
                    : <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />}
                  <div>
                    <p className="font-semibold text-foreground">{chapter.title}</p>
                    <p className="text-sm text-muted-foreground">{chapter.description}</p>
                  </div>
                </button>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{chapter.subchapters.length} lessons</span>
                <Button variant="ghost" size="icon" onClick={() => startEditChapter(chapter)} title="Edit chapter" aria-label="Edit chapter">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteChapter.mutate(chapter.id)} className="hover:text-destructive" title="Delete chapter" aria-label="Delete chapter">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {expandedChapter === chapter.id && (
                <div className="bg-muted/30 px-4 pb-4 space-y-2 border-t border-border pt-3">
                  {chapter.subchapters.map((sub) => {
                    const Icon = mediaIcons[sub.media_type || 'text'] || FileText;
                    const iconColor = mediaColors[sub.media_type || 'text'] || 'text-muted-foreground';
                    const mediaBlocks = parseBlocks(sub.content);

                    if (editSubId === sub.id) {
                      return (
                        <div key={sub.id} className="bg-card rounded-xl p-5 border border-primary/50 space-y-4 animate-fade-in">
                          <div>
                            <Label>Lesson Title</Label>
                            <Input value={editSubTitle} onChange={(e) => setEditSubTitle(e.target.value)} className="mt-1" placeholder="Lesson title" />
                          </div>

                          {/* Media blocks section */}
                          <div>
                            <Label className="block mb-2">Media Blocks</Label>
                            {editSubMediaBlocks.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {editSubMediaBlocks.map((block, idx) => (
                                  <div key={idx} className="relative rounded-xl border border-border bg-muted/30 p-3 group">
                                    <button
                                      onClick={() => removeBlock(idx, true)}
                                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                      aria-label="Remove block"
                                    >
                                      ×
                                    </button>
                                    <div className="flex items-center gap-2 mb-2">
                                      {(() => { const I = mediaIcons[block.type] || File; return <I className={`w-4 h-4 ${mediaColors[block.type]}`} aria-hidden="true" />; })()}
                                      <span className="text-xs font-medium text-muted-foreground capitalize">{block.type}</span>
                                      {block.url && <span className="text-xs text-muted-foreground truncate max-w-48">{block.url}</span>}
                                    </div>
                                    <div className="rounded-lg pointer-events-none">
                                      <MediaBlockPreview block={block} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowEditBlockPicker(!showEditBlockPicker)}
                                className="gap-2 text-sm"
                              >
                                <Plus className="w-4 h-4" /> Add Media Block
                              </Button>
                              {showEditBlockPicker && (
                                <div className="absolute top-10 left-0 z-50 animate-fade-in">
                                  <MediaBlockPicker
                                    onSelect={(block) => {
                                      setEditSubMediaBlocks(prev => [...prev, block]);
                                      setShowEditBlockPicker(false);
                                    }}
                                    onClose={() => setShowEditBlockPicker(false)}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Plain text content (when no media blocks) */}
                          {editSubMediaBlocks.length === 0 && (
                            <div>
                              <Label>Text Content</Label>
                              <Textarea value={editSubContent} onChange={(e) => setEditSubContent(e.target.value)} className="mt-1" rows={4} placeholder="Lesson content…" />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveSub} disabled={updateSubchapter.isPending} className="gap-1 gradient-teacher text-primary-foreground border-0">
                              <Save className="w-3 h-3" /> {updateSubchapter.isPending ? 'Saving…' : 'Save Lesson'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditSubId(null)}>Cancel</Button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={sub.id} className="bg-card rounded-xl border border-border group/sub overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted`} aria-hidden="true">
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <h4 className="font-semibold text-foreground text-sm flex-1">{sub.title}</h4>
                          {sub.media_type && sub.media_type !== 'text' && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{sub.media_type}</span>
                          )}
                          {mediaBlocks.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{mediaBlocks.length} block{mediaBlocks.length !== 1 ? 's' : ''}</span>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/sub:opacity-100 transition-opacity" onClick={() => startEditSub(sub)} aria-label="Edit lesson">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/sub:opacity-100 hover:text-destructive transition-opacity" onClick={() => deleteSubchapter.mutate(sub.id)} aria-label="Delete lesson">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* Quick preview of media blocks */}
                        {mediaBlocks.length > 0 && (
                          <div className="px-4 pb-4 border-t border-border/50 pt-2 space-y-2">
                            {mediaBlocks.slice(0, 2).map((block, i) => (
                              <MediaBlockPreview key={i} block={block} />
                            ))}
                            {mediaBlocks.length > 2 && (
                              <p className="text-xs text-muted-foreground text-center">+{mediaBlocks.length - 2} more block{mediaBlocks.length - 2 !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                        )}
                        {/* Plain text preview */}
                        {mediaBlocks.length === 0 && sub.content && (
                          <p className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{sub.content}</p>
                        )}
                      </div>
                    );
                  })}

                  <Button variant="outline" size="sm" onClick={() => openAddSub(chapter.id)} className="w-full gap-2 mt-2 border-dashed">
                    <Plus className="w-4 h-4" /> Add Lesson
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Chapter Dialog */}
        <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">Add Chapter</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title *</Label><Input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} className="mt-1" placeholder="Chapter title" /></div>
              <div><Label>Description</Label><Input value={chapterDesc} onChange={(e) => setChapterDesc(e.target.value)} className="mt-1" placeholder="Brief description" /></div>
              <Button onClick={handleAddChapter} disabled={addChapter.isPending} className="w-full gradient-teacher text-primary-foreground border-0">
                {addChapter.isPending ? 'Adding…' : 'Add Chapter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Chapter Dialog */}
        <Dialog open={!!editChapterId} onOpenChange={(open) => !open && setEditChapterId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle className="font-display">Edit Chapter</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={editChapterTitle} onChange={(e) => setEditChapterTitle(e.target.value)} className="mt-1" /></div>
              <div><Label>Description</Label><Input value={editChapterDesc} onChange={(e) => setEditChapterDesc(e.target.value)} className="mt-1" /></div>
              <Button onClick={saveChapter} disabled={updateChapter.isPending} className="w-full gradient-teacher text-primary-foreground border-0">
                {updateChapter.isPending ? 'Saving…' : 'Save Chapter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Lesson Dialog */}
        <Dialog open={!!subDialog} onOpenChange={(open) => !open && setSubDialog(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display text-lg">Add Lesson</DialogTitle></DialogHeader>
            <div className="space-y-5 mt-2">
              <div>
                <Label>Title *</Label>
                <Input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} className="mt-1" placeholder="Lesson title" />
              </div>

              {/* Media Blocks */}
              <div>
                <Label className="block mb-2">Media Blocks</Label>
                <p className="text-xs text-muted-foreground mb-3">Add images, videos, audio, code snippets and more — Notion style.</p>

                {subMediaBlocks.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {subMediaBlocks.map((block, idx) => (
                      <div key={idx} className="relative rounded-xl border border-border bg-muted/30 p-3 group">
                        <button
                          onClick={() => removeBlock(idx, false)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                          aria-label="Remove block"
                        >
                          ×
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                          {(() => { const I = mediaIcons[block.type] || File; return <I className={`w-4 h-4 ${mediaColors[block.type]}`} aria-hidden="true" />; })()}
                          <span className="text-xs font-medium text-muted-foreground capitalize">{block.type}</span>
                          {block.url && <span className="text-xs text-muted-foreground truncate max-w-60">{block.url}</span>}
                        </div>
                        <div className="rounded-lg pointer-events-none">
                          <MediaBlockPreview block={block} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Block picker trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowBlockPicker(!showBlockPicker)}
                    className="flex items-center gap-2 px-4 py-3 w-full rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-primary focus-accessible"
                  >
                    <Plus className="w-4 h-4" />
                    Click to add media block — image, video, audio, code…
                  </button>
                  {showBlockPicker && (
                    <div className="absolute top-full mt-2 left-0 z-50 animate-fade-in">
                      <MediaBlockPicker
                        onSelect={(block) => {
                          setSubMediaBlocks(prev => [...prev, block]);
                          setShowBlockPicker(false);
                        }}
                        onClose={() => setShowBlockPicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Plain text content */}
              {subMediaBlocks.length === 0 && (
                <div>
                  <Label>Text Content</Label>
                  <Textarea value={subContent} onChange={(e) => setSubContent(e.target.value)} className="mt-1" rows={5} placeholder="Or write your lesson content here…" />
                </div>
              )}

              <Button onClick={handleAddSub} disabled={addSubchapter.isPending || !subTitle.trim()} className="w-full gradient-teacher text-primary-foreground border-0 h-11">
                {addSubchapter.isPending ? 'Adding…' : 'Add Lesson'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
