import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export function PodcastUpload() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !imageFile || !title || !description) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("audio", audioFile);
      formData.append("image", imageFile);

      const response = await fetch("/api/podcasts/upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let the browser set it with the boundary
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      toast({
        title: "Erfolgreich",
        description: "Podcast wurde hochgeladen",
      });

      // Invalidate the podcasts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });

      // Reset form
      setTitle("");
      setDescription("");
      setAudioFile(null);
      setImageFile(null);
    } catch (error) {
      toast({
        title: "Fehler beim Hochladen",
        description: "Bitte versuchen Sie es später erneut",
        variant: "destructive",
      });
    }
    setIsUploading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Neuen Podcast hochladen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio">Audio-Datei (MP3)</Label>
            <Input
              id="audio"
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Titelbild</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? (
              "Wird hochgeladen..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Podcast hochladen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}