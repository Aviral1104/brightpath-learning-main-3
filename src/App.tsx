import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherCourseDetail from "./pages/teacher/TeacherCourseDetail";
import TeacherAssignments from "./pages/teacher/TeacherAssignments";
import TeacherFeedback from "./pages/teacher/TeacherFeedback";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentFeedback from "./pages/student/StudentFeedback";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentProgress from "./pages/parent/ParentProgress";
import ParentFeedback from "./pages/parent/ParentFeedback";
import AnnouncementsPage from "./pages/shared/AnnouncementsPage";
import ForumsPage from "./pages/shared/ForumsPage";
import ForumThreadPage from "./pages/shared/ForumThreadPage";
import NotFound from "./pages/NotFound";
import DevBypass from "./components/DevBypass";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl gradient-violet flex items-center justify-center mx-auto mb-4 shadow-violet animate-pulse">
          <span className="text-white font-bold text-lg">B</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (allowedRole && user?.role !== allowedRole) return <Navigate to={`/${user?.role}`} replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DevBypass />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Teacher routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/courses" element={<ProtectedRoute allowedRole="teacher"><TeacherCourses /></ProtectedRoute>} />
              <Route path="/teacher/courses/:courseId" element={<ProtectedRoute allowedRole="teacher"><TeacherCourseDetail /></ProtectedRoute>} />
              <Route path="/teacher/assignments" element={<ProtectedRoute allowedRole="teacher"><TeacherAssignments /></ProtectedRoute>} />
              <Route path="/teacher/feedback" element={<ProtectedRoute allowedRole="teacher"><TeacherFeedback /></ProtectedRoute>} />
              <Route path="/teacher/announcements" element={<ProtectedRoute allowedRole="teacher"><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="/teacher/forums" element={<ProtectedRoute allowedRole="teacher"><ForumsPage /></ProtectedRoute>} />
              <Route path="/teacher/forums/:threadId" element={<ProtectedRoute allowedRole="teacher"><ForumThreadPage /></ProtectedRoute>} />

              {/* Student routes */}
              <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/courses" element={<ProtectedRoute allowedRole="student"><StudentCourses /></ProtectedRoute>} />
              <Route path="/student/assignments" element={<ProtectedRoute allowedRole="student"><StudentAssignments /></ProtectedRoute>} />
              <Route path="/student/feedback" element={<ProtectedRoute allowedRole="student"><StudentFeedback /></ProtectedRoute>} />
              <Route path="/student/announcements" element={<ProtectedRoute allowedRole="student"><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="/student/forums" element={<ProtectedRoute allowedRole="student"><ForumsPage /></ProtectedRoute>} />
              <Route path="/student/forums/:threadId" element={<ProtectedRoute allowedRole="student"><ForumThreadPage /></ProtectedRoute>} />

              {/* Parent routes */}
              <Route path="/parent" element={<ProtectedRoute allowedRole="parent"><ParentDashboard /></ProtectedRoute>} />
              <Route path="/parent/progress" element={<ProtectedRoute allowedRole="parent"><ParentProgress /></ProtectedRoute>} />
              <Route path="/parent/feedback" element={<ProtectedRoute allowedRole="parent"><ParentFeedback /></ProtectedRoute>} />
              <Route path="/parent/announcements" element={<ProtectedRoute allowedRole="parent"><AnnouncementsPage /></ProtectedRoute>} />
              <Route path="/parent/forums" element={<ProtectedRoute allowedRole="parent"><ForumsPage /></ProtectedRoute>} />
              <Route path="/parent/forums/:threadId" element={<ProtectedRoute allowedRole="parent"><ForumThreadPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
