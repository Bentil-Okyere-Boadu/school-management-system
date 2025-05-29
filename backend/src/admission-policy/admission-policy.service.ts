import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdmissionPolicy } from './admission-policy.entity';
import { CreateAdmissionPolicyDto } from './dto/create-admission-policy.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Injectable()
export class AdmissionPolicyService {
  private readonly logger = new Logger(AdmissionPolicyService.name);
  constructor(
    @InjectRepository(AdmissionPolicy)
    private admissionPolicyRepository: Repository<AdmissionPolicy>,
    private objectStorageService: ObjectStorageServiceService,
  ) {}

  async create(
    createAdmissionPolicyDto: CreateAdmissionPolicyDto,
    file: Express.Multer.File,
    admin: SchoolAdmin,
  ): Promise<AdmissionPolicy & { documentUrl?: string }> {
    if (!file) {
      throw new NotFoundException('File is required for admission policy');
    }
    // Create the policy first
    const policy = this.admissionPolicyRepository.create({
      name: createAdmissionPolicyDto.name,
      description: createAdmissionPolicyDto.description,
      school: { id: admin.school.id },
    });

    const savedPolicy = await this.admissionPolicyRepository.save(policy);

    // If a file was provided, upload it
    if (file) {
      try {
        const { path: documentPath, url: documentUrl } =
          await this.objectStorageService.uploadAdmissionPolicyDocument(
            file,
            admin.school.id,
            savedPolicy.id,
          );

        savedPolicy.documentPath = documentPath;
        savedPolicy.mediaType = file.mimetype;
        await this.admissionPolicyRepository.save(savedPolicy);

        return { ...savedPolicy, documentUrl };
      } catch (error) {
        // If file upload fails, delete the created policy
        await this.admissionPolicyRepository.remove(savedPolicy);
        throw error;
      }
    }

    return savedPolicy;
  }

  async getPolicyWithDocumentUrl(
    id: string,
    admin: SchoolAdmin,
  ): Promise<AdmissionPolicy & { documentUrl?: string }> {
    const policy = await this.admissionPolicyRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });

    if (!policy) {
      throw new NotFoundException('Admission policy not found');
    }

    const result = { ...policy } as AdmissionPolicy & { documentUrl?: string };

    if (policy.documentPath) {
      try {
        result.documentUrl = await this.objectStorageService.getSignedUrl(
          policy.documentPath,
        );
      } catch {
        // Don't throw error, just continue without document URL
      }
    }

    return result;
  }

  async removeDocument(id: string, admin: SchoolAdmin) {
    const policy = await this.admissionPolicyRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });

    if (!policy) {
      throw new NotFoundException('Admission policy not found');
    }

    if (policy.documentPath) {
      await this.objectStorageService.deleteAdmissionPolicyDocument(
        admin.school.id,
        id,
        policy.documentPath,
      );

      policy.documentPath = null;
      policy.mediaType = null;
    }
    await this.admissionPolicyRepository.remove(policy);
    return { message: 'Policy deleted successfully' };
  }

  async findAll(
    admin: SchoolAdmin,
  ): Promise<(AdmissionPolicy & { documentUrl?: string })[]> {
    const policies = await this.admissionPolicyRepository.find({
      where: { school: { id: admin.school.id } },
    });

    const policiesWithUrls = await Promise.all(
      policies.map(async (policy) => {
        const result = { ...policy } as AdmissionPolicy & {
          documentUrl?: string;
        };

        if (policy.documentPath) {
          try {
            result.documentUrl = await this.objectStorageService.getSignedUrl(
              policy.documentPath,
            );
          } catch {
            this.logger.warn(
              `Failed to get signed URL for admission policy document: ${policy.id}`,
            );
            // Don't throw error, just continue without document URL
          }
        }

        return result;
      }),
    );

    return policiesWithUrls;
  }
}
