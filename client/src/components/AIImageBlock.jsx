import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Download, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

const AIImageBlock = ({ prompt, initialUrl, alt }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(!initialUrl);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState('');

  const fetchImage = async () => {
    const cleanPrompt = prompt || alt || 'Educational diagram';
    setLoading(true);
    setError(false);

    try {
      const res = await api.post('/ai/generate-image', { prompt: cleanPrompt });
      if (res.data && res.data.url) {
        setImageUrl(res.data.url);
        setProvider(res.data.provider || 'ai');
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.warn('Backend AI image fetch failed, using fallback:', err);
      // Fallback URL
      const encoded = encodeURIComponent(cleanPrompt);
      setImageUrl(`https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=576&nologo=true&seed=${Math.floor(Math.random()*10000)}`);
    }
  };

  useEffect(() => {
    if (!initialUrl || initialUrl.startsWith('ai-image://')) {
      fetchImage();
    } else {
      setImageUrl(initialUrl);
      setLoading(false);
    }
  }, [prompt, initialUrl]);

  return (
    <div className="my-5 rounded-2xl bg-(--surface) border border-(--border-subtle) overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-(--bg-subtle) border-b border-(--border-subtle) text-[11.5px] font-mono text-(--text-faint)">
        <span className="flex items-center gap-2 font-semibold tracking-wider uppercase text-[11px] text-(--accent-text)">
          <ImageIcon size={13} />
          {loading ? 'Generating AI Image...' : 'AI Generated Visual'}
        </span>
        <div className="flex items-center gap-2">
          {!loading && imageUrl && (
            <>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 hover:text-(--text) transition-colors cursor-pointer"
                title="Expand View"
              >
                <Maximize2 size={12} />
                Zoom
              </button>
              <button
                onClick={fetchImage}
                className="flex items-center gap-1 hover:text-(--text) transition-colors cursor-pointer"
                title="Generate New Variation"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body Area */}
      <div className="relative min-h-[220px] flex items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin flex items-center justify-center" />
              <Sparkles size={16} className="absolute inset-0 m-auto text-teal-400 animate-pulse" />
            </div>
            <p className="text-[13px] font-medium text-(--text) mb-1">
              Rendering AI Image...
            </p>
            <p className="text-[11.5px] text-(--text-dim) max-w-sm truncate">
              "{prompt || alt || 'Educational visual'}"
            </p>
          </div>
        )}

        {imageUrl && !error && (
          <div className={`w-full flex-col items-center ${loading ? 'hidden' : 'flex'}`}>
            <img
              src={imageUrl}
              alt={alt || prompt || 'AI Generated Image'}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
              className="w-full max-w-3xl rounded-xl border border-(--border-subtle) object-cover shadow-md transition-all duration-300 hover:scale-[1.005]"
            />
            <p className="text-[11px] text-(--text-faint) text-center mt-2.5 italic">
              ✨ Prompt: {prompt || alt || 'Generated diagram'}
            </p>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-[12px] text-(--text-dim)">
            <p className="mb-2">⚠️ Unable to render image.</p>
            <button
              onClick={fetchImage}
              className="btn-secondary text-[11.5px] py-1 px-3"
            >
              Retry Generation
            </button>
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-(--surface) border border-(--border-subtle) p-2 flex flex-col">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X size={16} />
            </button>
            <img
              src={imageUrl}
              alt={alt || prompt}
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <div className="p-3 text-center text-[12px] text-(--text-dim)">
              {prompt || alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIImageBlock;
