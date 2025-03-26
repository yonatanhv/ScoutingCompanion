import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { matchEntries, insertMatchEntrySchema, teamStatistics, insertTeamStatisticsSchema, cloudBackups } from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Since this is primarily a client-side PWA that works offline,
  // we need basic API routes for data syncing when online
  
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "OK", time: new Date().toISOString() });
  });
  
  // Match entries endpoints
  app.post("/api/matches", async (req, res) => {
    try {
      const parsed = insertMatchEntrySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error });
      }
      
      const [match] = await db.insert(matchEntries)
        .values({ ...parsed.data, syncStatus: "synced" })
        .returning();
      
      // Update team statistics
      await updateTeamStatistics(match.team);
      
      res.status(201).json(match);
    } catch (error) {
      console.error("Error creating match entry:", error);
      res.status(500).json({ error: "Failed to create match entry" });
    }
  });
  
  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      const [match] = await db.select()
        .from(matchEntries)
        .where(eq(matchEntries.id, id));
      
      if (!match) {
        return res.status(404).json({ error: "Match entry not found" });
      }
      
      res.json(match);
    } catch (error) {
      console.error("Error getting match entry:", error);
      res.status(500).json({ error: "Failed to get match entry" });
    }
  });
  
  app.get("/api/matches", async (req, res) => {
    try {
      const teamNumber = req.query.team as string | undefined;
      const matchType = req.query.matchType as string | undefined;
      const climbing = req.query.climbing as string | undefined;
      
      let query = db.select().from(matchEntries);
      
      // Build where conditions
      const conditions = [];
      
      if (teamNumber) {
        conditions.push(eq(matchEntries.team, teamNumber));
      }
      
      if (matchType) {
        conditions.push(eq(matchEntries.matchType, matchType));
      }
      
      if (climbing) {
        conditions.push(eq(matchEntries.climbing, climbing));
      }
      
      // Apply where conditions and add ordering
      let finalQuery = query;
      if (conditions.length > 0) {
        finalQuery = finalQuery.where(and(...conditions));
      }
      
      finalQuery = finalQuery.orderBy(desc(matchEntries.timestamp));
      
      const matches = await finalQuery.execute();
      res.json(matches);
    } catch (error) {
      console.error("Error getting match entries:", error);
      res.status(500).json({ error: "Failed to get match entries" });
    }
  });
  
  app.delete("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }
      
      // Get the match entry to find its team
      const [match] = await db.select()
        .from(matchEntries)
        .where(eq(matchEntries.id, id));
      
      if (!match) {
        return res.status(404).json({ error: "Match entry not found" });
      }
      
      // Delete the match entry
      await db.delete(matchEntries).where(eq(matchEntries.id, id));
      
      // Update team statistics
      await updateTeamStatistics(match.team);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting match entry:", error);
      res.status(500).json({ error: "Failed to delete match entry" });
    }
  });
  
  // Team statistics endpoints
  app.get("/api/teams/:teamNumber", async (req, res) => {
    try {
      const teamNumber = req.params.teamNumber;
      const [team] = await db.select()
        .from(teamStatistics)
        .where(eq(teamStatistics.teamNumber, teamNumber));
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error("Error getting team:", error);
      res.status(500).json({ error: "Failed to get team" });
    }
  });
  
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await db.select().from(teamStatistics);
      res.json(teams);
    } catch (error) {
      console.error("Error getting teams:", error);
      res.status(500).json({ error: "Failed to get teams" });
    }
  });
  
  // Sync endpoint - allows the client to push local IndexedDB data to the server
  app.post("/api/sync", async (req, res) => {
    try {
      const { matches } = req.body;
      
      if (!Array.isArray(matches)) {
        return res.status(400).json({ error: "Invalid sync data" });
      }
      
      const syncResults = {
        success: true,
        syncedMatches: 0,
        errors: [] as string[],
      };
      
      // Process each match entry
      for (const match of matches) {
        try {
          const { id, ...matchData } = match;
          
          const parsed = insertMatchEntrySchema.safeParse(matchData);
          if (!parsed.success) {
            syncResults.errors.push(`Invalid match data for ID ${id}: ${parsed.error}`);
            continue;
          }
          
          // Check if match already exists by combination of team, matchType, and matchNumber
          const [existingMatch] = await db.select()
            .from(matchEntries)
            .where(
              and(
                eq(matchEntries.team, matchData.team),
                eq(matchEntries.matchType, matchData.matchType),
                eq(matchEntries.matchNumber, matchData.matchNumber)
              )
            );
          
          if (existingMatch) {
            // Update existing match
            await db.update(matchEntries)
              .set({ ...parsed.data, syncStatus: "synced" })
              .where(eq(matchEntries.id, existingMatch.id));
          } else {
            // Insert new match
            await db.insert(matchEntries)
              .values({ ...parsed.data, syncStatus: "synced" });
          }
          
          syncResults.syncedMatches++;
        } catch (error) {
          console.error("Error syncing match:", error);
          syncResults.errors.push(`Error syncing match: ${error}`);
          syncResults.success = false;
        }
      }
      
      // Update all team statistics that were involved in the sync
      const uniqueTeams = new Set(matches.map(match => match.team));
      // Convert Set to Array to avoid iteration issues
      const uniqueTeamsArray = Array.from(uniqueTeams);
      for (const team of uniqueTeamsArray) {
        await updateTeamStatistics(team);
      }
      
      // After successful sync, notify all connected clients
      broadcastToAll({
        type: 'sync_completed',
        teams: Array.from(uniqueTeams),
        timestamp: Date.now()
      });
      
      res.json(syncResults);
    } catch (error) {
      console.error("Error syncing data:", error);
      res.status(500).json({ error: "Failed to sync data" });
    }
  });
  
  const httpServer = createServer(app);
  
  // Setup WebSocket server on the same HTTP server but different path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });
  
  // Track connected clients to broadcast updates
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      timestamp: Date.now(),
      message: 'Connected to FRC Scouting Server'
    }));
    
    // Handle messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'sync_request') {
          // Client is requesting a sync - could trigger server-to-client sync
          console.log('Client requested sync');
          ws.send(JSON.stringify({ 
            type: 'sync_acknowledged',
            timestamp: Date.now()
          }));
        } 
        else if (data.type === 'new_match') {
          // Broadcast new match data to all other clients
          console.log('New match data received, broadcasting to all clients');
          broadcastToOthers(ws, {
            type: 'new_match',
            matchData: data.matchData,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Function to broadcast a message to all clients except the sender
  function broadcastToOthers(sender: WebSocket, data: any) {
    clients.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Function to broadcast to all connected clients
  function broadcastToAll(data: any) {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Cloud backup endpoints
  app.post("/api/cloud/backup", async (req, res) => {
    try {
      const { username, backup } = req.body;
      
      if (!username || !backup) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Store the backup in the database with username and timestamp
      const [result] = await db.insert(cloudBackups)
        .values({
          username,
          data: backup,
          createdAt: new Date()
        })
        .returning();
      
      res.json({ 
        success: true, 
        backupId: result.id,
        message: "Backup created successfully" 
      });
    } catch (error) {
      console.error("Error creating cloud backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });
  
  app.get("/api/cloud/backups/:username", async (req, res) => {
    try {
      const username = req.params.username;
      
      // Get all backups for this user, ordered by creation date (newest first)
      const backups = await db.select({
        id: cloudBackups.id,
        createdAt: cloudBackups.createdAt,
        size: cloudBackups.size
      })
      .from(cloudBackups)
      .where(eq(cloudBackups.username, username))
      .orderBy(desc(cloudBackups.createdAt));
      
      res.json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });
  
  app.get("/api/cloud/backup/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid backup ID" });
      }
      
      // Get the specific backup
      const [backup] = await db.select()
        .from(cloudBackups)
        .where(eq(cloudBackups.id, id));
      
      if (!backup) {
        return res.status(404).json({ error: "Backup not found" });
      }
      
      res.json(backup);
    } catch (error) {
      console.error("Error fetching backup:", error);
      res.status(500).json({ error: "Failed to fetch backup" });
    }
  });
  
  app.delete("/api/cloud/backup/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid backup ID" });
      }
      
      // Delete the backup
      await db.delete(cloudBackups)
        .where(eq(cloudBackups.id, id));
      
      res.json({ success: true, message: "Backup deleted successfully" });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });
  
  // WebSocket notification is now integrated into the main sync endpoint above
  
  return httpServer;
}

// Helper function to update team statistics based on match entries
async function updateTeamStatistics(teamNumber: string): Promise<void> {
  try {
    // Get all match entries for the team
    const matches = await db.select()
      .from(matchEntries)
      .where(eq(matchEntries.team, teamNumber));
    
    const matchCount = matches.length;
    
    if (matchCount === 0) {
      // No matches for this team, delete team statistics if they exist
      await db.delete(teamStatistics).where(eq(teamStatistics.teamNumber, teamNumber));
      return;
    }
    
    // Calculate averages and counts
    const totals = {
      defense: 0,
      avoidingDefense: 0,
      scoringAlgae: 0,
      scoringCorals: 0,
      autonomous: 0,
      drivingSkill: 0,
      overall: 0,
    };
    
    const climbingCounts = {
      none: 0,
      low: 0,
      high: 0,
    };
    
    for (const match of matches) {
      totals.defense += match.defense;
      totals.avoidingDefense += match.avoidingDefense;
      totals.scoringAlgae += match.scoringAlgae;
      totals.scoringCorals += match.scoringCorals;
      totals.autonomous += match.autonomous;
      totals.drivingSkill += match.drivingSkill;
      totals.overall += match.overall;
      
      if (match.climbing === "none") climbingCounts.none++;
      else if (match.climbing === "low") climbingCounts.low++;
      else if (match.climbing === "high") climbingCounts.high++;
    }
    
    // Check if team statistics already exist
    const [existingTeam] = await db.select()
      .from(teamStatistics)
      .where(eq(teamStatistics.teamNumber, teamNumber));
    
    // Get team name from the first match (assuming it's consistent)
    const teamName = matches[0].team.split(" - ")[1] || teamNumber;
    
    const teamData = {
      teamNumber,
      teamName,
      matchCount,
      avgDefense: totals.defense / matchCount,
      avgAvoidingDefense: totals.avoidingDefense / matchCount,
      avgScoringAlgae: totals.scoringAlgae / matchCount,
      avgScoringCorals: totals.scoringCorals / matchCount,
      avgAutonomous: totals.autonomous / matchCount,
      avgDrivingSkill: totals.drivingSkill / matchCount,
      avgOverall: totals.overall / matchCount,
      climbingNone: climbingCounts.none,
      climbingLow: climbingCounts.low,
      climbingHigh: climbingCounts.high,
      lastUpdated: new Date(),
    };
    
    if (existingTeam) {
      // Update existing team statistics
      await db.update(teamStatistics)
        .set(teamData)
        .where(eq(teamStatistics.id, existingTeam.id));
    } else {
      // Insert new team statistics
      await db.insert(teamStatistics).values(teamData);
    }
  } catch (error) {
    console.error("Error updating team statistics:", error);
    throw new Error(`Failed to update team statistics: ${error}`);
  }
}
