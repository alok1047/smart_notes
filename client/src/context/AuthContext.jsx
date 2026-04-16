import { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, logOut, getIdToken } from '../services/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Sync with backend
        try {
          const token = await firebaseUser.getIdToken();
          const res = await api.post('/auth/google', { token });
          setDbUser(res.data.user);
        } catch (error) {
          console.error('Backend sync error:', error);
        }
      } else {
        setUser(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      const { user: firebaseUser, idToken } = await signInWithGoogle();
      setUser(firebaseUser);

      // Sync with backend
      const res = await api.post('/auth/google', { token: idToken });
      setDbUser(res.data.user);
      setLoading(false);
      return res.data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      setDbUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,           // Firebase user object
    dbUser,         // MongoDB user object
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
