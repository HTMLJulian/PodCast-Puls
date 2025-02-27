import { User, InsertUser, Podcast, Favorite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from 'fs';
import path from 'path';

const MemoryStore = createMemoryStore(session);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllPodcasts(): Promise<Podcast[]>;
  getPodcast(id: number): Promise<Podcast | undefined>;
  getFavorites(userId: number): Promise<Podcast[]>;
  addFavorite(userId: number, podcastId: number): Promise<void>;
  removeFavorite(userId: number, podcastId: number): Promise<void>;
  markFavoriteAsDownloaded(userId: number, podcastId: number, localPath: string): Promise<void>;
  sessionStore: session.Store;
  createPodcast(podcast: Omit<Podcast, "id">): Promise<Podcast>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private podcasts: Map<number, Podcast>;
  private favorites: Map<number, Map<number, Favorite>>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.podcasts = new Map();
    this.favorites = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllPodcasts(): Promise<Podcast[]> {
    return Array.from(this.podcasts.values());
  }

  async getPodcast(id: number): Promise<Podcast | undefined> {
    return this.podcasts.get(id);
  }

  async getFavorites(userId: number): Promise<Podcast[]> {
    if (!this.favorites.has(userId)) {
      return [];
    }
    const userFavorites = this.favorites.get(userId)!;
    return Array.from(userFavorites.values())
      .map(fav => this.podcasts.get(fav.podcastId))
      .filter((podcast): podcast is Podcast => podcast !== undefined);
  }

  async addFavorite(userId: number, podcastId: number): Promise<void> {
    if (!this.favorites.has(userId)) {
      this.favorites.set(userId, new Map());
    }
    const userFavorites = this.favorites.get(userId)!;
    userFavorites.set(podcastId, {
      id: this.currentId++,
      userId,
      podcastId,
      isDownloaded: false,
      localPath: null
    });
  }

  async removeFavorite(userId: number, podcastId: number): Promise<void> {
    const userFavorites = this.favorites.get(userId);
    if (userFavorites) {
      userFavorites.delete(podcastId);
    }
  }

  async markFavoriteAsDownloaded(userId: number, podcastId: number, localPath: string): Promise<void> {
    const userFavorites = this.favorites.get(userId);
    if (userFavorites) {
      const favorite = userFavorites.get(podcastId);
      if (favorite) {
        userFavorites.set(podcastId, {
          ...favorite,
          isDownloaded: true,
          localPath
        });
      }
    }
  }

  async createPodcast(podcastData: Omit<Podcast, "id">): Promise<Podcast> {
    const id = this.currentId++;
    const podcast = { ...podcastData, id };
    this.podcasts.set(id, podcast);
    return podcast;
  }
}

export const storage = new MemStorage();