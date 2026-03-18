import { useState, useRef } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextToSpeechProps {
  text: string;
  label?: string;
}

const TTS_URL = 'https://open-ai-text-to-speech1.p.rapidapi.com/';
const TTS_KEY = '5778bf98b3mshfa4155bec124dbdp162247jsn250be6f18e66';

export default function TextToSpeech({ text, label = 'Read aloud' }: TextToSpeechProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setStatus('idle');
  };

  const speak = async () => {
    if (!text?.trim()) return;
    if (status === 'playing') { stop(); return; }

    setStatus('loading');
    try {
      const res = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'open-ai-text-to-speech1.p.rapidapi.com',
          'x-rapidapi-key': TTS_KEY,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text.slice(0, 4096),
          voice: 'alloy',
        }),
      });

      if (!res.ok) throw new Error('TTS request failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setStatus('idle');
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setStatus('idle');
      };

      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={speak}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
      aria-label={status === 'playing' ? 'Stop reading aloud' : label}
      title={status === 'playing' ? 'Stop' : label}
    >
      {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === 'playing' && <Square className="w-3.5 h-3.5 fill-current" />}
      {status === 'idle' && <Volume2 className="w-4 h-4" />}
      <span className="text-xs">{status === 'playing' ? 'Stop' : status === 'loading' ? 'Loading…' : 'Listen'}</span>
    </Button>
  );
}
