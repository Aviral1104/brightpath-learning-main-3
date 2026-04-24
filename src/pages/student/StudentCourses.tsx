import DashboardLayout from '@/components/DashboardLayout';
import { useAllCourses, useEnrollCourse, useUnenrollCourse } from '@/hooks/useStudentCourses';
import { useStudentProgress } from '@/hooks/useProgress';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, ChevronRight, FileText, Video, Volume2, File, Image,
  Code2, Link, BookmarkCheck, BookmarkPlus, CheckSquare, Square,
} from 'lucide-react';
import TextToSpeech from '@/components/TextToSpeech';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MediaBlockPreview, MediaBlock } from '@/components/MediaBlockPicker';
import { toast } from 'sonner';

const mediaIcons: Record<string, any> = {
  text: FileText, video: Video, audio: Volume2, document: File,
  image: Image, code: Code2, file: File, embed: Link,
};

function parseBlocks(content: string | undefined): { blocks: MediaBlock[]; plain: string } {
  if (!content) return { blocks: [], plain: '' };
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return { blocks: parsed as MediaBlock[], plain: '' };
  } catch { /* not JSON */ }
  return { blocks: [], plain: content };
}

// ─── Confetti burst (canvas, no dep needed) ──────────────────────────────────
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')!;
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    r: Math.random() * 6 + 4,
    color: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'][Math.floor(Math.random() * 5)],
    vy: Math.random() * 3 + 2,
    vx: (Math.random() - 0.5) * 2,
    spin: Math.random() * 0.2 - 0.1,
    angle: 0,
  }));
  let frame: number;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.angle += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
      ctx.restore();
    });
    if (pieces.some(p => p.y < canvas.height)) frame = requestAnimationFrame(draw);
    else { canvas.remove(); cancelAnimationFrame(frame); }
  };
  draw();
  setTimeout(() => { canvas.remove(); cancelAnimationFrame(frame); }, 4000);
}

// ─── Per-course progress strip ───────────────────────────────────────────────
function CourseProgressBar({ courseId, totalSubchapters }: { courseId: string; totalSubchapters: number }) {
  const { progress } = useStudentProgress(courseId);
  const prevPct = useRef(0);
  const hasLoaded = useRef(false); // skip confetti on initial data load

  const denominator = totalSubchapters || progress?.totalSubchaptersAtEnrollment || 0;
  const completed = progress?.completedCount ?? 0;
  const pct = denominator > 0 ? Math.round((completed / denominator) * 100) : 0;

  useEffect(() => {
    if (!progress) return; // wait for first real data

    if (hasLoaded.current && pct === 100 && prevPct.current < 100) {
      // Only fire if user just completed — not on page load
      triggerConfetti();
      toast.success('🎉 Course complete! Amazing work!', { duration: 5000 });
    }

    hasLoaded.current = true;
    prevPct.current = pct;
  }, [pct, progress]);

  if (!progress) return null;

  return (
    <div className="px-6 pb-4 space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{completed} / {totalSubchapters} lessons completed</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}


// ─── Lesson checkbox (isolated to access its own progress hook slice) ─────────
function LessonRow({
  sub,
  courseId,
  isActive,
  onToggleActive,
}: {
  sub: any;
  courseId: string;
  isActive: boolean;
  onToggleActive: () => void;
}) {
  const { progress, toggleSubchapter } = useStudentProgress(courseId);
  const isCompleted = progress?.completedSubchapters.includes(sub.id) ?? false;
  const { blocks, plain } = parseBlocks(sub.content);
  const Icon = mediaIcons[sub.media_type || 'text'] || FileText;

  const handleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSubchapter(sub.id);
    if (!isCompleted) {
      toast.success(`"${sub.title}" marked as complete ✓`);
    }
  };

  return (
    <div
      className={`bg-card rounded-xl border transition-all overflow-hidden ${
        isActive ? 'border-secondary shadow-soft' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Completion checkbox */}
        <button
          onClick={handleCheck}
          className="pl-4 py-4 shrink-0 text-muted-foreground hover:text-secondary transition-colors focus-visible:outline-none"
          aria-label={isCompleted ? `Mark "${sub.title}" as incomplete` : `Mark "${sub.title}" as complete`}
          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {isCompleted
            ? <CheckSquare className="w-5 h-5 text-secondary" />
            : <Square className="w-5 h-5" />}
        </button>

        {/* Lesson title / expand toggle */}
        <button
          onClick={onToggleActive}
          className="flex-1 text-left p-4 pl-2 focus-accessible"
          aria-expanded={isActive}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-secondary/20' : 'bg-muted'}`} aria-hidden="true">
              <Icon className={`w-4 h-4 ${isActive ? 'text-secondary' : 'text-muted-foreground'}`} />
            </div>
            <h4 className={`font-semibold text-sm flex-1 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {sub.title}
            </h4>
            {blocks.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{blocks.length} media</span>
            )}
          </div>
        </button>
      </div>

      {isActive && (
        <div className="px-4 pb-5 space-y-4 animate-fade-in border-t border-border/50 pt-3">
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
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentCourses() {
  const { data: courses = [], isLoading } = useAllCourses();
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [activeSubchapter, setActiveSubchapter] = useState<string | null>(null);
  const enroll = useEnrollCourse();
  const unenroll = useUnenrollCourse();

  const handleEnroll = (courseId: string, isEnrolled: boolean, courseName = '', totalSubchapters = 0) => {
    if (isEnrolled) unenroll.mutate(courseId);
    else enroll.mutate({ courseId, courseName, totalSubchapters });
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
            const totalSubchapters = course.chapters.reduce(
              (acc, ch) => acc + ch.subchapters.length, 0
            );

            return (
              <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
                {/* Course header */}
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
                      onClick={() => handleEnroll(course.id, isEnrolled, course.title, totalSubchapters)}
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

                {/* Progress bar (enrolled students only) */}
                {isEnrolled && totalSubchapters > 0 && (
                  <CourseProgressBar courseId={course.id} totalSubchapters={totalSubchapters} />
                )}

                {/* Chapters */}
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
                          {chapter.subchapters.map((sub) => (
                            <LessonRow
                              key={sub.id}
                              sub={sub}
                              courseId={course.id}
                              isActive={activeSubchapter === sub.id}
                              onToggleActive={() =>
                                setActiveSubchapter(activeSubchapter === sub.id ? null : sub.id)
                              }
                            />
                          ))}
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
