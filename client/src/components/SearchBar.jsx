import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, FileText, BookOpen, X } from 'lucide-react';
import { searchAll } from '../services/lectureService';

const SearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (value) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    try {
      setLoading(true);
      const data = await searchAll(value);
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subject) => {
    setShowResults(false);
    setQuery('');
    navigate(`/lectures/${subject._id}`);
    onSelect?.();
  };

  const handleLectureClick = (lecture) => {
    setShowResults(false);
    setQuery('');
    navigate(`/editor/${lecture._id}`);
    onSelect?.();
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-700" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results && setShowResults(true)}
          placeholder="Search subjects, lectures, notes..."
          className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface-800/80 border border-surface-700/50 text-sm text-surface-100 placeholder-surface-700 outline-none transition-all focus:bg-surface-800 input-focus-ring"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 animate-spin" />
        )}
        {query && !loading && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-700 hover:text-surface-200">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results && (
        <div
          className="absolute top-full mt-2 w-full glass rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 animate-fade-in"
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.totalResults === 0 ? (
            <div className="px-4 py-6 text-center text-surface-700 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {/* Subject results */}
              {results.subjects?.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-surface-700 uppercase tracking-wider">Subjects</p>
                  {results.subjects.map((subject) => (
                    <button
                      key={subject._id}
                      onClick={() => handleSubjectClick(subject)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-800 transition-colors text-left"
                    >
                      <BookOpen size={16} className="text-primary-400 shrink-0" />
                      <span className="text-sm text-surface-200 truncate">{subject.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Lecture results */}
              {results.lectures?.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-surface-700 uppercase tracking-wider">Lectures</p>
                  {results.lectures.slice(0, 8).map((lecture) => (
                    <button
                      key={lecture._id}
                      onClick={() => handleLectureClick(lecture)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-800 transition-colors text-left"
                    >
                      <FileText size={16} className="text-accent-cyan shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm text-surface-200 block truncate">
                          Lecture {lecture.lectureNumber}
                        </span>
                        <span className="text-xs text-surface-700 truncate block">
                          {lecture.subjectName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
