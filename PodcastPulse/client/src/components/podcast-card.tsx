import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Download } from "lucide-react";
import { Podcast } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PodcastCardProps {
  podcast: Podcast;
  isFavorite: boolean;
  isDownloaded?: boolean;
  onPlay: () => void;
  onToggleFavorite: (id: number) => void;
  onDownload?: (id: number) => void;
}

export function PodcastCard({
  podcast,
  isFavorite,
  isDownloaded,
  onPlay,
  onToggleFavorite,
  onDownload,
}: PodcastCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={podcast.imageUrl}
          alt={podcast.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4"
          onClick={onPlay}
        >
          <Play className="h-6 w-6" />
        </Button>
      </div>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-1">{podcast.title}</CardTitle>
          <div className="flex gap-2">
            {podcast.isDownloadable && onDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(podcast.id)}
                className={cn(isDownloaded && "text-primary")}
              >
                <Download className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(podcast.id)}
            >
              <Heart
                className={cn("h-5 w-5", isFavorite && "fill-primary text-primary")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {podcast.description}
        </p>
      </CardContent>
    </Card>
  );
}