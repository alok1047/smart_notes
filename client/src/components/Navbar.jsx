import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, BookOpen, Menu, X } from 'lucide-react';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, dbUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">
            SmartNotes
          </span>
        </Link>

        {/* Center: Search */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <SearchBar />
        </div>

        {/* Right: User + Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg text-surface-200 hover:text-white hover:bg-surface-800 transition-colors"
          >
            <Search size={18} />
          </button>

          {/* User avatar + name */}
          <div className="hidden sm:flex items-center gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border-2 border-primary-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                {(dbUser?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-surface-200 font-medium max-w-[120px] truncate">
              {dbUser?.name || user?.displayName || 'User'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-surface-200 hover:text-accent-rose hover:bg-surface-800 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>

          {/* Mobile menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 rounded-lg text-surface-200 hover:text-white hover:bg-surface-800 transition-colors"
          >
            {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden mt-3 animate-fade-in">
          <SearchBar onSelect={() => setShowSearch(false)} />
        </div>
      )}

      {/* Mobile menu dropdown */}
      {showMobileMenu && (
        <div className="sm:hidden mt-3 py-3 border-t border-surface-800 animate-fade-in">
          <div className="flex items-center gap-3 px-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                {(dbUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-surface-100">{dbUser?.name || user?.displayName}</p>
              <p className="text-xs text-surface-700">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
