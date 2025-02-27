import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import express from 'express';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const uniqueId = nanoid();
      cb(null, `${uniqueId}-${file.originalname}`);
    },
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/podcasts", async (_req, res) => {
    const podcasts = await storage.getAllPodcasts();
    res.json(podcasts);
  });

  app.get("/api/podcasts/:id", async (req, res) => {
    const podcast = await storage.getPodcast(parseInt(req.params.id));
    if (!podcast) {
      return res.status(404).send("Podcast not found");
    }
    res.json(podcast);
  });

  app.post("/api/podcasts/upload", 
    upload.fields([
      { name: 'audio', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ]),
    async (req, res) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).send("Unauthorized");
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        if (!files || !files.audio?.[0] || !files.image?.[0]) {
          return res.status(400).send("Audio and image files are required");
        }

        const audioFile = files.audio[0];
        const imageFile = files.image[0];

        const podcast = await storage.createPodcast({
          title: req.body.title,
          description: req.body.description,
          audioUrl: `/uploads/${audioFile.filename}`,
          downloadUrl: `/uploads/${audioFile.filename}`,
          imageUrl: `/uploads/${imageFile.filename}`,
          duration: 0, // TODO: Calculate actual duration
          isDownloadable: true,
        });

        res.status(201).json(podcast);
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send("Error creating podcast");
      }
    }
  );

  app.get("/api/favorites", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    const favorites = await storage.getFavorites(req.user!.id);
    res.json(favorites);
  });

  app.post("/api/favorites/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    await storage.addFavorite(req.user!.id, parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    await storage.removeFavorite(req.user!.id, parseInt(req.params.id));
    res.sendStatus(200);
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  const httpServer = createServer(app);
  return httpServer;
}