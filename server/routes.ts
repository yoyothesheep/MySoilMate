import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertPlantSchema, plantFilterSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads (memory storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Plant routes
  app.get("/api/plants", async (req: Request, res: Response) => {
    try {
      const filter = plantFilterSchema.parse({
        search: req.query.search as string,
        lightLevels: req.query.lightLevels ? (req.query.lightLevels as string).split(',') : undefined,
        waterNeeds: req.query.waterNeeds ? (req.query.waterNeeds as string).split(',') : undefined,
        growZones: req.query.growZones ? (req.query.growZones as string).split(',') : undefined,
        bloomSeasons: req.query.bloomSeasons ? (req.query.bloomSeasons as string).split(',') : undefined,
        heights: req.query.heights ? (req.query.heights as string).split(',') : undefined,
        sort: req.query.sort as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });
      
      const result = await storage.getPlants(filter);
      res.json(result);
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

  // Image upload route for plants
  app.post("/api/plants/:id/image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Convert buffer to base64
      const imageData = file.buffer.toString('base64');
      const imageMimeType = file.mimetype;

      // Update plant with image data
      const updatedPlant = await storage.updatePlant(id, {
        imageData,
        imageMimeType,
        imageUrl: null // Clear the URL since we're storing the image
      });

      if (!updatedPlant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      res.json({ message: "Image uploaded successfully", plant: updatedPlant });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Route to serve stored images
  app.get("/api/plants/:id/image", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.getPlant(id);
      
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      if (!plant.imageData || !plant.imageMimeType) {
        return res.status(404).json({ message: "No image found for this plant" });
      }

      // Convert base64 back to buffer and send
      const imageBuffer = Buffer.from(plant.imageData, 'base64');
      res.setHeader('Content-Type', plant.imageMimeType);
      res.setHeader('Content-Length', imageBuffer.length);
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
