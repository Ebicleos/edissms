import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Auth
import Auth from "./pages/Auth";

// Admin pages
import Dashboard from "./pages/Dashboard";
import Admission from "./pages/Admission";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import Fees from "./pages/Fees";
import Exams from "./pages/Exams";
import OnlineClasses from "./pages/OnlineClasses";
import Attendance from "./pages/Attendance";
import IDCards from "./pages/IDCards";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import ReportCards from "./pages/ReportCards";
import StudentPromotion from "./pages/StudentPromotion";
import NotFound from "./pages/NotFound";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherExams from "./pages/teacher/TeacherExams";
import CreateExam from "./pages/teacher/CreateExam";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentResults from "./pages/student/StudentResults";
import StudentFees from "./pages/student/StudentFees";
import StudentIDCard from "./pages/student/StudentIDCard";

// CBT pages
import CBTPortal from "./pages/cbt/CBTPortal";
import TakeExam from "./pages/cbt/TakeExam";
import ExamResults from "./pages/cbt/ExamResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />

            {/* Admin routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admission" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admission />
              </ProtectedRoute>
            } />
            <Route path="/students" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Students />
              </ProtectedRoute>
            } />
            <Route path="/classes" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Classes />
              </ProtectedRoute>
            } />
            <Route path="/teachers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Teachers />
              </ProtectedRoute>
            } />
            <Route path="/fees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Fees />
              </ProtectedRoute>
            } />
            <Route path="/exams" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Exams />
              </ProtectedRoute>
            } />
            <Route path="/id-cards" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <IDCards />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/report-cards" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportCards />
              </ProtectedRoute>
            } />
            <Route path="/promotion" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentPromotion />
              </ProtectedRoute>
            } />

            {/* Shared routes */}
            <Route path="/online-classes" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <OnlineClasses />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <Messages />
              </ProtectedRoute>
            } />

            {/* Teacher routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Students />
              </ProtectedRoute>
            } />
            <Route path="/teacher/exams" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherExams />
              </ProtectedRoute>
            } />
            <Route path="/teacher/exams/create" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <CreateExam />
              </ProtectedRoute>
            } />

            {/* Student routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/results" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentResults />
              </ProtectedRoute>
            } />
            <Route path="/student/fees" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentFees />
              </ProtectedRoute>
            } />
            <Route path="/student/id-card" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentIDCard />
              </ProtectedRoute>
            } />

            {/* CBT routes */}
            <Route path="/cbt" element={
              <ProtectedRoute allowedRoles={['student']}>
                <CBTPortal />
              </ProtectedRoute>
            } />
            <Route path="/cbt/exam/:examId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <TakeExam />
              </ProtectedRoute>
            } />
            <Route path="/cbt/results/:submissionId" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamResults />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
