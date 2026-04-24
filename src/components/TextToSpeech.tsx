import { useState, useRef, useCallback } from 'react';
import { Volume2, Square, Loader2, RotateCcw, Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

interface TextToSpeechProps {
  text: string;
  label?: string;
}

type TtsStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

/** Module-level cache: text → blob URL (persists across re-renders) */
const audioCache: Record<string, string> = {};

const polly = new PollyClient({
  region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
  },
});

async function synthesize(text: string): Promise<string> {
  const command = new SynthesizeSpeechCommand({
    Text: text.slice(0, 3000),
    OutputFormat: 'mp3',
    VoiceId: 'Joanna',       // Natural US-English voice; change to 'Aditi' for Indian English
    TextType: 'text',
    Engine: 'neural',
  });

  const response = await polly.send(command);
  if (!response.AudioStream) throw new Error('No audio stream returned');

  // AudioStream in browser SDK is a ReadableStream<Uint8Array>
  const reader = (response.AudioStream as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const blob = new Blob(chunks, { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

export default function TextToSpeech({ text, label = 'Read aloud' }: TextToSpeechProps) {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cacheKey = text.slice(0, 200);

  const applySpeed = (rate: number) => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const cycleSpeed = () => {
    const next = SPEED_OPTIONS[(SPEED_OPTIONS.indexOf(speed) + 1) % SPEED_OPTIONS.length];
    setSpeed(next);
    applySpeed(next);
  };

  const play = useCallback(async () => {
    if (!text?.trim()) return;

    if (status === 'paused' && audioRef.current) {
      await audioRef.current.play();
      setStatus('playing');
      return;
    }

    if (status === 'ended' && audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setStatus('playing');
      return;
    }

    if (status === 'playing') return;

    setStatus('loading');
    try {
      let blobUrl = audioCache[cacheKey];
      if (!blobUrl) {
        blobUrl = await synthesize(text);
        audioCache[cacheKey] = blobUrl;
      }

      const audio = new Audio(blobUrl);
      audio.playbackRate = speed;
      audio.onended = () => setStatus('ended');
      audio.onerror = () => {
        delete audioCache[cacheKey];
        setStatus('idle');
      };
      audioRef.current = audio;
      await audio.play();
      setStatus('playing');
    } catch (err) {
      console.error('Polly TTS error:', err);
      setStatus('idle');
    }
  }, [status, text, cacheKey, speed]);

  const pause = () => {
    audioRef.current?.pause();
    setStatus('paused');
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus('paused');
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setStatus('idle');
  };

  const isActive = status !== 'idle';

  // ─── Idle ─────────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="flex items-center gap-2 mt-2" aria-label="Text to speech controls">
        <Button
          size="sm"
          variant="outline"
          onClick={play}
          className="gap-2 text-muted-foreground hover:text-foreground border-dashed"
          aria-label={label}
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Listen</span>
        </Button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-primary font-medium">Generating audio…</span>
        </div>
      </div>
    );
  }

  // ─── Active (playing / paused / ended) ────────────────────────────────────
  return (
    <div
      className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-secondary/8 border border-secondary/20 flex-wrap"
      aria-label="Text to speech controls"
    >
      {/* Animated equaliser while playing */}
      {status === 'playing' && (
        <div className="flex items-end gap-0.5 h-4 px-1" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-0.5 bg-secondary rounded-full animate-bounce"
              style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}

      {/* Play / Pause / Replay */}
      {status === 'playing' ? (
        <Button size="sm" variant="ghost" onClick={pause}
          className="gap-1.5 text-secondary hover:text-secondary hover:bg-secondary/10 h-8 px-3"
          aria-label="Pause" title="Pause">
          <Pause className="w-4 h-4" />
          <span className="text-xs font-medium">Pause</span>
        </Button>
      ) : status === 'ended' ? (
        <Button size="sm" variant="ghost" onClick={play}
          className="gap-1.5 text-primary hover:bg-primary/10 h-8 px-3"
          aria-label="Replay" title="Replay from beginning">
          <RefreshCw className="w-4 h-4" />
          <span className="text-xs font-medium">Replay</span>
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={play}
          className="gap-1.5 text-secondary hover:text-secondary hover:bg-secondary/10 h-8 px-3"
          aria-label="Resume" title="Resume from where you paused">
          <Play className="w-4 h-4 fill-current" />
          <span className="text-xs font-medium">Resume</span>
        </Button>
      )}

      <span className="w-px h-5 bg-border" aria-hidden="true" />

      {/* Restart */}
      <Button size="sm" variant="ghost" onClick={restart}
        className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5"
        aria-label="Restart from beginning" title="Restart from beginning">
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="text-xs">Restart</span>
      </Button>

      {/* Speed */}
      <Button size="sm" variant="ghost" onClick={cycleSpeed}
        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 font-mono tabular-nums"
        aria-label={`Speed: ${speed}x`} title="Change speed">
        {speed}×
      </Button>

      {/* Stop */}
      <Button size="sm" variant="ghost" onClick={stop}
        className="text-muted-foreground hover:text-destructive h-8 px-2 ml-auto"
        aria-label="Stop" title="Stop playback">
        <Square className="w-3 h-3 fill-current" />
      </Button>
    </div>
  );
}
