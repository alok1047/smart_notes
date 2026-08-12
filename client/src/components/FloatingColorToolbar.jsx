import { useState, useEffect } from 'react';

const COLORS = [
  { id: 'blue', label: 'Blue', color: '#60a5fa' },
  { id: 'yellow', label: 'Yellow', color: '#facc15' },
  { id: 'green', label: 'Green', color: '#4ade80' },
  { id: 'red', label: 'Red', color: '#f87171' },
];

const FloatingColorToolbar = ({ onColorSelect, containerId = 'processed-markdown-content' }) => {
  const [position, setPosition] = useState(null);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // Ensure the selection is inside our container
      const container = document.getElementById(containerId);
      if (container && !container.contains(selection.anchorNode)) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position above the selection
      setPosition({
        top: rect.top - 45, // 45px above relative to viewport
        left: rect.left + rect.width / 2, // Centered
      });
      setSelectedText(text);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [containerId]);

  if (!position) return null;

  const handleColorClick = (colorHex) => {
    onColorSelect(selectedText, colorHex);
    // Clear selection
    window.getSelection().removeAllRanges();
    setPosition(null);
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-1.5 p-1.5 bg-(--surface) border border-(--border-subtle) rounded-lg shadow-xl animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <span className="text-[11px] font-medium text-(--text-dim) px-2 border-r border-(--border-subtle) mr-1">
        Color
      </span>
      {COLORS.map((c) => (
        <button
          key={c.id}
          onClick={() => handleColorClick(c.color)}
          className="w-5 h-5 rounded-full border border-black/10 shadow-sm hover:scale-110 transition-transform cursor-pointer"
          style={{ backgroundColor: c.color }}
          title={c.label}
        />
      ))}
      <button
        onClick={() => handleColorClick('default')}
        className="text-[12px] px-2 py-0.5 ml-1 rounded hover:bg-(--surface-hover) text-(--text) font-medium transition-colors cursor-pointer"
        title="Remove color"
      >
        Reset
      </button>
    </div>
  );
};

export default FloatingColorToolbar;
