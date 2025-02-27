import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  audioUrl: text("audio_url").notNull(),
  downloadUrl: text("download_url").notNull(), // URL für den Download
  imageUrl: text("image_url").notNull(),
  duration: integer("duration").notNull(),
  isDownloadable: boolean("is_downloadable").notNull().default(true),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  podcastId: integer("podcast_id").notNull(),
  isDownloaded: boolean("is_downloaded").notNull().default(false),
  localPath: text("local_path"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPodcastSchema = createInsertSchema(podcasts);
export const insertFavoriteSchema = createInsertSchema(favorites);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Podcast = typeof podcasts.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;