import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc,
  doc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbCourse {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  teacher_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbChapter {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface DbSubchapter {
  id: string;
  chapter_id: string;
  title: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface CourseWithContent extends DbCourse {
  chapters: (DbChapter & { subchapters: DbSubchapter[] })[];
}

const toDate = (v: any) => v?.toDate?.()?.toISOString() || new Date().toISOString();

export function useCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['courses', user?.id],
    queryFn: async () => {
      const snap = await getDocs(query(
        collection(db, 'courses'),
        where('teacher_id', '==', user!.id)
      ));
      return snap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at), updated_at: toDate(d.data().updated_at) }) as DbCourse)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    enabled: !!user,
  });

  const createCourse = useMutation({
    mutationFn: async (input: { title: string; description: string; icon: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      const ref = await addDoc(collection(db, 'courses'), {
        title, description: input.description?.trim() || '', icon: input.icon?.trim() || '📚',
        color: 'primary', teacher_id: user!.id,
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      });
      return ref;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course created!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => { await deleteDoc(doc(db, 'courses', courseId)); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course deleted'); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCourse = useMutation({
    mutationFn: async (input: { id: string; title: string; description: string; icon: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      await updateDoc(doc(db, 'courses', input.id), {
        title, description: input.description?.trim() || '', icon: input.icon?.trim() || '📚',
        updated_at: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      toast.success('Course updated!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { courses: coursesQuery.data || [], isLoading: coursesQuery.isLoading, createCourse, deleteCourse, updateCourse };
}

export function useCourseDetail(courseId: string | undefined) {
  const queryClient = useQueryClient();

  const query2 = useQuery({
    queryKey: ['course-detail', courseId],
    queryFn: async (): Promise<CourseWithContent | null> => {
      const courseSnap = await getDoc(doc(db, 'courses', courseId!));
      if (!courseSnap.exists()) return null;
      const course = { id: courseSnap.id, ...courseSnap.data(), created_at: toDate(courseSnap.data().created_at), updated_at: toDate(courseSnap.data().updated_at) } as DbCourse;

      const chaptersSnap = await getDocs(query(collection(db, 'chapters'), where('course_id', '==', courseId!)));
      const chapters = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at) })).sort((a: any, b: any) => a.sort_order - b.sort_order) as DbChapter[];

      const subchapters: DbSubchapter[] = [];
      for (const ch of chapters) {
        const subSnap = await getDocs(query(collection(db, 'subchapters'), where('chapter_id', '==', ch.id)));
        subchapters.push(...subSnap.docs.map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at) })).sort((a: any, b: any) => a.sort_order - b.sort_order) as DbSubchapter[]);
      }

      return { ...course, chapters: chapters.map(ch => ({ ...ch, subchapters: subchapters.filter(s => s.chapter_id === ch.id) })) };
    },
    enabled: !!courseId,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });

  const addChapter = useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      const existing = query2.data?.chapters.length || 0;
      await addDoc(collection(db, 'chapters'), { course_id: courseId!, title, description: input.description?.trim() || '', sort_order: existing, created_at: serverTimestamp() });
    },
    onSuccess: () => { refetch(); toast.success('Chapter added!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateChapter = useMutation({
    mutationFn: async (input: { id: string; title: string; description: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      await updateDoc(doc(db, 'chapters', input.id), { title, description: input.description?.trim() || '' });
    },
    onSuccess: () => { refetch(); toast.success('Chapter updated!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) => { await deleteDoc(doc(db, 'chapters', chapterId)); },
    onSuccess: () => { refetch(); toast.success('Chapter deleted'); },
    onError: (err: any) => toast.error(err.message),
  });

  const addSubchapter = useMutation({
    mutationFn: async (input: { chapter_id: string; title: string; content: string; media_type: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      const chapter = query2.data?.chapters.find(c => c.id === input.chapter_id);
      const existing = chapter?.subchapters.length || 0;
      await addDoc(collection(db, 'subchapters'), { chapter_id: input.chapter_id, title, content: input.content?.trim() || '', media_type: input.media_type, sort_order: existing, created_at: serverTimestamp() });
    },
    onSuccess: () => { refetch(); toast.success('Lesson added!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSubchapter = useMutation({
    mutationFn: async (input: { id: string; title: string; content: string; media_type: string }) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      await updateDoc(doc(db, 'subchapters', input.id), { title, content: input.content?.trim() || '', media_type: input.media_type });
    },
    onSuccess: () => { refetch(); toast.success('Lesson updated!'); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSubchapter = useMutation({
    mutationFn: async (subId: string) => { await deleteDoc(doc(db, 'subchapters', subId)); },
    onSuccess: () => { refetch(); toast.success('Lesson deleted'); },
    onError: (err: any) => toast.error(err.message),
  });

  return { course: query2.data, isLoading: query2.isLoading, addChapter, updateChapter, deleteChapter, addSubchapter, updateSubchapter, deleteSubchapter };
}
