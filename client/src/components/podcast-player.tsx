import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Podcast } from "@shared/schema";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

interface PodcastPlayerProps {
  podcast: Podcast;
  onClose: () => void;
}

export function PodcastPlayer({ podcast, onClose }: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(podcast.audioUrl);
    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
        audioRef.current.removeEventListener("ended", () => setIsPlaying(false));
      }
    };
  }, [podcast.audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current && value.length > 0) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[300px]">
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-semibold text-lg">{podcast.title}</h3>
              <p className="text-sm text-muted-foreground">Now Playing</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={1}
              />
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
