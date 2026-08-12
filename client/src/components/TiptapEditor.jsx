import { useEffect } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Image } from '@tiptap/extension-image';
import TiptapCodeBlock from './TiptapCodeBlock';
import TiptapAIImage from './TiptapAIImage';

const COLORS = [
  { id: 'blue', label: 'Blue', color: '#60a5fa' },
  { id: 'yellow', label: 'Yellow', color: '#facc15' },
  { id: 'green', label: 'Green', color: '#4ade80' },
  { id: 'red', label: 'Red', color: '#f87171' },
];

// Custom Extension to inject React Component for Code Blocks
const ReactCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TiptapCodeBlock);
  },
});

// Custom Extension to inject React Component for Images
const ReactImage = Image.extend({
  inline() {
    return true;
  },
  group() {
    return 'inline';
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
        renderHTML: attributes => {
          if (!attributes.align || attributes.align === 'left') return {};
          return { 'data-align': attributes.align };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(TiptapAIImage);
  },
});

const TiptapEditor = ({ content, onChange, onSave }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // disable default codeblock to use our custom one
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
      }),
      TextStyle,
      Color,
      ReactCodeBlock,
      ReactImage,
    ],
    editorProps: {
      attributes: {
        class: 'markdown-body w-full min-w-0 max-w-none focus:outline-none',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const node = view.state.schema.nodes.image.create({
                src: readerEvent.target.result,
              });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event, slice, moved) {
        if (!moved && event.dataTransfer?.files?.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });
              if (!coordinates) return;
              const node = view.state.schema.nodes.image.create({
                src: readerEvent.target.result,
              });
              const transaction = view.state.tr.insert(coordinates.pos, node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    content: content,
    onUpdate: ({ editor }) => {
      // Fire onChange for live drafting
      onChange(editor.storage.markdown.getMarkdown());
    },
  });
  useEffect(() => {
    if (editor && content !== undefined && editor.storage.markdown.getMarkdown() !== content) {
       // Only update if it's truly out of sync to prevent cursor jumping
       const currentSelection = editor.state.selection;
       editor.commands.setContent(content, false, { preserveWhitespace: 'full' });
       // Try to restore selection (best effort)
       try {
         editor.commands.setTextSelection(currentSelection);
       } catch(e) {}
    }
  }, [content, editor]);

  // Handle Cmd+S or Auto-save could be added here, but parent component handles `onSave(draft)`

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full h-full pb-32">
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100, maxWidth: 'none' }}>
        <div className="flex items-center gap-1.5 p-1.5 bg-(--surface) border border-(--border-subtle) rounded-lg shadow-xl animate-fade-in">
          {/* Turn Into Menu */}
          <select 
            className="text-[12px] bg-transparent border-r border-(--border-subtle) text-(--text) font-medium outline-none cursor-pointer pr-2 py-0.5"
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'p') editor.chain().focus().setParagraph().run();
              if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
              if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
              if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
              if (val === 'quote') editor.chain().focus().toggleBlockquote().run();
              if (val === 'code') editor.chain().focus().toggleCodeBlock().run();
            }}
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' :
              editor.isActive('blockquote') ? 'quote' :
              editor.isActive('codeBlock') ? 'code' : 'p'
            }
          >
            <option value="p">Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="quote">Quote</option>
            <option value="code">Code</option>
          </select>

          <span className="text-[11px] font-medium text-(--text-dim) px-2 border-r border-(--border-subtle) mr-1">
            Color
          </span>
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => editor.chain().focus().setColor(c.color).run()}
              className="w-5 h-5 rounded-full border border-black/10 shadow-sm hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-[12px] px-2 py-0.5 ml-1 rounded hover:bg-(--surface-hover) text-(--text) font-medium transition-colors cursor-pointer"
            title="Remove color"
          >
            Reset
          </button>
        </div>
      </BubbleMenu>
      
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
