import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type SoundType = 'none' | 'rain' | 'ocean' | 'forest' | 'white-noise' | 'brown-noise' | 'cafe';

const soundOptions = [
  { value: 'none', label: 'No Sound' },
  { value: 'rain', label: '🌧️ Rain' },
  { value: 'ocean', label: '🌊 Ocean Waves' },
  { value: 'forest', label: '🌲 Forest' },
  { value: 'white-noise', label: '📻 White Noise' },
  { value: 'brown-noise', label: '🎵 Brown Noise' },
  { value: 'cafe', label: '☕ Cafe Ambience' },
];

// Free ambient sound URLs from various sources
const soundUrls: Record<SoundType, string | null> = {
  'none': null,
  'rain': 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3',
  'ocean': 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3',
  'forest': 'https://assets.mixkit.co/active_storage/sfx/2398/2398-preview.mp3',
  'white-noise': 'https://assets.mixkit.co/active_storage/sfx/2413/2413-preview.mp3',
  'brown-noise': 'https://assets.mixkit.co/active_storage/sfx/2414/2414-preview.mp3',
  'cafe': 'https://assets.mixkit.co/active_storage/sfx/2408/2408-preview.mp3',
};

export const FocusSoundSelector = () => {
  const [selectedSound, setSelectedSound] = useState<SoundType>('none');
  const [volume, setVolume] = useState([50]);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  useEffect(() => {
    if (selectedSound === 'none' || !soundUrls[selectedSound]) {
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    // Create new audio instance
    const newAudio = new Audio(soundUrls[selectedSound]!);
    newAudio.loop = true;
    newAudio.volume = volume[0] / 100;

    setAudio(newAudio);

    // Auto-play if a sound is selected
    newAudio.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error('Audio play error:', error);
      setIsPlaying(false);
    });

    return () => {
      newAudio.pause();
      newAudio.src = '';
    };
  }, [selectedSound]);

  useEffect(() => {
    if (audio) {
      audio.volume = volume[0] / 100;
    }
  }, [volume, audio]);

  const togglePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Audio play error:', error);
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {isPlaying ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
          {isPlaying && (
            <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Focus Sounds</h4>
            <p className="text-sm text-muted-foreground">
              Play ambient sounds to help you focus
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sound</label>
            <Select value={selectedSound} onValueChange={(v) => setSelectedSound(v as SoundType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {soundOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSound !== 'none' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Volume</label>
                  <span className="text-sm text-muted-foreground">{volume[0]}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                variant={isPlaying ? 'default' : 'outline'}
                className="w-full"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Playing
                  </>
                ) : (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Paused
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
