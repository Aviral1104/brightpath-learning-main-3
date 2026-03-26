import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit as fbLimit, getDocs, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Announcement {
  id: string;
  teacher_id: string;
  title: string;
  body: string;
  created_at: string;
  teacher_name?: string;
}

export function useAnnouncements(limitCount?: number) {
  return useQuery({
    queryKey: ['announcements', limitCount],
    queryFn: async (): Promise<Announcement[]> => {
      let q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
      if (limitCount) q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), fbLimit(limitCount));
      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // Enrich with teacher names
      const nameMap: Record<string, string> = {};
      await Promise.all(
        [...new Set(rows.map((r: any) => r.teacher_id))].map(async (tid) => {
          const p = await getDoc(doc(db, 'profiles', tid as string));
          if (p.exists()) nameMap[tid as string] = p.data().name;
        })
      );
      return rows.map((r: any) => ({
        ...r,
        created_at: r.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        teacher_name: nameMap[r.teacher_id] || 'Teacher',
      }));
    },
  });
}

export function useCreateAnnouncement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string }) => {
      await addDoc(collection(db, 'announcements'), {
        title: input.title.trim(),
        body: input.body.trim(),
        teacher_id: user!.id,
        created_at: serverTimestamp(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'announcements', id));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
