import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlantSchema, plantFilterSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Plant routes
  app.get("/api/plants", async (req: Request, res: Response) => {
    try {
      const filter = plantFilterSchema.parse({
        search: req.query.search as string,
        lightLevels: req.query.lightLevels ? (req.query.lightLevels as string).split(',') : undefined,
        waterNeeds: req.query.waterNeeds ? (req.query.waterNeeds as string).split(',') : undefined,
        difficultyLevels: req.query.difficultyLevels ? (req.query.difficultyLevels as string).split(',') : undefined,
        sort: req.query.sort as string,
      });
      
      const plants = await storage.getPlants(filter);
      res.json(plants);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid query parameters", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to fetch plants" });
      }
    }
  });

  app.get("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.getPlant(id);
      
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plant" });
    }
  });

  app.post("/api/plants", async (req: Request, res: Response) => {
    try {
      const plantData = insertPlantSchema.parse(req.body);
      const newPlant = await storage.createPlant(plantData);
      res.status(201).json(newPlant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid plant data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create plant" });
      }
    }
  });

  app.put("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const plantData = insertPlantSchema.partial().parse(req.body);
      const updatedPlant = await storage.updatePlant(id, plantData);
      
      if (!updatedPlant) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.json(updatedPlant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid plant data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update plant" });
      }
    }
  });

  app.delete("/api/plants/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlant(id);
      
      if (!success) {
        return res.status(404).json({ message: "Plant not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete plant" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
