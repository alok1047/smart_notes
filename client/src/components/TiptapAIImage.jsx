import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef } from 'react';
import { Trash2, GripHorizontal, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import AIImageBlock from './AIImageBlock';

const TiptapAIImage = ({ node, updateAttributes, selected, deleteNode }) => {
  const { src, alt, width, height, align } = node.attrs;
  
  const isAIImage = src?.startsWith('ai-image://') || src?.includes('pollinations') || src?.includes('lexica') || alt?.toLowerCase().includes('generated') || alt?.toLowerCase().includes('image');

  const [isResizing, setIsResizing] = useState(false);
  const imgRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation(); // prevent drag
    setIsResizing(true);
    const startX = e.pageX;
    const startWidth = imgRef.current.clientWidth;

    const onMouseMove = (moveEvent) => {
      const currentX = moveEvent.pageX;
      const newWidth = startWidth + (currentX - startX);
      updateAttributes({ width: Math.max(50, newWidth) }); // minimum 50px
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  let alignClass = '';
  if (align === 'center') alignClass = 'mx-auto block';
  else if (align === 'right') alignClass = 'float-right ml-4';
  else if (align === 'left') alignClass = 'float-left mr-4';
  else alignClass = 'inline-block';

  return (
    <NodeViewWrapper className={`my-4 relative max-w-full rounded-xl transition-shadow ${alignClass} ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
      {isAIImage ? (
        <div className="relative group inline-block max-w-full">
          <div className="cursor-default">
            <AIImageBlock 
              prompt={src?.startsWith('ai-image://') ? decodeURIComponent(src.replace('ai-image://', '')) : (alt || 'Educational visual diagram')} 
              initialUrl={src} 
              alt={alt} 
            />
          </div>
          {selected && (
            <>
              {/* Move Button */}
              <div
                data-drag-handle
                className="absolute top-2 left-2 w-7 h-7 bg-white/90 backdrop-blur-sm border border-black/10 text-gray-600 hover:text-blue-500 flex items-center justify-center rounded-md shadow-sm transition-colors z-10 cursor-grab active:cursor-grabbing"
                title="Drag to move"
              >
                <GripHorizontal size={14} />
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteNode();
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center rounded-full shadow-md transition-colors z-10"
                title="Delete Image"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="relative group inline-block max-w-full">
          <img
            ref={imgRef}
            src={src}
            alt={alt || 'Lecture Image'}
            loading="lazy"
            className="block rounded-xl cursor-grab active:cursor-grabbing border border-(--border-subtle) shadow-sm"
            style={{ width: width ? `${width}px` : 'auto', height: height ? `${height}px` : 'auto', maxWidth: '100%' }}
            data-drag-handle
          />
          {selected && (
            <>
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteNode();
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center rounded-full shadow-md transition-colors z-10"
                title="Delete Image"
              >
                <Trash2 size={14} />
              </button>

              {/* Resize Handle */}
              <div
                className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-md transform translate-x-1/2 translate-y-1/2 hover:scale-110 active:scale-95 transition-transform z-10"
                onMouseDown={startResize}
              />
            </>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default TiptapAIImage;
