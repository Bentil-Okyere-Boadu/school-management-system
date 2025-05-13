import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
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
}
