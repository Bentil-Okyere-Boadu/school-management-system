import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private objectStorageService: ObjectStorageServiceService,
  ) {}

  async handleUpdateProfile<
    T extends {
      id: string;
      profile?: Profile;
    },
    U extends { [key: string]: any },
  >(
    id: string,
    updateDto: U,
    repository: Repository<T>,
    relations: string[] = [],
  ): Promise<T> {
    const entity = await repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations: [...relations, 'profile'],
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    if (!entity.profile) {
      const newProfile = this.profileRepository.create({
        ...updateDto,
      });
      entity.profile = await this.profileRepository.save(newProfile);
    } else {
      Object.assign(entity.profile, updateDto);
      await this.profileRepository.save(entity.profile);
    }

    Object.assign(entity, updateDto);
    return repository.save(entity);
  }

  // Handle profile image upload
  async updateProfileImage<
    T extends {
      id: string;
      profile?: Profile;
    },
  >(
    id: string,
    file: Express.Multer.File,
    repository: Repository<T>,
    relations: string[] = [],
  ): Promise<{ entity: T; imageUrl: string }> {
    const entity = await repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations: [...relations, 'profile'],
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    const { path: newImagePath, url: imageUrl } =
      await this.objectStorageService.uploadProfileImage(file, id);

    if (entity.profile?.avatarPath) {
      await this.objectStorageService.deleteProfileImage(
        id,
        entity.profile.avatarPath,
      );
    }

    // Update or create profile
    if (!entity.profile) {
      const newProfile = this.profileRepository.create({
        avatarPath: newImagePath,
        mediaType: file.mimetype,
      });
      entity.profile = await this.profileRepository.save(newProfile);
    } else {
      entity.profile.avatarPath = newImagePath;
      entity.profile.mediaType = file.mimetype;
      await this.profileRepository.save(entity.profile);
    }

    const updatedEntity = await repository.save(entity);
    return { entity: updatedEntity, imageUrl };
  }

  // Get profile with image URL
  async getProfileWithImageUrl(
    profileId: string,
  ): Promise<Profile & { avatarUrl?: string }> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const result = { ...profile } as Profile & { avatarUrl?: string };

    if (profile.avatarPath) {
      try {
        result.avatarUrl = await this.objectStorageService.getSignedUrl(
          profile.avatarPath,
        );
      } catch {
        // Don't throw error, just continue without avatar URL
      }
    }

    return result;
  }

  // Remove profile image
  async removeProfileImage<
    T extends {
      id: string;
      profile?: Profile;
    },
  >(
    id: string,
    repository: Repository<T>,
    relations: string[] = [],
  ): Promise<T> {
    const entity = await repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations: [...relations, 'profile'],
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    if (entity.profile?.avatarPath) {
      // Delete image from S3
      await this.objectStorageService.deleteProfileImage(
        id,
        entity.profile.avatarPath,
      );

      entity.profile.avatarPath = undefined;
      entity.profile.mediaType = undefined;

      // Remove path from database
      await this.profileRepository.save(entity.profile);
    }

    return repository.save(entity);
  }

  // Batch update profiles with image URLs (useful for listing pages)
  async getProfilesWithImageUrls(
    profileIds: string[],
  ): Promise<(Profile & { avatarUrl?: string })[]> {
    const profiles = await this.profileRepository.findByIds(profileIds);

    const profilesWithUrls = await Promise.all(
      profiles.map(async (profile) => {
        const result = { ...profile } as Profile & { avatarUrl?: string };

        if (profile.avatarPath) {
          try {
            result.avatarUrl = await this.objectStorageService.getSignedUrl(
              profile.avatarPath,
            );
          } catch {
            // Don't throw error, just continue without avatar URL
          }
        }

        return result;
      }),
    );

    return profilesWithUrls;
  }
}
