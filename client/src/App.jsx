import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';
import { AppLoader } from './components/NotesLoader';
import LandingPage from './pages/LandingPage';
import { Agentation } from 'agentation';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LecturesPage = lazy(() => import('./pages/LecturesPage'));
const NotesEditorPage = lazy(() => import('./pages/NotesEditorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <AppLoader />
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <CommandPaletteProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
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
                  path="/profile"
                  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
                />
                <Route
                  path="/revision"
                  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <CommandPalette />
            {import.meta.env.DEV && <Agentation />}
          </CommandPaletteProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
