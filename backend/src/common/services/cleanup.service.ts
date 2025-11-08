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

    // Clean up orphaned admins using delete (faster, avoids loading entities)
    const deletedAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedAdmins = deletedAdminsResult.affected || 0;
    this.logger.log(`Deleted ${deletedAdmins} orphaned admin users`);

    // Clean up orphaned teachers using delete (faster, avoids loading entities)
    const deletedTeachersResult = await this.teacherRepository.delete({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedTeachers = deletedTeachersResult.affected || 0;
    this.logger.log(`Deleted ${deletedTeachers} orphaned teacher users`);

    // Clean up orphaned students using delete (faster, avoids loading entities)
    const deletedStudentsResult = await this.studentRepository.delete({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedStudents = deletedStudentsResult.affected || 0;
    this.logger.log(`Deleted ${deletedStudents} orphaned student users`);

    return {
      deletedAdmins,
      deletedTeachers,
      deletedStudents,
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

    // Clean up expired admin tokens using delete (faster, avoids loading entities)
    const deletedExpiredAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    const expiredAdmins = deletedExpiredAdminsResult.affected || 0;
    this.logger.log(`Deleted ${expiredAdmins} admins with expired tokens`);

    // Clean up expired teacher tokens using delete (faster, avoids loading entities)
    const deletedExpiredTeachersResult = await this.teacherRepository.delete({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    const expiredTeachers = deletedExpiredTeachersResult.affected || 0;
    this.logger.log(`Deleted ${expiredTeachers} teachers with expired tokens`);

    // Clean up expired student tokens using delete (faster, avoids loading entities)
    const deletedExpiredStudentsResult = await this.studentRepository.delete({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    const expiredStudents = deletedExpiredStudentsResult.affected || 0;
    this.logger.log(`Deleted ${expiredStudents} students with expired tokens`);

    return {
      expiredAdmins,
      expiredTeachers,
      expiredStudents,
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
