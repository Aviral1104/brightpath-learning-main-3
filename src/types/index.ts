export type UserRole = 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Subchapter {
  id: string;
  title: string;
  content: string;
  mediaType?: 'text' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  subchapters: Subchapter[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  chapters: Chapter[];
  enrolledStudents: string[];
  color: string;
  icon: string;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  chapterId?: string;
  teacherId: string;
  questions: MCQQuestion[];
  dueDate: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  submittedAt: string;
  feedback?: string;
  insights?: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  completedChapters: number;
  totalChapters: number;
  assignmentsCompleted: number;
  averageScore: number;
  lastActive: string;
}
