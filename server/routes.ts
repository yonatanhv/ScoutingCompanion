import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since this is a fully client-side PWA that works offline,
  // we don't need any API routes. All data is stored in IndexedDB.
  
  const httpServer = createServer(app);
  
  return httpServer;
}
