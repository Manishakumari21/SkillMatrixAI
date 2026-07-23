import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import SkillGap from "./pages/skillgap";
import MockInterview from "./pages/MockInterview";
import Roadmap from "./pages/roadmap";
import ATSResume from "./pages/ats_resume";
import JobListings from "./pages/JobListings";
import DSAPractice from "./pages/DSAPractice";
import Portfolio from "./pages/Portfolio";
import ProgressTracker from "./pages/ProgressTracker";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
          <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobListings /></ProtectedRoute>} />
          <Route path="/dsa-practice" element={<ProtectedRoute><DSAPractice /></ProtectedRoute>} />
          <Route path="/ats-resume" element={<ProtectedRoute><ATSResume /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/progress-tracker" element={<ProtectedRoute><ProgressTracker /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
