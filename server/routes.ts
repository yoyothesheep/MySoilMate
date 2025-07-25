import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertPlantSchema, plantFilterSchema } from "@shared/schema";
import { objectStorage } from "./object-storage";
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

  // Image upload route for plants
  app.post("/api/plants/:id/image", upload.single('image'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload to object storage
      const uploadResult = await objectStorage.uploadImage(file.buffer, file.mimetype, id);

      // Update plant with object storage path and URL
      const updatedPlant = await storage.updatePlant(id, {
        imageStoragePath: uploadResult.key,
        imageMimeType: file.mimetype,
        imageUrl: uploadResult.url // Store the uploaded image URL
      });

      if (!updatedPlant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      res.json({ 
        message: "Image uploaded successfully", 
        plant: updatedPlant,
        imageUrl: uploadResult.url 
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Route to get signed URL for stored images
  app.get("/api/plants/:id/image", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const plant = await storage.getPlant(id);
      
      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      if (!plant.imageStoragePath) {
        return res.status(404).json({ message: "No image found for this plant" });
      }

      // Get signed URL from object storage
      const signedUrl = await objectStorage.getSignedUrl(plant.imageStoragePath);
      
      res.json({ imageUrl: signedUrl });
    } catch (error) {
      console.error("Failed to retrieve image URL:", error);
      res.status(500).json({ message: "Failed to retrieve image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
