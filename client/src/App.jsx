import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LecturesPage from './pages/LecturesPage';
import NotesEditorPage from './pages/NotesEditorPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <CommandPaletteProvider>
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
              <Route
                path="/revision"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <CommandPalette />
          </CommandPaletteProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
