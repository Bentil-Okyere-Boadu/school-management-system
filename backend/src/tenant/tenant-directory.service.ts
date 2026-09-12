import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
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
    loginEligible?: boolean;
  }): Promise<void> {
    await this.upsertWithManager(this.directoryRepository.manager, params);
  }

  async upsertWithManager(
    manager: EntityManager,
    params: {
      loginKey: string;
      userType: TenantDirectory['userType'];
      schoolId: string;
      tenantUserId: string;
      loginEligible?: boolean;
    },
  ): Promise<void> {
    const directoryRepository = manager.getRepository(TenantDirectory);
    const loginKey = params.loginKey.trim().toLowerCase();
    const existing = await directoryRepository.findOne({
      where: {
        loginKey,
        userType: params.userType,
        schoolId: params.schoolId,
      },
    });
    if (existing) {
      existing.tenantUserId = params.tenantUserId;
      if (params.loginEligible !== undefined) {
        existing.loginEligible = params.loginEligible;
      }
      await directoryRepository.save(existing);
      return;
    }
    await directoryRepository.save(
      directoryRepository.create({
        loginKey,
        userType: params.userType,
        schoolId: params.schoolId,
        tenantUserId: params.tenantUserId,
        loginEligible: params.loginEligible ?? true,
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
    options?: { loginEligibleOnly?: boolean },
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (schoolIds.length === 0) {
      return counts;
    }
    const where: {
      userType: TenantDirectory['userType'];
      schoolId: ReturnType<typeof In>;
      loginEligible?: boolean;
    } = { userType, schoolId: In(schoolIds) };
    if (options?.loginEligibleOnly) {
      where.loginEligible = true;
    }
    const listings = await this.directoryRepository.find({ where });
    for (const listing of listings) {
      counts.set(listing.schoolId, (counts.get(listing.schoolId) ?? 0) + 1);
    }
    return counts;
  }

  async setLoginEligible(
    tenantUserId: string,
    userType: TenantDirectory['userType'],
    loginEligible: boolean,
  ): Promise<void> {
    const row = await this.directoryRepository.findOne({
      where: { tenantUserId, userType },
    });
    if (!row) {
      return;
    }
    row.loginEligible = loginEligible;
    await this.directoryRepository.save(row);
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
    await this.upsertStudentLookupKeysWithManager(
      this.directoryRepository.manager,
      params,
    );
  }

  async upsertStudentLookupKeysWithManager(
    manager: EntityManager,
    params: {
      schoolId: string;
      tenantUserId: string;
      email?: string | null;
      studentId?: string | null;
      billingCode?: string | null;
    },
  ): Promise<void> {
    const keys = [params.email, params.studentId, params.billingCode].filter(
      (key): key is string => Boolean(key && key.trim()),
    );
    for (const loginKey of keys) {
      await this.upsertWithManager(manager, {
        loginKey,
        userType: 'student',
        schoolId: params.schoolId,
        tenantUserId: params.tenantUserId,
      });
    }
  }
}
