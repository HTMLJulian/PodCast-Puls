import { useQuery, useMutation } from "@tanstack/react-query";
import { Podcast } from "@shared/schema";
import { PodcastCard } from "@/components/podcast-card";
import { PodcastPlayer } from "@/components/podcast-player";
import { PodcastUpload } from "@/components/podcast-upload";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LogOut, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function HomePage() {
  const { logoutMutation, user } = useAuth();
  const { toast } = useToast();
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const { data: podcasts, isLoading: isLoadingPodcasts } = useQuery<Podcast[]>({
    queryKey: ["/api/podcasts"],
  });

  const { data: favorites, isLoading: isLoadingFavorites } = useQuery<Podcast[]>({
    queryKey: ["/api/favorites"],
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (podcastId: number) => {
      await apiRequest("POST", `/api/favorites/${podcastId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (podcastId: number) => {
      await apiRequest("DELETE", `/api/favorites/${podcastId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  const handleDownload = async (podcastId: number) => {
    const podcast = podcasts?.find(p => p.id === podcastId);
    if (!podcast) return;

    try {
      const response = await fetch(podcast.downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${podcast.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download gestartet",
        description: `${podcast.title} wird heruntergeladen`,
      });
    } catch (error) {
      toast({
        title: "Download fehlgeschlagen",
        description: "Bitte versuchen Sie es später erneut",
        variant: "destructive",
      });
    }
  };

  if (isLoadingPodcasts || isLoadingFavorites) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isFavorite = (podcast: Podcast) =>
    favorites?.some((fav) => fav.id === podcast.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Podcastify</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowUpload(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Podcast hochladen
            </Button>
            <span>Willkommen, {user?.username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts?.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              isFavorite={isFavorite(podcast)}
              onPlay={() => setSelectedPodcast(podcast)}
              onToggleFavorite={(id) =>
                isFavorite(podcast)
                  ? removeFavoriteMutation.mutate(id)
                  : addFavoriteMutation.mutate(id)
              }
              onDownload={() => handleDownload(podcast.id)}
            />
          ))}
        </div>
      </main>

      {selectedPodcast && (
        <PodcastPlayer
          podcast={selectedPodcast}
          onClose={() => setSelectedPodcast(null)}
        />
      )}

      <Sheet open={showUpload} onOpenChange={setShowUpload}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Neuen Podcast hochladen</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <PodcastUpload />
        </SheetContent>
      </Sheet>
    </div>
  );
}