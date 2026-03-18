import DashboardLayout from '@/components/DashboardLayout';
import { useAllCourses, useEnrollCourse, useUnenrollCourse } from '@/hooks/useStudentCourses';
import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Video, Volume2, File, Image, Code2, Link, BookmarkCheck, BookmarkPlus } from 'lucide-react';
import TextToSpeech from '@/components/TextToSpeech';
import { Button } from '@/components/ui/button';
import { MediaBlockPreview, MediaBlock } from '@/components/MediaBlockPicker';

const mediaIcons: Record<string, any> = {
  text: FileText, video: Video, audio: Volume2, document: File,
  image: Image, code: Code2, file: File, embed: Link,
};

/** Try to parse JSON media blocks from content; fallback to plain text */
function parseBlocks(content: string | undefined): { blocks: MediaBlock[]; plain: string } {
  if (!content) return { blocks: [], plain: '' };
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return { blocks: parsed as MediaBlock[], plain: '' };
  } catch { /* not JSON */ }
  return { blocks: [], plain: content };
}

export default function StudentCourses() {
  const { data: courses = [], isLoading } = useAllCourses();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [activeSubchapter, setActiveSubchapter] = useState<string | null>(null);
  const enroll = useEnrollCourse();
  const unenroll = useUnenrollCourse();

  const handleEnroll = (courseId: string, isEnrolled: boolean) => {
    if (isEnrolled) unenroll.mutate(courseId);
    else enroll.mutate(courseId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">My Courses</h1>
          <p className="text-muted-foreground text-accessible">Explore your lessons and learn at your own pace.</p>
        </div>

        {isLoading && <p className="text-muted-foreground text-center py-8">Loading courses…</p>}

        {!isLoading && courses.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <span className="text-5xl block mb-4" aria-hidden="true">📚</span>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">No courses available</h3>
            <p className="text-muted-foreground">Check back soon — your teacher will add courses!</p>
          </div>
        )}

        <div className="space-y-6">
          {courses.map((course) => {
            const isEnrolled = !!(course as any).isEnrolled;
            const isMutating = enroll.isPending || unenroll.isPending;

            return (
              <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl" aria-hidden="true">{course.icon || '📚'}</span>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-bold text-foreground">{course.title}</h2>
                      <p className="text-sm text-muted-foreground">{(course as any).teacherName || 'Teacher'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isEnrolled ? 'outline' : 'default'}
                      onClick={() => handleEnroll(course.id, isEnrolled)}
                      disabled={isMutating}
                      className="gap-2 shrink-0"
                      aria-label={isEnrolled ? `Leave ${course.title}` : `Enroll in ${course.title}`}
                    >
                      {isEnrolled
                        ? <><BookmarkCheck className="w-4 h-4" aria-hidden="true" />Leave</>
                        : <><BookmarkPlus className="w-4 h-4" aria-hidden="true" />Enroll</>}
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {course.chapters.map((chapter) => (
                    <div key={chapter.id}>
                      <button
                        onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left focus-accessible"
                        aria-expanded={expandedChapter === chapter.id}
                        aria-controls={`chapter-${chapter.id}`}
                      >
                        {expandedChapter === chapter.id
                          ? <ChevronDown className="w-5 h-5 text-secondary" aria-hidden="true" />
                          : <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />}
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{chapter.title}</p>
                          <p className="text-sm text-muted-foreground">{chapter.subchapters.length} lessons</p>
                        </div>
                      </button>

                      {expandedChapter === chapter.id && (
                        <div id={`chapter-${chapter.id}`} className="bg-muted/30 px-4 pb-4 space-y-2">
                          {chapter.subchapters.map((sub) => {
                            const Icon = mediaIcons[sub.media_type || 'text'] || FileText;
                            const isActive = activeSubchapter === sub.id;
                            const { blocks, plain } = parseBlocks(sub.content);

                            return (
                              <div key={sub.id} className={`bg-card rounded-xl border transition-all overflow-hidden ${isActive ? 'border-secondary shadow-soft' : 'border-border'}`}>
                                <button
                                  onClick={() => setActiveSubchapter(isActive ? null : sub.id)}
                                  className="w-full text-left p-4 focus-accessible"
                                  aria-expanded={isActive}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-secondary/20' : 'bg-muted'}`} aria-hidden="true">
                                      <Icon className={`w-4 h-4 ${isActive ? 'text-secondary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <h4 className="font-semibold text-foreground text-sm flex-1">{sub.title}</h4>
                                    {blocks.length > 0 && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{blocks.length} media</span>
                                    )}
                                  </div>
                                </button>

                                {isActive && (
                                  <div className="px-4 pb-5 space-y-4 animate-fade-in border-t border-border/50 pt-3">
                                    {/* Render media blocks */}
                                    {blocks.length > 0 ? (
                                      <>
                                        {blocks.map((block, i) => (
                                          <MediaBlockPreview key={i} block={block} />
                                        ))}
                                        {plain && <p className="text-sm text-muted-foreground leading-relaxed">{plain}</p>}
                                      </>
                                    ) : plain ? (
                                      <>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{plain}</p>
                                        <TextToSpeech text={plain} label={`Read "${sub.title}" aloud`} />
                                      </>
                                    ) : (
                                      <p className="text-sm text-muted-foreground italic">No content yet.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  {course.chapters.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground italic">No chapters added yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
