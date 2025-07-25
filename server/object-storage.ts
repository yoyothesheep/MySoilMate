import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Object storage configuration
const BUCKET_NAME = "Plant_Images";
const REGION = process.env.AWS_REGION || "us-east-1";

// Initialize S3 client (works with AWS S3 and S3-compatible services)
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  endpoint: process.env.S3_ENDPOINT, // For S3-compatible services like MinIO, DigitalOcean Spaces
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // Required for some S3-compatible services
});

export interface UploadResult {
  key: string;
  url: string;
}

export class ObjectStorageService {
  /**
   * Upload an image to object storage
   */
  async uploadImage(buffer: Buffer, mimeType: string, plantId: number): Promise<UploadResult> {
    const fileExtension = this.getFileExtension(mimeType);
    const key = `Plant_Images/${plantId}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        plantId: plantId.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    try {
      await s3Client.send(command);
      const url = await this.getSignedUrl(key);
      return { key, url };
    } catch (error) {
      console.error("Failed to upload image to object storage:", error);
      throw new Error("Failed to upload image");
    }
  }

  /**
   * Get a signed URL for an image
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      throw new Error("Failed to generate image URL");
    }
  }

  /**
   * Delete an image from object storage
   */
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error("Failed to delete image from object storage:", error);
      throw new Error("Failed to delete image");
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
    };

    return extensions[mimeType] || ".jpg";
  }

  /**
   * Get the bucket name for external reference
   */
  getBucketName(): string {
    return BUCKET_NAME;
  }
}

export const objectStorage = new ObjectStorageService();