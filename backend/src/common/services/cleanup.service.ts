import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, LessThan, Repository } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';
import { Attendance } from 'src/attendance/attendance.entity';
import { PlatformInvitation } from 'src/tenant/entities/platform-invitation.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { TenantIterationService } from 'src/tenant/tenant-iteration.service';

/**
 * Service for cleaning up orphaned users and expired invitations
 */
@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(PlatformInvitation)
    private invitationRepository: Repository<PlatformInvitation>,
    private readonly tenantConnection: TenantConnectionService,
    private readonly tenantIteration: TenantIterationService,
  ) {}

  /**
   * School-admin invites stay in public.platform_invitation until accepted.
   * Teachers and students are tenant rows, so those deletes run per school.
   */
  async cleanupOrphanedUsers(): Promise<{
    deletedInvitations: number;
    deletedAdmins: number;
    deletedTeachers: number;
    deletedStudents: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.logger.log('Starting cleanup of orphaned users...');

    const deletedInvitations = await this.deleteExpiredPlatformInvitations(
      sevenDaysAgo,
    );
    this.logger.log(
      `Deleted ${deletedInvitations} orphaned platform invitations`,
    );

    const totals = {
      deletedAdmins: 0,
      deletedTeachers: 0,
      deletedStudents: 0,
    };
    await this.forEachTenant(async () => {
      const part = await this.cleanupTenantOrphanedUsers(sevenDaysAgo);
      totals.deletedAdmins += part.deletedAdmins;
      totals.deletedTeachers += part.deletedTeachers;
      totals.deletedStudents += part.deletedStudents;
    });

    this.logger.log(
      `Deleted ${totals.deletedAdmins} orphaned admin users, ${totals.deletedTeachers} teachers, ${totals.deletedStudents} students`,
    );

    return {
      deletedInvitations,
      ...totals,
    };
  }

  async cleanupExpiredTokens(): Promise<{
    expiredInvitations: number;
    expiredAdmins: number;
    expiredTeachers: number;
    expiredStudents: number;
  }> {
    const now = new Date();

    this.logger.log('Starting cleanup of expired invitation tokens...');

    const expiredInvitations = await this.deleteExpiredPlatformInvitations(now);
    this.logger.log(
      `Deleted ${expiredInvitations} expired platform invitations`,
    );

    const totals = {
      expiredAdmins: 0,
      expiredTeachers: 0,
      expiredStudents: 0,
    };
    await this.forEachTenant(async () => {
      const part = await this.cleanupTenantExpiredTokens(now);
      totals.expiredAdmins += part.expiredAdmins;
      totals.expiredTeachers += part.expiredTeachers;
      totals.expiredStudents += part.expiredStudents;
    });

    this.logger.log(
      `Deleted ${totals.expiredAdmins} expired tenant admins, ${totals.expiredTeachers} teachers, ${totals.expiredStudents} students`,
    );

    return {
      expiredInvitations,
      ...totals,
    };
  }

  async getPendingUsersStats(): Promise<{
    pendingInvitations: number;
    pendingAdmins: number;
    pendingTeachers: number;
    pendingStudents: number;
    expiredTokens: number;
  }> {
    const now = new Date();

    const pendingInvitations = await this.invitationRepository.count({
      where: { accepted: false },
    });
    const expiredInvitations = await this.invitationRepository.count({
      where: { accepted: false, expiresAt: LessThan(now) },
    });

    const totals = {
      pendingAdmins: 0,
      pendingTeachers: 0,
      pendingStudents: 0,
      expiredTokens: expiredInvitations,
    };
    await this.forEachTenant(async () => {
      const part = await this.getTenantPendingStats(now);
      totals.pendingAdmins += part.pendingAdmins;
      totals.pendingTeachers += part.pendingTeachers;
      totals.pendingStudents += part.pendingStudents;
      totals.expiredTokens += part.expiredTokens;
    });

    return {
      pendingInvitations,
      ...totals,
    };
  }

  private async deleteExpiredPlatformInvitations(
    before: Date,
  ): Promise<number> {
    const result = await this.invitationRepository.delete({
      accepted: false,
      expiresAt: LessThan(before),
    });
    return result.affected || 0;
  }

  private async cleanupTenantOrphanedUsers(sevenDaysAgo: Date): Promise<{
    deletedAdmins: number;
    deletedTeachers: number;
    deletedStudents: number;
  }> {
    const deletedAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedTeachers = await this.deletePendingTeachers({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedStudents = await this.deletePendingStudents({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    return {
      deletedAdmins: deletedAdminsResult.affected || 0,
      deletedTeachers,
      deletedStudents,
    };
  }

  private async cleanupTenantExpiredTokens(now: Date): Promise<{
    expiredAdmins: number;
    expiredTeachers: number;
    expiredStudents: number;
  }> {
    const deletedExpiredAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    return {
      expiredAdmins: deletedExpiredAdminsResult.affected || 0,
      expiredTeachers: 0,
      expiredStudents: 0,
    };
  }

  private async getTenantPendingStats(now: Date): Promise<{
    pendingAdmins: number;
    pendingTeachers: number;
    pendingStudents: number;
    expiredTokens: number;
  }> {
    const pendingAdmins = await this.adminRepository.count({
      where: { status: 'pending' },
    });
    const pendingTeachers = await this.teacherRepository.count({
      where: { status: 'pending' },
    });
    const pendingStudents = await this.studentRepository.count({
      where: { status: 'pending' },
    });
    const expiredTokens = await this.adminRepository.count({
      where: { status: 'pending', invitationExpires: LessThan(now) },
    });
    return {
      pendingAdmins,
      pendingTeachers,
      pendingStudents,
      expiredTokens,
    };
  }

  private async forEachTenant(fn: () => Promise<void>): Promise<void> {
    if (this.tenantConnection.tryGetStore()) {
      await fn();
      return;
    }
    await this.tenantIteration.forEachActiveSchool(async () => {
      await fn();
    });
  }

  private async deletePendingStudents(
    where: FindOptionsWhere<Student>,
  ): Promise<number> {
    const students = await this.studentRepository.find({
      where,
      select: ['id'],
    });
    if (students.length === 0) {
      return 0;
    }

    const ids = students.map((s) => s.id);
    const manager = this.studentRepository.manager;

    await manager
      .createQueryBuilder()
      .delete()
      .from('class_level_students')
      .where('student_id IN (:...ids)', { ids })
      .execute();

    await manager.getRepository(Attendance).delete({
      student: { id: In(ids) },
    });

    const result = await this.studentRepository.delete({ id: In(ids) });
    return result.affected || 0;
  }

  private async deletePendingTeachers(
    where: FindOptionsWhere<Teacher>,
  ): Promise<number> {
    const teachers = await this.teacherRepository.find({
      where,
      select: ['id'],
    });
    if (teachers.length === 0) {
      return 0;
    }

    const ids = teachers.map((t) => t.id);
    const manager = this.teacherRepository.manager;

    await manager
      .createQueryBuilder()
      .delete()
      .from('class_level_teachers')
      .where('teacher_id IN (:...ids)', { ids })
      .execute();

    const result = await this.teacherRepository.delete({ id: In(ids) });
    return result.affected || 0;
  }
}
