import { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { BookOpen, BrainCircuit, ChevronRight, FileText, Hash, Layers, Sparkles, X } from 'lucide-react';

/**
 * KnowledgeView — "this is NOT another notes editor".
 *
 * Everything shown here is derived from the user's *real* structured content
 * (processedNotes markdown) and the lecture's real record: a concept tree
 * built from the markdown heading hierarchy, section stats, source references
 * and related lectures. No fake data, no fabricated endpoints.
 */

const HEADING_RE = /^(#{1,4})\s+(.+?)\s*$/;

const parseConceptTree = (markdown = '') => {
  const lines = String(markdown || '').split('\n');
  const roots = [];
  const stack = [];
  let current = null;

  const pushCurrent = () => {
    if (current) stack.push(current);
  };

  for (const line of lines) {
    const m = line.match(HEADING_RE);
    if (m) {
      const level = m[1].length;
      const title = m[2].replace(/[*_`]/g, '').trim();
      const node = { title, level, children: [], bullets: [] };
      if (level === 1) {
        pushCurrent();
        stack.length = 0;
        roots.push(node);
        current = node;
      } else {
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        const parent = stack[stack.length - 1] || roots[roots.length - 1] || current;
        if (parent) parent.children.push(node);
        else roots.push(node);
        stack.push(node);
        current = node;
      }
    } else {
      const trimmed = line.trim();
      if (trimmed && /^[-*•]/.test(trimmed) && current) {
        current.bullets.push(trimmed.replace(/^[-*•]\s*/, '').replace(/[*_`]/g, ''));
      }
    }
  }

  return roots;
};

const countConcepts = (roots) => {
  let count = 0;
  const walk = (nodes) => {
    for (const n of nodes) {
      count += 1;
      walk(n.children);
    }
  };
  walk(roots);
  return count;
};

const flattenSections = (tree, limit = 20) => {
  const out = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      if (out.length >= limit) return;
      out.push(n.title);
      walk(n.children);
    }
  };
  walk(tree);
  return out;
};

const FlowNode = ({ node, depth = 0, selectedTitle, onSelect }) => {
  const selected = selectedTitle === node.title;
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={`group rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
          selected
            ? 'border-(--accent-ring) bg-(--accent-soft) text-(--accent-text)'
            : 'border-(--border) bg-(--surface) text-(--text-dim) hover:text-(--text) hover:border-(--border-strong)'
        }`}
      >
        {node.title}
      </button>
      {node.children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-(--border-strong)" />
          {node.children.map((c, i) => (
            <div key={`${c.title}-${i}`} className="flex flex-col items-center">
              {i > 0 && <div className="w-px h-2 bg-(--border-strong)" />}
              <FlowNode node={c} depth={depth + 1} selectedTitle={selectedTitle} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ConceptMap = ({ tree, selectedNode, onSelect, onClear, sourceLabel }) => {
  const [scale, setScale] = useState(1);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] text-(--text-faint)">Pan by scrolling · zoom with the controls</p>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))} className="pill-tab" aria-label="Zoom out">−</button>
          <span className="text-[11px] w-9 text-center text-(--text-dim) tabular-nums">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((s) => Math.min(1.8, +(s + 0.2).toFixed(2)))} className="pill-tab" aria-label="Zoom in">+</button>
          <button type="button" onClick={() => setScale(1)} className="pill-tab" aria-label="Reset zoom">Reset</button>
        </div>
      </div>

      <div className="max-h-[56vh] overflow-auto rounded-2xl border border-(--border-subtle) bg-(--bg-subtle)/50 p-6">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'fit-content', minWidth: '100%' }}>
          {tree.map((root, i) => (
            <div key={`${root.title}-${i}`} className="flex flex-col items-center">
              {i > 0 && <div className="w-px h-6 bg-(--border-strong)" />}
              <FlowNode node={root} selectedTitle={selectedNode?.title} onSelect={onSelect} />
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="mt-3 rounded-xl border border-(--border-subtle) bg-(--surface) p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-(--text)">{selectedNode.title}</p>
            <button type="button" onClick={onClear} className="btn-ghost p-1 rounded text-(--text-faint)" aria-label="Clear selection">
              <X size={14} />
            </button>
          </div>
          {selectedNode.bullets.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {selectedNode.bullets.slice(0, 6).map((b, i) => (
                <li key={i} className="text-[12.5px] text-(--text-dim) flex gap-1.5">
                  <span className="text-(--text-faint) select-none">–</span>
                  <span className="min-w-0 break-words">{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12.5px] text-(--text-faint)">No notes captured under this concept yet.</p>
          )}
          {sourceLabel && <p className="mt-2.5 pt-2 border-t border-(--border-subtle) text-[11px] text-(--text-faint)">{sourceLabel}</p>}
        </div>
      )}
    </div>
  );
};

const ConceptNode = ({ node, depth = 1 }) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(true);

  if (depth < 1) return null;
  const hasChildren = node.children.length > 0;

  return (
    <div className="min-w-0" style={{ paddingLeft: depth > 1 ? 14 : 0 }}>
      <div className="flex items-start gap-1.5">
        <span
          onClick={() => hasChildren && setOpen((o) => !o)}
          className={`shrink-0 mt-[5px] ${hasChildren ? 'cursor-pointer' : ''} ${
            node.level <= 2 ? 'text-(--accent-text)' : 'text-(--text-faint)'
          }`}
          aria-hidden="true"
        >
          {hasChildren ? (
            <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          ) : (
            <span className="inline-block w-[13px] text-center text-[10px]">•</span>
          )}
        </span>
        <div className="min-w-0">
          <p
            className={`text-[13.5px] leading-snug ${
              node.level <= 2 ? 'font-semibold text-(--text)' : 'font-medium text-(--text-dim)'
            }`}
          >
            {node.title}
          </p>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduced ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                {node.bullets.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {node.bullets.map((b, i) => (
                      <li key={i} className="text-[12.5px] leading-relaxed text-(--text-dim) flex gap-1.5">
                        <span className="text-(--text-faint) select-none">–</span>
                        <span className="min-w-0 break-words">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {node.children.map((child) => (
                  <div key={child.title} className="mt-1">
                    <ConceptNode node={child} depth={depth + 1} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const KnowledgeView = ({ lecture, subject, relatedLectures = [], onOpenLecture }) => {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState('');
  const [view, setView] = useState('outline'); // outline | map
  const [selectedNode, setSelectedNode] = useState(null);

  const content = lecture?.processedNotes || lecture?.rawNotes || '';
  const tree = useMemo(() => parseConceptTree(content), [content]);
  const conceptCount = useMemo(() => countConcepts(tree), [tree]);
  const sections = useMemo(() => flattenSections(tree), [tree]);

  const keyword = filter.trim().toLowerCase();
  const visibleTree = keyword
    ? tree.filter(
        (n) =>
          n.title.toLowerCase().includes(keyword) ||
          JSON.stringify(n.children).toLowerCase().includes(keyword)
      )
    : tree;

  const isEmpty = !content.trim();

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-12 h-12 rounded-xl bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center mb-4">
          <BrainCircuit size={20} className="text-(--text-faint)" strokeWidth={1.75} />
        </div>
        <h3 className="text-[15px] font-semibold text-(--text) mb-1.5">No knowledge mapped yet</h3>
        <p className="text-[13px] text-(--text-dim) max-w-sm leading-relaxed">
          Structure this lecture with AI and its concepts, sections and relationships will appear
          here automatically — drawn straight from your notes.
        </p>
      </div>
    );
  }

  const stats = [
    { icon: Hash, label: 'Concepts', value: conceptCount },
    { icon: Layers, label: 'Sections', value: tree.length },
    {
      icon: FileText,
      label: 'Words',
      value: lecture?.wordCount?.toLocaleString() || content.split(/\s+/).length.toLocaleString(),
    },
    { icon: Sparkles, label: 'Status', value: lecture?.processedNotes?.trim() ? 'Structured' : 'Raw' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-(--bg)">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-7">
        {/* Heading */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrainCircuit size={15} className="text-(--accent-text)" />
            <h2 className="text-[15px] font-semibold text-(--text) tracking-tight">Knowledge map</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="pill-tabs">
              <button type="button" onClick={() => setView('outline')} className={`pill-tab ${view === 'outline' ? 'active' : ''}`}>
                Outline
              </button>
              <button type="button" onClick={() => setView('map')} className={`pill-tab ${view === 'map' ? 'active' : ''}`}>
                Map
              </button>
            </div>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter concepts…"
              className="input w-40 h-8 text-[12px] rounded-lg"
              aria-label="Filter concepts"
            />
          </div>
        </div>
        <p className="mt-1 text-[12px] text-(--text-dim)">
          Concepts and relationships extracted from your structured notes.
        </p>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-(--border-subtle) bg-(--surface) px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-(--text-faint) uppercase tracking-wide">
                <Icon size={11} /> {label}
              </div>
              <p className="mt-1 text-[16px] font-semibold text-(--text)">{value}</p>
            </div>
          ))}
        </div>

        {/* Concept outline / map */}
        {visibleTree.length > 0 ? (
          view === 'map' ? (
            <div className="mt-6">
              <ConceptMap
                tree={visibleTree}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
                onClear={() => setSelectedNode(null)}
                sourceLabel={
                  subject?.name && lecture
                    ? `${subject.name} · ${lecture.title?.trim() || `Lecture ${lecture.lectureNumber}`}`
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-(--border-subtle) bg-(--surface) p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-faint) mb-3">
                Concept outline
              </p>
              <div className="flex flex-col gap-2.5">
                {visibleTree.map((root, i) => (
                  <motion.div
                    key={root.title + i}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <div className="rounded-xl border border-(--border-subtle) bg-(--bg) px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-(--accent-soft) text-(--accent-text) flex items-center justify-center text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <p className="text-[14px] font-semibold text-(--text)">{root.title}</p>
                      </div>
                      {root.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {root.bullets.slice(0, 4).map((b, j) => (
                            <li key={j} className="text-[12.5px] text-(--text-dim) flex gap-1.5">
                              <span className="text-(--text-faint) select-none">–</span>
                              <span className="min-w-0 break-words">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {root.children.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {root.children.map((child) => (
                            <ConceptNode key={child.title} node={child} depth={1} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-(--border-subtle) p-8 text-center">
            <p className="text-[13px] text-(--text-dim)">
              {filter ? `No concepts match “${filter}”.` : 'No headings found in this document yet.'}
            </p>
          </div>
        )}

        {/* Sources & related */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-faint) flex items-center gap-1.5 mb-2.5">
              <BookOpen size={11} /> Sources
            </p>
            <ul className="space-y-1.5">
              <li className="text-[12.5px] text-(--text-dim) flex gap-2">
                <span className="text-(--accent-text) shrink-0">↳</span>
                <span className="min-w-0">
                  {subject?.name || 'Subject'} · {lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`}
                </span>
              </li>
              {sections.slice(0, 6).map((s) => (
                <li key={s} className="text-[12.5px] text-(--text-dim) flex gap-2">
                  <span className="text-(--text-faint) shrink-0">·</span>
                  <span className="min-w-0 truncate">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-faint) flex items-center gap-1.5 mb-2.5">
              <Layers size={11} /> Related lectures
            </p>
            {relatedLectures.length > 0 ? (
              <ul className="space-y-1">
                {relatedLectures.map((l) => (
                  <li key={l._id || l.id}>
                    <button
                      type="button"
                      onClick={() => onOpenLecture && onOpenLecture(l._id || l.id)}
                      className="group w-full flex items-center gap-2 text-[12.5px] text-left text-(--text-dim) hover:text-(--accent-text) transition-colors"
                    >
                      <FileText size={11} className="shrink-0 text-(--text-faint) group-hover:text-(--accent-text)" />
                      <span className="min-w-0 truncate">{l.title?.trim() || `Lecture ${l.lectureNumber}`}</span>
                      <span className="ml-auto shrink-0 text-[10.5px] text-(--text-faint)">
                        {l.processedNotes?.trim() ? 'structured' : 'raw'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12.5px] text-(--text-faint)">No other lectures in this subject.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeView;