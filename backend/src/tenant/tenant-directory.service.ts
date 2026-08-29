import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  /**
   * Student/teacher rows are written at invite or admission time (before first
   * login). School-admin and parent rows appear when those users exist in the
   * tenant. Counts are per-school listings, not “accepted invitations.”
   */
  async countByUserTypeForSchools(
    userType: TenantDirectory['userType'],
    schoolIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (schoolIds.length === 0) {
      return counts;
    }
    const listings = await this.directoryRepository.find({
      where: { userType, schoolId: In(schoolIds) },
    });
    for (const listing of listings) {
      counts.set(listing.schoolId, (counts.get(listing.schoolId) ?? 0) + 1);
    }
    return counts;
  }

  async findByTenantUser(
    tenantUserId: string,
    userType: TenantDirectory['userType'],
  ): Promise<TenantDirectory | null> {
    return this.directoryRepository.findOne({
      where: { tenantUserId, userType },
    });
  }

  async upsertStudentLookupKeys(params: {
    schoolId: string;
    tenantUserId: string;
    email?: string | null;
    studentId?: string | null;
    billingCode?: string | null;
  }): Promise<void> {
    const keys = [params.email, params.studentId, params.billingCode].filter(
      (key): key is string => Boolean(key && key.trim()),
    );
    for (const loginKey of keys) {
      await this.upsert({
        loginKey,
        userType: 'student',
        schoolId: params.schoolId,
        tenantUserId: params.tenantUserId,
      });
    }
  }
}
