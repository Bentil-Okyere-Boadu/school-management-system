import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { School } from 'src/school/school.entity';
import { CreateSchoolDto } from 'src/school/dto/create-school.dto';
import { TenantProvisionerService } from './tenant-provisioner.service';
import { SchoolProvisioningStatus } from './school-provisioning-status';
import { PlatformInvitation } from './entities/platform-invitation.entity';
import { TenantDirectory } from './entities/tenant-directory.entity';
import { TenantConnectionService } from './tenant-connection.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Role } from 'src/role/role.entity';
import { Profile } from 'src/profile/profile.entity';
import { EmailRetryService } from 'src/common/services/email-retry.service';
import { tenantSchemaName } from './tenant-schema.util';

@Injectable()
export class TenantOnboardingService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(PlatformInvitation)
    private readonly invitationRepository: Repository<PlatformInvitation>,
    @InjectRepository(TenantDirectory)
    private readonly directoryRepository: Repository<TenantDirectory>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly provisioner: TenantProvisionerService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly emailRetry: EmailRetryService,
  ) {}

  async createAndProvisionSchool(dto: CreateSchoolDto): Promise<School> {
    const school = this.schoolRepository.create({
      ...dto,
      provisioningStatus: SchoolProvisioningStatus.Provisioning,
      isDisabled: false,
    });
    const saved = await this.schoolRepository.save(school);
    saved.schemaName = tenantSchemaName(saved.id);
    if (!saved.schoolCode) {
      saved.schoolCode = saved.id.replace(/-/g, '').substring(0, 5);
    }
    await this.schoolRepository.save(saved);
    return this.provisioner.provision(saved);
  }

  async retryProvision(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return this.provisioner.provision(school);
  }

  async setDisabled(schoolId: string, isDisabled: boolean): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    school.isDisabled = isDisabled;
    return this.schoolRepository.save(school);
  }

  async inviteSchoolAdmin(params: {
    schoolId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<PlatformInvitation> {
    const school = await this.schoolRepository.findOne({
      where: { id: params.schoolId },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    if (school.provisioningStatus !== SchoolProvisioningStatus.Active) {
      throw new BadRequestException('School is not active');
    }
    if (school.isDisabled) {
      throw new BadRequestException('School is disabled');
    }

    const existingDir = await this.directoryRepository.findOne({
      where: { loginKey: params.email.toLowerCase(), userType: 'school_admin' },
    });
    if (existingDir) {
      throw new BadRequestException('School admin email already registered');
    }

    const invitation = this.invitationRepository.create({
      token: randomUUID(),
      schoolId: school.id,
      email: params.email.toLowerCase(),
      firstName: params.firstName,
      lastName: params.lastName,
      userType: 'school_admin',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accepted: false,
    });
    const saved = await this.invitationRepository.save(invitation);
    await this.emailRetry.retrySendInvitationEmail({
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      invitationToken: saved.token,
    } as SchoolAdmin);
    return saved;
  }

  async acceptSchoolAdminInvitation(
    token: string,
    password: string,
  ): Promise<SchoolAdmin> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, accepted: false },
    });
    if (!invitation || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invitation');
    }
    const school = await this.schoolRepository.findOne({
      where: { id: invitation.schoolId },
    });
    if (
      !school ||
      school.provisioningStatus !== SchoolProvisioningStatus.Active ||
      school.isDisabled
    ) {
      throw new BadRequestException('School cannot accept invitations');
    }

    const hashed = await bcrypt.hash(password, 10);
    const role = await this.roleRepository.findOne({
      where: { name: 'school_admin' },
    });

    const admin = await this.tenantConnection.runForSchoolId(
      school.id,
      async (manager) => {
        const profile = manager.create(Profile, {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          email: invitation.email,
        });
        const created = manager.create(SchoolAdmin, {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          email: invitation.email,
          password: hashed,
          status: 'active',
          isInvitationAccepted: true,
          role: role ?? undefined,
          school,
          profile,
        });
        return manager.save(SchoolAdmin, created);
      },
    );

    invitation.accepted = true;
    await this.invitationRepository.save(invitation);
    await this.directoryRepository.save(
      this.directoryRepository.create({
        loginKey: invitation.email,
        userType: 'school_admin',
        schoolId: school.id,
        tenantUserId: admin.id,
      }),
    );
    return admin;
  }

  async validateSchoolAdminLogin(
    email: string,
    password: string,
  ): Promise<SchoolAdmin | null> {
    const directory = await this.directoryRepository.findOne({
      where: {
        loginKey: email.toLowerCase(),
        userType: 'school_admin',
      },
    });
    if (!directory) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(
      directory.schoolId,
      async (manager) => {
        const admin = await manager.findOne(SchoolAdmin, {
          where: { id: directory.tenantUserId },
          relations: ['role', 'school'],
        });
        if (!admin?.password || admin.isSuspended) {
          return null;
        }
        const ok = await bcrypt.compare(password, admin.password);
        return ok ? admin : null;
      },
    );
  }
}
