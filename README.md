# 🎓 Brightpath Learning

> An accessible education platform designed for especially-abled students, connecting teachers, students, and parents in one unified space.

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
</p>

---

## 📖 Overview

**Brightpath Learning** is a full-stack web application that bridges the gap between teachers, students, and parents within an inclusive learning ecosystem. The platform prioritises accessibility through built-in Text-to-Speech (powered by Amazon Polly), WCAG-compliant design, a distraction-free Focus Timer, and full dark-mode support.

### Key Goals
- Empower **teachers** to create and manage structured course content with rich media
- Give **students** a seamless, accessible learning experience with progress tracking
- Keep **parents** informed through real-time progress dashboards and teacher feedback

---

## Features

<details>
<summary><b> Teacher Portal</b></summary>

| Feature | Description |
|---|---|
| **Dashboard** | Overview of enrolled students, active courses, and recent activity |
| **Course Builder** | Create courses with chapters, subchapters, and rich lesson content |
| **Media Blocks** | Embed images, videos, audio, code snippets, and downloadable files (Notion-style) |
| **Assignments** | Create and manage assignments with MCQ questions and written prompts |
| **Feedback** | View and respond to student submissions |
| **Announcements** | Broadcast announcements to all enrolled students and parents |
| **Forums** | Create and participate in discussion threads |
| **Student Progress** | Cumulative progress dashboard aggregating lesson completion per student |

</details>

<details>
<summary><b> Student Portal</b></summary>

| Feature | Description |
|---|---|
| **Dashboard** | Personalised overview with today's schedule and quick stats |
| **Courses** | Browse, enrol, and study at own pace; mark lessons complete |
| **Text-to-Speech** | Amazon Polly-powered TTS with 5 playback states, speed control, and caching |
| **Focus Timer** | Persistent Pomodoro-style timer that keeps ticking across page navigations |
| **Assignments** | View and submit MCQ / written assignments |
| **Feedback** | View teacher feedback on submissions |
| **Announcements & Forums** | Stay connected with the teacher community |

</details>

<details>
<summary><b> Parent Portal</b></summary>

| Feature | Description |
|---|---|
| **Dashboard** | At-a-glance view of linked child's progress |
| **Progress Tracker** | Detailed lesson-by-lesson progress per course |
| **Feedback** | View teacher's feedback on child's submissions |
| **Announcements & Forums** | Stay informed about class-wide announcements |

</details>

<details>
<summary><b> Accessibility Highlights</b></summary>

- **Amazon Polly TTS** — high-quality neural voice synthesis with playback controls
- **Focus Timer** — Pomodoro-style timer with persistence across navigation (no interruption)
- **Dark Mode** — full system-aware dark/light theme via `next-themes`
- **WCAG-compliant** — keyboard navigable, proper ARIA attributes, accessible focus rings

</details>

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 + Radix UI primitives (shadcn/ui) |
| **Routing** | React Router DOM v6 |
| **State / Data Fetching** | TanStack React Query v5 |
| **Backend / Database** | Firebase Firestore (NoSQL) |
| **Authentication** | Firebase Auth |
| **Text-to-Speech** | Amazon Polly via `@aws-sdk/client-polly` |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Testing** | Vitest + React Testing Library |

---

##  Project Structure

```
brightpath-learning/
├── public/                    # Static assets
├── scripts/
│   └── setup.js               # Interactive migration runner
├── src/
│   ├── components/            # Shared UI components
│   │   ├── DashboardLayout.tsx    # Sidebar + nav shell for all dashboards
│   │   ├── FocusTimer.tsx         # Pomodoro focus timer widget
│   │   ├── TextToSpeech.tsx       # Amazon Polly TTS component
│   │   ├── MediaBlockPicker.tsx   # Rich media embed picker
│   │   ├── EditProfileModal.tsx   # User profile editor
│   │   ├── LinkStudentDialog.tsx  # Parent–student account linking
│   │   └── ui/                    # shadcn/ui base components
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Firebase auth state + user profile
│   │   └── FocusTimerContext.tsx  # Global focus timer state (persists across pages)
│   ├── hooks/                 # Custom React hooks
│   │   ├── useCourses.ts          # CRUD for courses, chapters, subchapters
│   │   ├── useProgress.ts         # Student lesson completion progress
│   │   ├── useAssignments.ts      # Assignment creation, submission, feedback
│   │   ├── useStudentCourses.ts   # Student enrolment and course browsing
│   │   ├── useForums.ts           # Forum threads and replies
│   │   ├── useAnnouncements.ts    # Teacher announcements
│   │   ├── useTeacherStats.ts     # Teacher dashboard aggregations
│   │   ├── useStudentStats.ts     # Student dashboard statistics
│   │   └── useParentData.ts       # Parent–child link data
│   ├── integrations/
│   │   └── firebase/
│   │       └── client.ts          # Firebase app + Firestore + Auth initialisation
│   ├── pages/
│   │   ├── LandingPage.tsx        # Public home page
│   │   ├── AuthPage.tsx           # Sign-in / Sign-up page
│   │   ├── teacher/               # Teacher-only pages
│   │   ├── student/               # Student-only pages
│   │   ├── parent/                # Parent-only pages
│   │   └── shared/                # Pages shared across roles
│   ├── types/                 # Shared TypeScript type definitions
│   ├── lib/                   # Utility helpers
│   ├── App.tsx                # Root routes + auth guards
│   └── main.tsx               # React entry point
├── firestore.rules            # Firestore security rules
├── .env.example               # Environment variable template
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

##  Firestore Data Model

| Collection | Description |
|---|---|
| `profiles` | User profiles with `role` (`teacher` / `student` / `parent`) |
| `courses` | Course metadata owned by a teacher |
| `chapters` | Chapter documents linked to a course |
| `subchapters` | Lesson content (text, media blocks) within a chapter |
| `assignments` | Assignment definitions with MCQ questions |
| `mcq_questions` | MCQ question documents per assignment |
| `mcq_options` | Answer options per question |
| `submissions` | Student assignment submissions + teacher feedback |
| `enrollments` | Student ↔ Course enrolment records |
| `progress` | Lesson completion state keyed as `{studentId}_{courseId}` |
| `announcements` | Teacher-authored class announcements |
| `forum_threads` | Discussion thread posts |
| `forum_replies` | Replies nested under a thread |
| `parent_student_links` | Parent ↔ Student account associations |

---

##  Security

Firestore security rules enforce strict role-based access:

- **Teachers** can only write their own courses, chapters, and assignments
- **Students** can only create/update their own enrolments, progress, and submissions
- **Parents** can only read data linked to their child
- All write operations validate the caller's `role` from the `profiles` collection server-side

---

##  Getting Started

### Prerequisites

- Node.js ≥ 18
- A Firebase project with **Firestore** and **Authentication** enabled
- AWS credentials with access to **Amazon Polly** (for TTS)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/brightpath-learning.git
cd brightpath-learning
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# AWS Polly (Text-to-Speech)
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_id
VITE_AWS_SECRET_KEY=your_aws_secret_access_key
VITE_AWS_REGION=ap-south-1
```

> **Note:** Firebase config lives in `src/integrations/firebase/client.ts`. Update that file with your Firebase project credentials.

### 4. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

##  Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run setup` | Interactive migration script |

---

##  Testing

Tests live in `src/test/` and use **Vitest** + **React Testing Library**.

```bash
npm test             # Run all tests once
npm run test:watch   # Watch mode for TDD
```

---

##  Deployment (Vercel)

1. Push the repository to GitHub
2. Import the project in [Vercel](https://vercel.com/)
3. Set the following **Environment Variables** in the Vercel dashboard:
   - `VITE_AWS_ACCESS_KEY_ID`
   - `VITE_AWS_SECRET_KEY`
   - `VITE_AWS_REGION`
4. Deploy — Vercel will automatically detect Vite and set `npm run build` as the build command

>  Never commit your `.env` file. It is already listed in `.gitignore`.

---

##  Route Map

```
/                          → Landing page (public)
/auth                      → Sign in / Sign up

/teacher                   → Teacher Dashboard
/teacher/courses           → Course list
/teacher/courses/:id       → Course editor (lessons + media)
/teacher/assignments       → Assignment manager
/teacher/feedback          → Student submission feedback
/teacher/announcements     → Announcements
/teacher/forums            → Forum threads
/teacher/forums/:threadId  → Forum thread detail

/student                   → Student Dashboard
/student/courses           → Course browser + lesson viewer + TTS
/student/assignments       → Assignment submission
/student/feedback          → View feedback
/student/announcements     → Announcements
/student/forums            → Forum threads
/student/forums/:threadId  → Forum thread detail

/parent                    → Parent Dashboard
/parent/progress           → Child progress tracker
/parent/feedback           → View child's feedback
/parent/announcements      → Announcements
/parent/forums             → Forum threads
/parent/forums/:threadId   → Forum thread detail
```

---

##  Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push and open a Pull Request

Please follow the existing code style (TypeScript strict, ESLint rules enforced).

---

##  License

This project is for educational purposes.

---

<p align="center">
  <strong>Brightpath Learning</strong> — Empowering Inclusive Education 🌟
</p>
