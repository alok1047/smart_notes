import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertTriangle, Loader2, RefreshCw, Code } from 'lucide-react';

const initMermaid = () => {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      suppressErrorRendering: true,
      fontFamily: 'Inter, system-ui, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: false,
        curve: 'linear',
      },
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#003A3D',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#2083e2',
        lineColor: '#4EC5C5',
        secondaryColor: '#0C151D',
        tertiaryColor: '#1e293b',
        fontSize: '13px',
      },
    });
  } catch (e) {
    console.error('Mermaid init error:', e);
  }
};

initMermaid();

const removeMermaidErrorNodes = () => {
  setTimeout(() => {
    try {
      const errorNodes = document.querySelectorAll(
        'body > svg[id^="dmermaid"], body > div[id^="dmermaid"], body > #dmermaid'
      );
      errorNodes.forEach(el => el.remove());
    } catch (e) {
      console.error(e);
    }
  }, 50);
};

const cleanMermaidSyntax = (chart) => {
  if (!chart) return '';
  let clean = chart.trim();

  // Strip markdown fences
  clean = clean.replace(/^```mermaid\s*/i, '').replace(/```$/i, '').trim();

  // Convert legacy 'graph TD' / 'graph LR' to modern 'flowchart TD' / 'flowchart LR'
  clean = clean.replace(/^graph\s+TD/i, 'flowchart TD');
  clean = clean.replace(/^graph\s+LR/i, 'flowchart LR');
  clean = clean.replace(/^graph\s+TB/i, 'flowchart TB');
  clean = clean.replace(/^graph\s+BT/i, 'flowchart BT');

  // 1. Remove quotes inside pipe labels: -->|"Text"| -> -->|Text|
  clean = clean.replace(/-->\|"(.*?)"\|/g, '-->|$1|');
  clean = clean.replace(/---\|"(.*?)"\|/g, '---|$1|');

  // 2. Fix trailing > in pipe labels: -->|Text|> -> -->|Text|
  clean = clean.replace(/-->\|(.*?)\|\s*>/g, '-->|$1|');
  clean = clean.replace(/---\|(.*?)\|\s*>/g, '---|$1|');

  // 3. Fix single -> to -->
  clean = clean.replace(/([^\-\n])\->([^\-\n>])/g, '$1-->$2');

  // 4. Wrap unquoted node labels containing special chars (like parens, slashes, or colons) in quotes
  clean = clean.replace(/(\w+)\[([^\]"]*[\(\)\/\\&:][^\]"]*)\]/g, '$1["$2"]');

  // 5. Fix truncated/unclosed brackets (e.g. H --> I[Mobile -> H --> I[Mobile])
  clean = clean.split('\n').map(line => {
    let l = line.trimEnd();
    const openBrackets = (l.match(/\[/g) || []).length;
    const closeBrackets = (l.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      l += ']'.repeat(openBrackets - closeBrackets);
    }
    return l;
  }).join('\n');

  // 6. Ensure valid flowchart header
  if (!/^(graph|flowchart|sequenceDiagram|gantt|classDiagram|erDiagram|pie|mindmap|timeline)/i.test(clean)) {
    clean = `flowchart TD\n${clean}`;
  }

  return clean;
};

// Safe rendering wrapper that creates a temp container on document.body for Mermaid's getAttribute lookup
const safeMermaidRender = async (id, code) => {
  const containerId = `mermaid-container-${id}`;
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1000px'; // Give it some dimensions for Dagre
    container.style.height = '1000px';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);
  }

  try {
    initMermaid();
    // In Mermaid v10+, render(id, text, container) returns { svg }
    const result = await mermaid.render(id, code, container);
    return result;
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

const MermaidBlock = ({ chart }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const renderDiagram = async () => {
    if (!containerRef.current || !chart?.trim()) return;

    setLoading(true);
    setError(false);

    const sanitized = cleanMermaidSyntax(chart);
    const id = `mermaid-${Math.floor(Math.random() * 10000000)}`;

    try {
      const { svg } = await safeMermaidRender(id, sanitized);
      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        setError(false);
      }
    } catch (err) {
      console.warn('Primary mermaid render failed, trying simplified fallback:', err);
      // Stage 2 Fallback: Strip pipe labels (e.g. -->|Text| -> -->)
      const fallbackCode = sanitized.replace(/-->\|.*?\|/g, '-->');
      const fallbackId = `mermaid-fb-${Math.floor(Math.random() * 10000000)}`;

      try {
        const { svg } = await safeMermaidRender(fallbackId, fallbackCode);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(false);
        }
      } catch (err2) {
        console.error('Fallback mermaid render failed:', err2);
        setError(true);
      }
    } finally {
      setLoading(false);
      removeMermaidErrorNodes();
    }
  };

  useEffect(() => {
    renderDiagram();
  }, [chart]);

  return (
    <div className="my-5 rounded-2xl bg-(--surface) border border-(--border-subtle) overflow-hidden shadow-sm">
      {/* Header bar - only show when loading or error */}
      {(loading || error) && (
        <div className="flex items-center justify-end px-4 py-2.5 bg-(--bg-subtle) border-b border-(--border-subtle) text-[11.5px] font-mono text-(--text-faint)">
          <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-blue-400">
              <Loader2 size={12} className="animate-spin" />
              Rendering...
            </span>
          )}
          {error && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-1 hover:text-(--text) transition-colors cursor-pointer"
            >
              <Code size={12} />
              {showCode ? 'Hide Code' : 'View Code'}
            </button>
          )}
          {error && (
            <button
              onClick={renderDiagram}
              className="flex items-center gap-1 hover:text-(--text) transition-colors cursor-pointer"
              title="Re-render Diagram"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      </div>
      )}

      {/* SVG Container */}
      <div
        ref={containerRef}
        className={`p-6 flex items-center justify-center overflow-x-auto min-h-[140px] transition-opacity duration-300 ${
          loading ? 'opacity-40' : 'opacity-100'
        } ${error ? 'hidden' : 'block'}`}
      />

      {/* Error Fallback */}
      {error && (
        <div className="p-4 text-[12.5px] text-(--text-dim)">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <AlertTriangle size={15} className="shrink-0" />
            <span>Diagram render notice — unable to parse flowchart syntax.</span>
          </div>
          {showCode && (
            <pre className="p-3 rounded-xl bg-(--bg) text-[11px] font-mono text-(--text-dim) overflow-x-auto whitespace-pre-wrap border border-(--border-subtle)">
              {cleanMermaidSyntax(chart)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default MermaidBlock;
