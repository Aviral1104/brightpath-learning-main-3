# Brightpath Learning - Development Workflow

Welcome to the **Brightpath Learning** project! This document outlines the development workflow, architecture guidelines, and available commands to help you get started quickly and maintain consistency across the codebase.

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed along with a package manager (`npm` or `bun`). The repository supports both `package-lock.json` and `bun.lock`/`bun.lockb`.

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd brightpath-learning-main-3
   ```
2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

## 🛠️ Development Commands

We use [Vite](https://vitejs.dev/) alongside React and TypeScript for a fast, modern build pipeline.

- **Start Development Server**: 
  ```bash
  npm run dev
  ```
  Runs the app in development mode at `http://localhost:8080` (or another available port). Features instant HMR.

- **Build for Production**:
  ```bash
  npm run build
  ```
  Creates an optimized production build in the `dist` directory.

- **Preview Production Build**:
  ```bash
  npm run preview
  ```
  Serves the production build locally to verify behavior before deployment.

- **Linting**:
  ```bash
  npm run lint
  ```
  Runs ESLint to find and enforce coding standards across the project.

## 🧪 Testing

We use [Vitest](https://vitest.dev/) combined with React Testing Library for fast, robust unit and component testing.

- **Run Tests Once**:
  ```bash
  npm run test
  ```
- **Run Tests in Watch Mode** (useful during active development):
  ```bash
  npm run test:watch
  ```

## 🏗️ Project Architecture & Guidelines

Our source code rests securely under the `/src` directory, broken down by domain and functionality:

- **`/src/components`**: All reusable UI components. We heavily utilize [shadcn/ui](https://ui.shadcn.com/) paired with [TailwindCSS](https://tailwindcss.com/) and accessible Radix primitives.
- **`/src/pages`**: Top-level route components utilized by `react-router-dom`. Try to keep complex business logic extracted into custom hooks or context.
- **`/src/hooks`**: Custom reusable React hooks for abstracted component behavior.
- **`/src/contexts`**: React context providers used for global state management.
- **`/src/lib`**: Pure utility functions and generic helpers (e.g. `utils.ts` for Tailwind class merging).
- **`/src/integrations`**: Contains the glue code for third-party systems.
  - **Firebase**: Backend integration handles secure authentication (Firebase Auth) and real-time data storage (Cloud Firestore). Config lives in `/src/integrations/firebase/client.ts`.
  - **React Query**: We use `@tanstack/react-query` to handle asynchronous state management, cache data, and seamlessly synchronize with Firestore changes.
- **`/src/types`**: High-level TypeScript interfaces or type aliases used across the application.

### Adding New Features

1. **Routing**: When rolling out a new view, build a page component in `/src/pages` and register its path within the router implementation (usually inside `App.tsx` or a dedicated router configuration).
2. **Components**: Build isolated, modular pieces inside `/src/components`. Utilize `class-variance-authority` (`cva`) alongside `clsx` and `tailwind-merge` to handle UI variants easily.
3. **Data Fetching**: When fetching from or mutating your database, leverage custom React Query hooks. Keep the data layer out of pure UI components when possible.

### Styling & Theming

- **Tailwind CSS**: Use utility classes directly in your `.tsx` and `.tsx` files. Avoid writing raw CSS unless absolutely necessary.
- **Theming**: Check `index.css` to find CSS variables mapped to Tailwind themes. For theming/dark mode, use `next-themes` connected to our `ThemeProvider`.

## 🔄 General Guidelines

1. **Type Safety**: Strictly adhere to TypeScript best practices. Type props for your React components and favor Interfaces over 'any'.
2. **Accessiblity (a11y)**: When building custom interactive components, keep keyboard navigation and screen-reader compatibility in mind. Use Radix primitives available in the codebase to make this easy.
3. **Formatting**: Ensure your editor respects the `.eslintrc` configuration so the team shares a consistent coding style.

## 📊 Application Theory & Dashboards

Brightpath Learning features a role-based architecture to serve the three primary users of the educational platform: **Students**, **Teachers**, and **Parents**. Each role has dedicated views (`/src/pages/{role}`) and functionalities tailored to their specific needs.

### 1. Student Dashboard (`/src/pages/student`)

The Student portal is the core learning interface, designed to be engaging and accessible.
- **StudentDashboard.tsx**: The main landing area providing a high-level overview of the student's progress, recent courses, and upcoming deadlines.
- **StudentCourses.tsx**: A detailed view of all enrolled courses, including syllabus structures and active modules.
- **StudentAssignments.tsx**: A dedicated space for viewing, tracking, and submitting assignments or quizzes.
- **StudentFeedback.tsx**: Interface for receiving grades, performance metrics, and direct feedback from instructors.

### 2. Teacher Dashboard (`/src/pages/teacher`)

The Teacher portal provides robust course management and student evaluation tools.
- **TeacherDashboard.tsx**: An administrative overview of all active classes, pending grading tasks, and overall student engagement metrics.
- **TeacherCourses.tsx** & **TeacherCourseDetail.tsx**: Interfaces for creating, editing, and managing course content and curriculum structure.
- **TeacherAssignments.tsx**: Tools for creating new assignments, setting due dates, and grading submitted work.
- **TeacherFeedback.tsx**: A communication hub allowing teachers to leave structured feedback, grades, and notes for individual students.

### 3. Parent Dashboard (`/src/pages/parent`)

The Parent portal focuses on visibility, allowing guardians to track and support their child's educational journey.
- **ParentDashboard.tsx**: A specialized overview aggregating the linked student's recent activity, alerts, and general standing.
- **ParentProgress.tsx**: Detailed analytics and progress reports showing the student's performance across different subjects over time.
- **ParentFeedback.tsx**: A direct line of sight into the feedback provided by teachers, helping parents understand where their child excels or needs support.

### Role-Based Access Control (RBAC)

Routing and data access are strictly controlled based on the authenticated user's role.
- **Authentication (`AuthPage.tsx`)**: Handles secure login and registration via Firebase Authentication (Email/Password). On sign-up, a user profile document is created in the `profiles` Firestore collection with the selected role.
- **Data Isolation**: Each data hook filters Firestore queries by the authenticated user's ID and role. Students see only their own submissions and enrolled courses; Parents see only their linked child's data; Teachers access only their own courses and assignments.
