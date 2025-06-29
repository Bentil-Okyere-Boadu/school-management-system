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
  private readonly allowedDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly maxDocumentSize = 10 * 1024 * 1024; // 10MB

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

  private validateDocumentFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedDocumentTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedDocumentTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxDocumentSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxDocumentSize / (1024 * 1024)}MB`,
      );
    }
  }

  private generateSchoolAssetPath(
    schoolId: string,
    assetType: string,
    fileName: string,
  ): string {
    const extension = path.extname(fileName);
    const uniqueId = uuidv4();
    return `schools/${schoolId}/assets/${assetType}/${uniqueId}${extension}`;
  }

  // Upload a general admission document (e.g., birth cert, result, etc.)
  async uploadAdmissionDocument(
    file: Express.Multer.File,
    schoolId: string,
    studentIdentifier: string, // could be email or generated id
    docType: string, // e.g., 'birth-cert', 'prev-result'
  ): Promise<{ path: string; url: string }> {
    this.validateDocumentFile(file);

    const documentPath = `schools/${schoolId}/admissions/${studentIdentifier}/${docType}-${uuidv4()}${path.extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: documentPath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        schoolId,
        studentIdentifier,
        docType,
        uploadedAt: new Date().toISOString(),
        originalName: file.originalname,
        assetType: 'admission-document',
      },
      CacheControl: 'max-age=86400', // 24 hours
    });

    await this.s3Client.send(command);
    const url = await this.getSignedUrl(documentPath);

    return { path: documentPath, url };
  }
  // Upload admission policy document
  async uploadAdmissionPolicyDocument(
    file: Express.Multer.File,
    schoolId: string,
    policyId: string,
  ): Promise<{ path: string; url: string }> {
    this.validateDocumentFile(file);

    const documentPath = this.generateSchoolAssetPath(
      schoolId,
      'admission-policies',
      file.originalname,
    );

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: documentPath,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        schoolId,
        policyId,
        uploadedAt: new Date().toISOString(),
        originalName: file.originalname,
        assetType: 'admission-policy',
      },
      CacheControl: 'max-age=86400', // 24 hours
    });

    await this.s3Client.send(command);
    const url = await this.getSignedUrl(documentPath);

    return { path: documentPath, url };
  }

  // Delete admission policy document
  async deleteAdmissionPolicyDocument(
    schoolId: string,
    policyId: string,
    documentPath: string,
  ): Promise<void> {
    try {
      // Verify the file belongs to the correct school and policy (security check)
      const expectedPrefix = `schools/${schoolId}/assets/admission-policies/`;
      if (!documentPath.startsWith(expectedPrefix)) {
        throw new BadRequestException('Unauthorized to delete this file');
      }

      await this.deleteFile(documentPath);
    } catch (error) {
      console.error('Error deleting admission policy document:', error);
      throw error;
    }
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
      CacheControl: 'max-age=31536000', // 1 year
    });

    await this.s3Client.send(command);
    const url = await this.getSignedUrl(imagePath);

    return { path: imagePath, url };
  }

  // Get signed URL with configurable expiration
  async getSignedUrl(path: string, expiresIn: number = 86400): Promise<string> {
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
