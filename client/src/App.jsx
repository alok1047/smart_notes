import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LecturesPage from './pages/LecturesPage';
import NotesEditorPage from './pages/NotesEditorPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/lectures/:subjectId"
            element={<ProtectedRoute><LecturesPage /></ProtectedRoute>}
          />
          <Route
            path="/editor/:lectureId"
            element={<ProtectedRoute><NotesEditorPage /></ProtectedRoute>}
          />
          {/* Redirect /revision to dashboard for now */}
          <Route
            path="/revision"
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
