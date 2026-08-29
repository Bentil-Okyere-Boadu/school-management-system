import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantDirectory } from './entities/tenant-directory.entity';

@Injectable()
export class TenantDirectoryService {
  constructor(
    @InjectRepository(TenantDirectory)
    private readonly directoryRepository: Repository<TenantDirectory>,
  ) {}

  async upsert(params: {
    loginKey: string;
    userType: TenantDirectory['userType'];
    schoolId: string;
    tenantUserId: string;
  }): Promise<void> {
    const loginKey = params.loginKey.trim().toLowerCase();
    const existing = await this.directoryRepository.findOne({
      where: {
        loginKey,
        userType: params.userType,
        schoolId: params.schoolId,
      },
    });
    if (existing) {
      existing.tenantUserId = params.tenantUserId;
      await this.directoryRepository.save(existing);
      return;
    }
    await this.directoryRepository.save(
      this.directoryRepository.create({
        loginKey,
        userType: params.userType,
        schoolId: params.schoolId,
        tenantUserId: params.tenantUserId,
      }),
    );
  }

  async findByLogin(
    loginKey: string,
    userType: TenantDirectory['userType'],
  ): Promise<TenantDirectory[]> {
    return this.directoryRepository.find({
      where: {
        loginKey: loginKey.trim().toLowerCase(),
        userType,
      },
    });
  }

  async findAllByUserType(
    userType: TenantDirectory['userType'],
  ): Promise<TenantDirectory[]> {
    return this.directoryRepository.find({ where: { userType } });
  }

  async findByTenantUser(
    tenantUserId: string,
    userType: TenantDirectory['userType'],
  ): Promise<TenantDirectory | null> {
    return this.directoryRepository.findOne({
      where: { tenantUserId, userType },
    });
  }
}
