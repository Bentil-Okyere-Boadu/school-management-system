import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';

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
  ) {}

  /**
   * Clean up orphaned pending users (users in pending state for more than 7 days)
   */
  async cleanupOrphanedUsers(): Promise<{
    deletedAdmins: number;
    deletedTeachers: number;
    deletedStudents: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.logger.log('Starting cleanup of orphaned users...');

    // Clean up orphaned admins
    const orphanedAdmins = await this.adminRepository.find({
      where: {
        status: 'pending',
        createdAt: LessThan(sevenDaysAgo),
      },
    });

    const deletedAdmins = await this.adminRepository.remove(orphanedAdmins);
    this.logger.log(`Deleted ${deletedAdmins.length} orphaned admin users`);

    // Clean up orphaned teachers
    const orphanedTeachers = await this.teacherRepository.find({
      where: {
        status: 'pending',
        createdAt: LessThan(sevenDaysAgo),
      },
    });

    const deletedTeachers =
      await this.teacherRepository.remove(orphanedTeachers);
    this.logger.log(`Deleted ${deletedTeachers.length} orphaned teacher users`);

    // Clean up orphaned students
    const orphanedStudents = await this.studentRepository.find({
      where: {
        status: 'pending',
        createdAt: LessThan(sevenDaysAgo),
      },
    });

    const deletedStudents =
      await this.studentRepository.remove(orphanedStudents);
    this.logger.log(`Deleted ${deletedStudents.length} orphaned student users`);

    return {
      deletedAdmins: deletedAdmins.length,
      deletedTeachers: deletedTeachers.length,
      deletedStudents: deletedStudents.length,
    };
  }

  /**
   * Clean up expired invitation tokens
   */
  async cleanupExpiredTokens(): Promise<{
    expiredAdmins: number;
    expiredTeachers: number;
    expiredStudents: number;
  }> {
    const now = new Date();

    this.logger.log('Starting cleanup of expired invitation tokens...');

    // Clean up expired admin tokens
    const expiredAdmins = await this.adminRepository.find({
      where: {
        status: 'pending',
        invitationExpires: LessThan(now),
      },
    });

    const deletedExpiredAdmins =
      await this.adminRepository.remove(expiredAdmins);
    this.logger.log(
      `Deleted ${deletedExpiredAdmins.length} admins with expired tokens`,
    );

    // Clean up expired teacher tokens
    const expiredTeachers = await this.teacherRepository.find({
      where: {
        status: 'pending',
        invitationExpires: LessThan(now),
      },
    });

    const deletedExpiredTeachers =
      await this.teacherRepository.remove(expiredTeachers);
    this.logger.log(
      `Deleted ${deletedExpiredTeachers.length} teachers with expired tokens`,
    );

    // Clean up expired student tokens
    const expiredStudents = await this.studentRepository.find({
      where: {
        status: 'pending',
        invitationExpires: LessThan(now),
      },
    });

    const deletedExpiredStudents =
      await this.studentRepository.remove(expiredStudents);
    this.logger.log(
      `Deleted ${deletedExpiredStudents.length} students with expired tokens`,
    );

    return {
      expiredAdmins: deletedExpiredAdmins.length,
      expiredTeachers: deletedExpiredTeachers.length,
      expiredStudents: deletedExpiredStudents.length,
    };
  }

  /**
   * Get statistics about pending users
   */
  async getPendingUsersStats(): Promise<{
    pendingAdmins: number;
    pendingTeachers: number;
    pendingStudents: number;
    expiredTokens: number;
  }> {
    const now = new Date();

    const pendingAdmins = await this.adminRepository.count({
      where: { status: 'pending' },
    });

    const pendingTeachers = await this.teacherRepository.count({
      where: { status: 'pending' },
    });

    const pendingStudents = await this.studentRepository.count({
      where: { status: 'pending' },
    });

    const expiredTokens =
      (await this.adminRepository.count({
        where: {
          status: 'pending',
          invitationExpires: LessThan(now),
        },
      })) +
      (await this.teacherRepository.count({
        where: {
          status: 'pending',
          invitationExpires: LessThan(now),
        },
      })) +
      (await this.studentRepository.count({
        where: {
          status: 'pending',
          invitationExpires: LessThan(now),
        },
      }));

    return {
      pendingAdmins,
      pendingTeachers,
      pendingStudents,
      expiredTokens,
    };
  }
}
