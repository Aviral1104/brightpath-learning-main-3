import { Course, Assignment, Submission, StudentProgress, User } from '@/types';

export const mockUsers: User[] = [
  { id: 't1', name: 'Ms. Sarah Johnson', email: 'sarah@school.edu', role: 'teacher' },
  { id: 's1', name: 'Alex Rivera', email: 'alex@school.edu', role: 'student' },
  { id: 's2', name: 'Maya Chen', email: 'maya@school.edu', role: 'student' },
  { id: 'p1', name: 'David Rivera', email: 'david@family.com', role: 'parent' },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    title: 'World History',
    description: 'Journey through ancient civilizations, revolutions, and key events that shaped our world.',
    teacherId: 't1',
    teacherName: 'Ms. Sarah Johnson',
    enrolledStudents: ['s1', 's2'],
    color: 'primary',
    icon: '🏛️',
    chapters: [
      {
        id: 'ch1',
        title: 'Ancient Civilizations',
        description: 'Explore the earliest human civilizations.',
        subchapters: [
          { id: 'sc1', title: 'Mesopotamia', content: 'Mesopotamia, the land between the Tigris and Euphrates rivers, is often called the cradle of civilization.', mediaType: 'text' },
          { id: 'sc2', title: 'Ancient Egypt', content: 'Ancient Egypt thrived along the Nile River for thousands of years, building pyramids and developing hieroglyphics.', mediaType: 'video', mediaUrl: '#' },
          { id: 'sc3', title: 'Indus Valley', content: 'The Indus Valley Civilization was one of the most advanced early urban cultures with planned cities.', mediaType: 'text' },
        ],
      },
      {
        id: 'ch2',
        title: 'Medieval Period',
        description: 'Life in the Middle Ages.',
        subchapters: [
          { id: 'sc4', title: 'Feudal System', content: 'The feudal system organized society into a hierarchy of kings, lords, knights, and peasants.', mediaType: 'text' },
          { id: 'sc5', title: 'The Crusades', content: 'The Crusades were a series of religious wars between Christians and Muslims for control of the Holy Land.', mediaType: 'text' },
        ],
      },
    ],
  },
  {
    id: 'c2',
    title: 'Data Structures & Algorithms',
    description: 'Master fundamental DSA concepts with visual explanations and step-by-step problem solving.',
    teacherId: 't1',
    teacherName: 'Ms. Sarah Johnson',
    enrolledStudents: ['s1'],
    color: 'secondary',
    icon: '🧮',
    chapters: [
      {
        id: 'ch3',
        title: 'Arrays & Strings',
        description: 'Understanding linear data structures.',
        subchapters: [
          { id: 'sc6', title: 'Introduction to Arrays', content: 'An array is a collection of items stored at contiguous memory locations. It is the simplest data structure.', mediaType: 'text' },
          { id: 'sc7', title: 'String Manipulation', content: 'Strings are sequences of characters. Learn common operations like reversal, searching, and pattern matching.', mediaType: 'text' },
        ],
      },
      {
        id: 'ch4',
        title: 'Linked Lists',
        description: 'Dynamic data structures with pointers.',
        subchapters: [
          { id: 'sc8', title: 'Singly Linked List', content: 'A singly linked list is a linear data structure where each element points to the next one in the sequence.', mediaType: 'text' },
        ],
      },
    ],
  },
  {
    id: 'c3',
    title: 'Mathematics Fundamentals',
    description: 'Build a strong math foundation with visual patterns, games, and real-world examples.',
    teacherId: 't1',
    teacherName: 'Ms. Sarah Johnson',
    enrolledStudents: ['s1', 's2'],
    color: 'accent',
    icon: '📐',
    chapters: [
      {
        id: 'ch5',
        title: 'Algebra Basics',
        description: 'Introduction to algebraic thinking.',
        subchapters: [
          { id: 'sc9', title: 'Variables & Expressions', content: 'Variables are symbols that represent unknown values. Expressions combine variables, numbers, and operations.', mediaType: 'text' },
          { id: 'sc10', title: 'Solving Equations', content: 'An equation states that two expressions are equal. Solving means finding the value that makes it true.', mediaType: 'video', mediaUrl: '#' },
        ],
      },
      {
        id: 'ch6',
        title: 'Geometry',
        description: 'Shapes, angles, and spatial reasoning.',
        subchapters: [
          { id: 'sc11', title: 'Basic Shapes', content: 'Geometry studies shapes like triangles, squares, circles, and their properties.', mediaType: 'text' },
        ],
      },
    ],
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    title: 'Ancient Civilizations Quiz',
    courseId: 'c1',
    chapterId: 'ch1',
    teacherId: 't1',
    difficulty: 'easy',
    dueDate: '2026-03-15',
    questions: [
      {
        id: 'q1', question: 'Which civilization is called the cradle of civilization?', difficulty: 'easy',
        options: [
          { id: 'o1', text: 'Mesopotamia', isCorrect: true },
          { id: 'o2', text: 'Ancient Rome', isCorrect: false },
          { id: 'o3', text: 'Ancient China', isCorrect: false },
          { id: 'o4', text: 'Maya', isCorrect: false },
        ],
      },
      {
        id: 'q2', question: 'Along which river did Ancient Egypt thrive?', difficulty: 'easy',
        options: [
          { id: 'o5', text: 'Amazon', isCorrect: false },
          { id: 'o6', text: 'Nile', isCorrect: true },
          { id: 'o7', text: 'Ganges', isCorrect: false },
          { id: 'o8', text: 'Danube', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'a2',
    title: 'Arrays Basics Test',
    courseId: 'c2',
    chapterId: 'ch3',
    teacherId: 't1',
    difficulty: 'medium',
    dueDate: '2026-03-20',
    questions: [
      {
        id: 'q3', question: 'What is the time complexity of accessing an array element by index?', difficulty: 'easy',
        options: [
          { id: 'o9', text: 'O(1)', isCorrect: true },
          { id: 'o10', text: 'O(n)', isCorrect: false },
          { id: 'o11', text: 'O(log n)', isCorrect: false },
          { id: 'o12', text: 'O(n²)', isCorrect: false },
        ],
      },
    ],
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: 'sub1', assignmentId: 'a1', studentId: 's1', studentName: 'Alex Rivera',
    answers: { q1: 'o1', q2: 'o6' }, score: 2, totalQuestions: 2,
    submittedAt: '2026-03-10',
    feedback: 'Excellent work, Alex! Perfect score on ancient civilizations.',
    insights: 'Strong understanding of history. Ready for more challenging content.',
  },
  {
    id: 'sub2', assignmentId: 'a1', studentId: 's2', studentName: 'Maya Chen',
    answers: { q1: 'o1', q2: 'o5' }, score: 1, totalQuestions: 2,
    submittedAt: '2026-03-11',
    feedback: 'Good effort, Maya! Review the section on Ancient Egypt.',
    insights: 'Needs reinforcement on Egyptian history.',
  },
];

export const mockProgress: StudentProgress[] = [
  { studentId: 's1', studentName: 'Alex Rivera', courseId: 'c1', courseName: 'World History', completedChapters: 1, totalChapters: 2, assignmentsCompleted: 1, averageScore: 100, lastActive: '2026-03-10' },
  { studentId: 's1', studentName: 'Alex Rivera', courseId: 'c2', courseName: 'Data Structures & Algorithms', completedChapters: 0, totalChapters: 2, assignmentsCompleted: 0, averageScore: 0, lastActive: '2026-03-08' },
  { studentId: 's1', studentName: 'Alex Rivera', courseId: 'c3', courseName: 'Mathematics Fundamentals', completedChapters: 1, totalChapters: 2, assignmentsCompleted: 0, averageScore: 0, lastActive: '2026-03-09' },
];
