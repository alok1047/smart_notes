import { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { GripHorizontal, Trash2, Code2 } from 'lucide-react';
import MermaidBlock from './MermaidBlock';

const TiptapCodeBlock = ({ node, updateAttributes, deleteNode }) => {
  const { language } = node.attrs;
  const codeStr = node.textContent;

  const isMermaid = language === 'mermaid' || /^(graph|flowchart|sequenceDiagram|gantt|classDiagram|erDiagram|pie|mindmap|timeline)\s/i.test(codeStr);

  const [isEditing, setIsEditing] = useState(false);

  return (
    <NodeViewWrapper className="my-4 relative group">
      {/* Global Actions (Drag, Delete, Edit Code) - positioned at top right of the whole block */}
      <div contentEditable={false} className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {isMermaid && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="w-7 h-7 bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center rounded-md transition-colors"
            title="Toggle Code"
          >
            <Code2 size={14} />
          </button>
        )}
        <div
          data-drag-handle
          className="w-7 h-7 bg-(--border-subtle) text-(--text-dim) hover:text-(--text) flex items-center justify-center rounded-md cursor-grab active:cursor-grabbing transition-colors shadow-sm"
          title="Drag to move"
        >
          <GripHorizontal size={14} />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteNode();
          }}
          className="w-7 h-7 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center rounded-md transition-colors shadow-sm"
          title="Delete block"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Show Diagram Preview if it's Mermaid */}
      {isMermaid && (
        <div contentEditable={false} className="mb-4 relative">
          <MermaidBlock chart={codeStr} />
        </div>
      )}

      {/* Code Editor Area */}
      <div className={`p-4 rounded-xl bg-(--surface) overflow-x-auto text-[13px] border border-(--border-subtle) relative ${isMermaid && !isEditing ? 'hidden' : 'block'}`}>
        <select
          contentEditable={false}
          className="absolute top-2 right-2 text-xs bg-black/20 text-white rounded px-2 py-1 outline-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
          value={language || ''}
          onChange={event => updateAttributes({ language: event.target.value })}
        >
          <option value="">Auto</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="mermaid">Mermaid</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
        </select>
        
        <pre><NodeViewContent as="code" className={language ? `language-${language}` : ''} /></pre>
      </div>
    </NodeViewWrapper>
  );
};

export default TiptapCodeBlock;
