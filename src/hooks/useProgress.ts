import { useEffect, useState, useRef } from 'react';
import {
  doc, setDoc, onSnapshot, arrayUnion, arrayRemove,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  completedSubchapters: string[];
  completedCount: number;
  totalSubchaptersAtEnrollment: number;
  verified: boolean;
  lastActive: string;
}

// ─── Helper: doc id ─────────────────────────────────────────────────────────

export const progressDocId = (studentId: string, courseId: string) =>
  `${studentId}_${courseId}`;

// ─── Hook: student's own progress for a course ───────────────────────────────

/**
 * Returns the student's progress doc and helpers to mark/unmark a subchapter.
 * Uses onSnapshot so UI stays in sync without manual refetching.
 */
export function useStudentProgress(courseId: string | undefined) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const pendingRef = useRef<Set<string>>(new Set()); // debounce guard

  useEffect(() => {
    if (!user?.id || !courseId) return;
    const docRef = doc(db, 'progress', progressDocId(user.id, courseId));
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProgress(snap.data() as StudentProgress);
      } else {
        setProgress(null);
      }
    });
    return unsub;
  }, [user?.id, courseId]);

  /**
   * Initialise a progress document on first enrollment.
   * Should be called right after enrolling, passing the total subchapter count.
   */
  const initProgress = async (
    courseId: string,
    courseName: string,
    totalSubchapters: number
  ) => {
    if (!user?.id) return;
    const docRef = doc(db, 'progress', progressDocId(user.id, courseId));
    await setDoc(
      docRef,
      {
        studentId: user.id,
        studentName: user.name || '',
        courseId,
        courseName,
        completedSubchapters: [],
        completedCount: 0,
        totalSubchaptersAtEnrollment: totalSubchapters,
        verified: false,
        lastActive: new Date().toISOString(),
      },
      { merge: true } // safe on re-enrollment
    );
  };

  /**
   * Toggle a subchapter's completion state.
   * Guards: skips redundant writes, debounces rapid clicks.
   */
  const toggleSubchapter = async (subId: string) => {
    if (!user?.id || !courseId) return;
    if (pendingRef.current.has(subId)) return; // debounce
    pendingRef.current.add(subId);

    try {
      const docRef = doc(db, 'progress', progressDocId(user.id, courseId));
      const isCompleted = progress?.completedSubchapters.includes(subId) ?? false;

      await setDoc(
        docRef,
        {
          // Always write metadata so partial docs created by this merge are queryable
          studentId: user.id,
          studentName: user.name || '',
          courseId,
          completedSubchapters: isCompleted
            ? arrayRemove(subId)
            : arrayUnion(subId),
          completedCount: isCompleted
            ? Math.max(0, (progress?.completedCount ?? 1) - 1)
            : (progress?.completedCount ?? 0) + 1,
          lastActive: new Date().toISOString(),
        },
        { merge: true }
      );
    } finally {
      pendingRef.current.delete(subId);
    }
  };

  const pct =
    progress && progress.totalSubchaptersAtEnrollment > 0
      ? Math.round(
          (progress.completedCount / progress.totalSubchaptersAtEnrollment) * 100
        )
      : 0;

  return { progress, pct, initProgress, toggleSubchapter };
}

// ─── Hook: teacher – all students' progress for a course ─────────────────────

export interface StudentProgressWithName extends StudentProgress {
  pct: number;
}

/**
 * Returns real-time progress for ALL students enrolled in a given course.
 * Teacher-facing only.
 */
export function useCourseProgress(courseId: string | undefined) {
  const [progressList, setProgressList] = useState<StudentProgressWithName[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const q = query(
      collection(db, 'progress'),
      where('courseId', '==', courseId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => {
        const data = d.data() as StudentProgress;
        const pct =
          data.totalSubchaptersAtEnrollment > 0
            ? Math.round(
                (data.completedCount / data.totalSubchaptersAtEnrollment) * 100
              )
            : 0;
        return { ...data, pct };
      });
      setProgressList(docs);
      setIsLoading(false);
    });

    return unsub;
  }, [courseId]);

  return { progressList, isLoading };
}

// ─── Hook: teacher – ALL students across ALL of their courses ─────────────────

export interface AllStudentProgress {
  key: string;              // unique: `${studentId}_${courseId}`
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  completedCount: number;
  totalSubchapters: number; // live course count (not snapshot)
  pct: number;
  completedSubchapters: string[];
  verified: boolean;
  hasProgressDoc: boolean;  // false = enrolled but never opened progress
}

/**
 * Returns a merged, real-time list of ALL enrolled students across all courses
 * owned by this teacher — including those who have never opened the course.
 * Uses live subchapter counts so percentages are always correct.
 */
export function useAllStudentProgress(courseIds: string[], courseNames: Record<string, string>) {
  const [rows, setRows] = useState<AllStudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseIds.length) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        // ── 1. Fetch all enrollments for teacher's courses ────────────────
        const chunks: string[][] = [];
        for (let i = 0; i < courseIds.length; i += 10)
          chunks.push(courseIds.slice(i, i + 10));

        const enrollmentPairs: { studentId: string; courseId: string }[] = [];
        await Promise.all(
          chunks.map(async (chunk) => {
            const snap = await getDocs(
              query(collection(db, 'enrollments'), where('course_id', 'in', chunk))
            );
            snap.docs.forEach((d) =>
              enrollmentPairs.push({ studentId: d.data().student_id, courseId: d.data().course_id })
            );
          })
        );

        if (!enrollmentPairs.length) {
          setRows([]);
          setIsLoading(false);
          return;
        }

        // ── 2. Fetch student names from profiles ──────────────────────────
        const studentIds = [...new Set(enrollmentPairs.map((e) => e.studentId))];
        const nameMap: Record<string, string> = {};
        await Promise.all(
          studentIds.map(async (sid) => {
            const snap = await getDocs(
              query(collection(db, 'profiles'), where('__name__', '==', sid))
            );
            if (!snap.empty) nameMap[sid] = snap.docs[0].data().name || snap.docs[0].data().full_name || '';
            // fallback: try fetching by id field
            if (!nameMap[sid]) {
              const snap2 = await getDocs(
                query(collection(db, 'profiles'), where('id', '==', sid))
              );
              if (!snap2.empty) nameMap[sid] = snap2.docs[0].data().name || snap2.docs[0].data().full_name || sid;
            }
            if (!nameMap[sid]) nameMap[sid] = sid; // last resort: show id
          })
        );

        // ── 3. Fetch live subchapter counts per course ─────────────────────
        const subCountMap: Record<string, number> = {};
        await Promise.all(
          courseIds.map(async (cid) => {
            const chapSnap = await getDocs(
              query(collection(db, 'chapters'), where('course_id', '==', cid))
            );
            let total = 0;
            await Promise.all(
              chapSnap.docs.map(async (ch) => {
                const subSnap = await getDocs(
                  query(collection(db, 'subchapters'), where('chapter_id', '==', ch.id))
                );
                total += subSnap.size;
              })
            );
            subCountMap[cid] = total;
          })
        );

        if (cancelled) return;

        // ── 4. Build base map from enrollments (all students visible) ──────
        const baseMap = new Map<string, AllStudentProgress>();
        enrollmentPairs.forEach(({ studentId, courseId }) => {
          const key = `${studentId}_${courseId}`;
          const total = subCountMap[courseId] ?? 0;
          baseMap.set(key, {
            key,
            studentId,
            studentName: nameMap[studentId] || 'Student',
            courseId,
            courseName: courseNames[courseId] || '',
            completedCount: 0,
            totalSubchapters: total,
            pct: 0,
            completedSubchapters: [],
            verified: false,
            hasProgressDoc: false,
          });
        });

        setRows([...baseMap.values()]);
        setIsLoading(false);

        // ── 5. Subscribe to progress docs and merge in real time ───────────
        const unsubs: (() => void)[] = [];

        chunks.forEach((chunk) => {
          const q = query(collection(db, 'progress'), where('courseId', 'in', chunk));
          const unsub = onSnapshot(q, (snap) => {
            if (cancelled) return;

            // Deep-copy map so React detects change
            setRows((prev) => {
              const next = new Map(prev.map((r) => [r.key, { ...r }]));

              snap.docChanges().forEach((change) => {
                const data = change.doc.data() as StudentProgress;

                // Parse doc ID to get studentId/courseId reliably —
                // even partial docs (created by toggleSubchapter before initProgress)
                // are guaranteed to have the correct doc ID format.
                const underscoreIdx = change.doc.id.indexOf('_');
                const derivedStudentId = underscoreIdx > -1
                  ? change.doc.id.slice(0, underscoreIdx)
                  : (data.studentId ?? change.doc.id);
                const derivedCourseId = underscoreIdx > -1
                  ? change.doc.id.slice(underscoreIdx + 1)
                  : (data.courseId ?? '');

                const key = `${derivedStudentId}_${derivedCourseId}`;
                const base = next.get(key);
                const total = subCountMap[derivedCourseId] ?? data.totalSubchaptersAtEnrollment ?? 0;
                const completed = data.completedCount ?? data.completedSubchapters?.length ?? 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                if (change.type === 'removed') {
                  // Revert to zero-progress if still enrolled
                  if (base) next.set(key, { ...base, completedCount: 0, pct: 0, completedSubchapters: [], verified: false, hasProgressDoc: false });
                } else {
                  next.set(key, {
                    ...(base ?? {}),
                    key,
                    studentId: derivedStudentId,
                    studentName: data.studentName || base?.studentName || nameMap[derivedStudentId] || 'Student',
                    courseId: derivedCourseId,
                    courseName: data.courseName || base?.courseName || courseNames[derivedCourseId] || '',
                    completedCount: completed,
                    totalSubchapters: total,
                    pct,
                    completedSubchapters: data.completedSubchapters ?? [],
                    verified: data.verified ?? false,
                    hasProgressDoc: true,
                  });
                }
              });

              return [...next.values()];
            });
          });
          unsubs.push(unsub);
        });

        return () => unsubs.forEach((u) => u());
      } catch (err) {
        console.error('useAllStudentProgress error', err);
        setIsLoading(false);
      }
    }

    const cleanup = load();
    return () => {
      cancelled = true;
      cleanup?.then((fn) => fn?.());
    };
  }, [courseIds.join(','), JSON.stringify(courseNames)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { progressList: rows, isLoading };
}


