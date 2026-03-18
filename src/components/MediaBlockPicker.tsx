import { useState, useRef, useEffect } from 'react';
import { Image, Video, Volume2, Code2, File, X, Link, ChevronRight, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ─── Types ──────────────────────────────────────── */
export type MediaType = 'text' | 'image' | 'video' | 'audio' | 'code' | 'file' | 'embed';

export interface MediaBlock {
  type: MediaType;
  url?: string;       // the embed / src URL
  content?: string;   // text content or caption
}

interface BlockDef {
  type: MediaType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  hint: string;       // placeholder for the URL input
  accepts: string;    // e.g. "YouTube, Vimeo…"
}

const BLOCKS: BlockDef[] = [
  { type: 'image', label: 'Image', icon: Image, description: 'Embed an image by URL', hint: 'https://example.com/image.png', accepts: 'PNG, JPG, GIF, WebP, SVG' },
  { type: 'video', label: 'Video', icon: Video, description: 'Embed a video by URL', hint: 'https://youtube.com/watch?v=…', accepts: 'YouTube, Vimeo, direct .mp4' },
  { type: 'audio', label: 'Audio', icon: Volume2, description: 'Embed audio by URL', hint: 'https://soundcloud.com/…', accepts: 'SoundCloud, Spotify, .mp3' },
  { type: 'code', label: 'Code', icon: Code2, description: 'Add a code snippet', hint: 'Paste your code here…', accepts: 'Any language' },
  { type: 'file', label: 'File', icon: File, description: 'Link to a downloadable file', hint: 'https://example.com/doc.pdf', accepts: 'PDF, DOCX, ZIP…' },
  { type: 'embed', label: 'Embed', icon: Link, description: 'Embed any iframe-able URL', hint: 'https://…', accepts: 'Google Docs, Figma, Loom…' },
];

/* ─── Helper: normalise video URLs to embed form ── */
function normaliseVideoUrl(url: string): string {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return url;
}

/* ─── Render a saved MediaBlock (student / teacher preview) ─ */
export function MediaBlockPreview({ block }: { block: MediaBlock }) {
  if (!block.url && block.type !== 'code') return null;

  switch (block.type) {
    case 'image':
      return (
        <div className="rounded-xl overflow-hidden border border-border bg-muted/30 my-2">
          <img src={block.url} alt={block.content || 'Embedded image'} className="w-full object-contain max-h-96" loading="lazy" />
          {block.content && <p className="text-xs text-muted-foreground text-center py-2 px-3 italic">{block.content}</p>}
        </div>
      );

    case 'video': {
      const embedUrl = normaliseVideoUrl(block.url!);
      const isNative = block.url!.match(/\.(mp4|webm|ogg)$/i);
      return (
        <div className="rounded-xl overflow-hidden border border-border bg-black my-2 aspect-video">
          {isNative
            ? <video src={block.url} controls className="w-full h-full" />
            : <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={block.content || 'Video'} />
          }
        </div>
      );
    }

    case 'audio': {
      const isSoundcloud = block.url!.includes('soundcloud');
      const isSpotify = block.url!.includes('spotify');
      if (isSoundcloud) {
        const scEmbed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(block.url!)}&color=%23ff5500&auto_play=false`;
        return <iframe src={scEmbed} className="w-full h-20 rounded-xl border border-border my-2" scrolling="no" title="SoundCloud player" />;
      }
      if (isSpotify) {
        const spotifyEmbed = block.url!.replace('open.spotify.com', 'open.spotify.com/embed');
        return <iframe src={spotifyEmbed} className="w-full h-20 rounded-xl border border-border my-2" allow="encrypted-media" title="Spotify player" />;
      }
      return (
        <div className="rounded-xl border border-border bg-muted/30 p-4 my-2">
          <audio src={block.url} controls className="w-full" />
          {block.content && <p className="text-xs text-muted-foreground mt-1 italic">{block.content}</p>}
        </div>
      );
    }

    case 'code':
      return (
        <pre className="bg-muted/80 border border-border rounded-xl p-4 text-sm font-mono overflow-x-auto my-2 text-foreground whitespace-pre-wrap">
          <code>{block.content || block.url}</code>
        </pre>
      );

    case 'file':
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 my-2 hover:bg-muted/60 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <File className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{block.content || block.url}</p>
            <p className="text-xs text-muted-foreground truncate">{block.url}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      );

    case 'embed':
      return (
        <iframe
          src={block.url}
          className="w-full h-80 rounded-xl border border-border my-2"
          title={block.content || 'Embedded content'}
          allow="fullscreen"
        />
      );

    default:
      return null;
  }
}

/* ─── Main picker component ──────────────────────── */
interface Props {
  onSelect: (block: MediaBlock) => void;
  onClose: () => void;
}

export default function MediaBlockPicker({ onSelect, onClose }: Props) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<BlockDef | null>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = BLOCKS.filter(b =>
    b.label.toLowerCase().includes(filter.toLowerCase()) ||
    b.accepts.toLowerCase().includes(filter.toLowerCase())
  );

  const handleInsert = () => {
    if (!selected) return;
    onSelect({ type: selected.type, url: url.trim() || undefined, content: caption.trim() || undefined });
  };

  /* ── Block list view ── */
  if (!selected) {
    return (
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-elevated w-72 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Type to filter…"
            className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            aria-label="Filter media types"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="py-1.5">
          <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Media</p>
          {filtered.map(block => (
            <button
              key={block.type}
              onClick={() => setSelected(block)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors" aria-hidden="true">
                <block.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{block.label}</p>
                <p className="text-xs text-muted-foreground truncate">{block.accepts}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">No media types match "{filter}"</p>
          )}
        </div>

        <div className="border-t border-border px-3 py-2">
          <button onClick={onClose} className="text-xs text-muted-foreground w-full text-left flex items-center justify-between">
            Close menu <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">Esc</kbd>
          </button>
        </div>
      </div>
    );
  }

  /* ── URL / content entry view ── */
  const isCode = selected.type === 'code';
  return (
    <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-elevated w-80 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <selected.icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{selected.label}</p>
          <p className="text-xs text-muted-foreground">{selected.description}</p>
        </div>
        <button onClick={() => setSelected(null)} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Go back">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* URL / code input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {isCode ? 'Code' : selected.type === 'file' ? 'File URL' : 'Embed URL'}
          </label>
          {isCode ? (
            <textarea
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={selected.hint}
              rows={4}
              className="w-full font-mono text-xs bg-muted/50 border border-border rounded-lg p-2 outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground resize-none"
            />
          ) : (
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={selected.hint}
              className="w-full text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground"
              type="url"
            />
          )}
          <p className="text-[11px] text-muted-foreground mt-1">{selected.accepts}</p>
        </div>

        {/* Caption */}
        {!isCode && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Caption (optional)</label>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption…"
              className="w-full text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Live preview toggle */}
        {url.trim() && (
          <button
            onClick={() => setPreview(!preview)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {preview ? '▲ Hide preview' : '▼ Show preview'}
          </button>
        )}

        {preview && url.trim() && (
          <div className="rounded-lg border border-border overflow-hidden">
            <MediaBlockPreview block={{ type: selected.type, url, content: caption }} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            disabled={!url.trim() && !isCode}
            onClick={handleInsert}
            className="flex-1 gradient-teacher text-primary-foreground border-0 text-sm h-9"
          >
            Embed {selected.label}
          </Button>
          <Button variant="outline" onClick={() => setSelected(null)} className="h-9 text-sm">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
