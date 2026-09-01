import { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handler = () => {
      setIsScrolled(window.pageYOffset > 0);
    };
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`glass sticky top-0 z-50 px-4 md:px-6 shadow-sm transition-all duration-300 ease-out ${isScrolled ? 'py-1.5 md:py-2' : 'py-3'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className={`rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 ${isScrolled ? 'w-7 h-7' : 'w-9 h-9'}`}>
            <BookOpen size={isScrolled ? 14 : 18} className="text-white transition-all duration-300" />
          </div>
          <span className={`text-lg font-bold bg-gradient-to-r from-[#4EC5C5] to-[#068864] bg-clip-text text-transparent hidden sm:block transition-all duration-300 ${isScrolled ? 'text-[15px]' : ''}`}>
            NotesSync
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
            {(user?.photoURL || dbUser?.avatar) ? (
              <img
                src={user?.photoURL || dbUser?.avatar}
                alt={user?.displayName || dbUser?.name}
                className={`rounded-full border-2 border-primary-500/30 transition-all duration-300 ${isScrolled ? 'w-6 h-6' : 'w-8 h-8'}`}
              />
            ) : (
              <div className={`rounded-full gradient-primary flex items-center justify-center text-white font-semibold transition-all duration-300 ${isScrolled ? 'w-6 h-6 text-[11px]' : 'w-8 h-8 text-sm'}`}>
                {(dbUser?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className={`text-surface-200 font-medium max-w-[120px] truncate transition-all duration-300 ${isScrolled ? 'text-[13px]' : 'text-sm'}`}>
              {dbUser?.name || user?.displayName || 'User'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg text-surface-200 hover:text-accent-rose hover:bg-surface-800 transition-all duration-300 ${isScrolled ? 'p-1.5' : 'p-2'}`}
            title="Logout"
          >
            <LogOut size={isScrolled ? 16 : 18} className="transition-all duration-300" />
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
