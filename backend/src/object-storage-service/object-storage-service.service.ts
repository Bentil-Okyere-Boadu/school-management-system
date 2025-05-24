import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class ObjectStorageServiceService {
  private s3Client: S3Client;
  private bucket: string;
  private readonly allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucket = this.configService.get<string>('AWS_BUCKET_NAME');

    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('Missing AWS S3 configuration in environment variables');
    }

    this.bucket = bucket;
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // Validate file for profile image upload
  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }
  }

  // Generate unique file path for profile images
  private generateProfileImagePath(
    userId: string,
    originalName: string,
  ): string {
    const extension = path.extname(originalName);
    const uniqueId = uuidv4();
    return `profiles/${userId}/avatar-${uniqueId}${extension}`;
  }

  // Upload profile image with validation
  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ path: string; url: string }> {
    this.validateImageFile(file);

    const imagePath = this.generateProfileImagePath(userId, file.originalname);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: imagePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalName: file.originalname,
      },
      // Set cache control for better performance
      CacheControl: 'max-age=31536000', // 1 year
    });

    await this.s3Client.send(command);

    // Get the public URL or signed URL
    const url = await this.getSignedUrl(imagePath);

    return { path: imagePath, url };
  }

  // Generic file upload (your original method, enhanced)
  async uploadFile(
    file: Express.Multer.File,
    customPath?: string,
  ): Promise<string> {
    const filePath = customPath || `uploads/${uuidv4()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=3600', // 1 hour
    });

    await this.s3Client.send(command);
    return filePath;
  }

  // Get signed URL with configurable expiration
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  // Get public URL (if bucket is configured for public access)
  getPublicUrl(path: string): string {
    const region = this.configService.get<string>('AWS_REGION');
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${path}`;
  }

  // Delete file from S3
  async deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.s3Client.send(command);
  }

  // Delete old profile image when updating
  async deleteProfileImage(userId: string, imagePath: string): Promise<void> {
    try {
      // Verify the file belongs to the user (security check)
      if (imagePath.startsWith(`profiles/${userId}/`)) {
        await this.deleteFile(imagePath);
      } else {
        throw new BadRequestException('Unauthorized to delete this file');
      }
    } catch (error) {
      console.error('Error deleting profile image:', error);
      // Don't throw error for delete operations to avoid blocking updates
    }
  }

  // Check if file exists
  async fileExists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Enhanced connection test
  async testConnection(): Promise<boolean> {
    try {
      // Test by listing bucket contents (safer than trying to get a specific file)
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 Connection test failed:', error);
      return false;
    }
  }

  // Get file metadata
  async getFileMetadata(path: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}
