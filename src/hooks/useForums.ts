import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, orderBy, limit as fbLimit, getDocs, addDoc, deleteDoc,
  doc, getDoc, serverTimestamp, where
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ForumThread {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  author_name?: string;
  reply_count?: number;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
}

export function useForumThreads(limitCount?: number) {
  return useQuery({
    queryKey: ['forum-threads', limitCount],
    queryFn: async (): Promise<ForumThread[]> => {
      let q = query(collection(db, 'forum_threads'), orderBy('created_at', 'desc'));
      if (limitCount) q = query(collection(db, 'forum_threads'), orderBy('created_at', 'desc'), fbLimit(limitCount));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const nameMap: Record<string, string> = {};
      await Promise.all(
        [...new Set(rows.map((r: any) => r.author_id))].map(async (aid) => {
          const p = await getDoc(doc(db, 'profiles', aid as string));
          if (p.exists()) nameMap[aid as string] = p.data().name;
        })
      );

      // Reply counts
      const countMap: Record<string, number> = {};
      await Promise.all(
        rows.map(async (r: any) => {
          const rSnap = await getDocs(query(collection(db, 'forum_replies'), where('thread_id', '==', r.id)));
          countMap[r.id] = rSnap.size;
        })
      );

      return rows.map((r: any) => ({
        ...r,
        created_at: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        author_name: nameMap[r.author_id] || 'Member',
        reply_count: countMap[r.id] || 0,
      }));
    },
  });
}

export function useForumReplies(threadId: string | undefined) {
  return useQuery({
    queryKey: ['forum-replies', threadId],
    queryFn: async (): Promise<ForumReply[]> => {
      if (!threadId) return [];
      const snap = await getDocs(query(
        collection(db, 'forum_replies'),
        where('thread_id', '==', threadId)
      ));
      const rows = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a: any, b: any) => (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0));
      const nameMap: Record<string, string> = {};
      await Promise.all(
        [...new Set(rows.map((r: any) => r.author_id))].map(async (aid) => {
          const p = await getDoc(doc(db, 'profiles', aid as string));
          if (p.exists()) nameMap[aid as string] = p.data().name;
        })
      );
      return rows.map((r: any) => ({
        ...r,
        created_at: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        author_name: nameMap[r.author_id] || 'Member',
      }));
    },
    enabled: !!threadId,
  });
}

export function useForumThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ['forum-thread', threadId],
    queryFn: async (): Promise<ForumThread | null> => {
      if (!threadId) return null;
      const snap = await getDoc(doc(db, 'forum_threads', threadId));
      if (!snap.exists()) return null;
      const r = { id: snap.id, ...snap.data() } as any;
      const p = await getDoc(doc(db, 'profiles', r.author_id));
      return {
        ...r,
        created_at: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        author_name: p.exists() ? p.data().name : 'Member',
      };
    },
    enabled: !!threadId,
  });
}

export function useCreateThread() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string }) => {
      await addDoc(collection(db, 'forum_threads'), {
        title: input.title.trim(),
        body: input.body.trim(),
        author_id: user!.id,
        created_at: serverTimestamp(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-threads'] }),
  });
}

export function useCreateReply() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { thread_id: string; body: string }) => {
      await addDoc(collection(db, 'forum_replies'), {
        thread_id: input.thread_id,
        body: input.body.trim(),
        author_id: user!.id,
        created_at: serverTimestamp(),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', variables.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
    },
  });
}
