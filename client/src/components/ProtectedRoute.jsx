import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLoader } from './NotesLoader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;