import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, LessThan, Repository } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { Student } from 'src/student/student.entity';
import { Attendance } from 'src/attendance/attendance.entity';

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

    const deletedAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    const deletedAdmins = deletedAdminsResult.affected || 0;
    this.logger.log(`Deleted ${deletedAdmins} orphaned admin users`);

    const deletedTeachers = await this.deletePendingTeachers({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
    this.logger.log(`Deleted ${deletedTeachers} orphaned teacher users`);

    const deletedStudents = await this.deletePendingStudents({
      status: 'pending',
      createdAt: LessThan(sevenDaysAgo),
    });
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

    const deletedExpiredAdminsResult = await this.adminRepository.delete({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    const expiredAdmins = deletedExpiredAdminsResult.affected || 0;
    this.logger.log(`Deleted ${expiredAdmins} admins with expired tokens`);

    const expiredTeachers = await this.deletePendingTeachers({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
    this.logger.log(`Deleted ${expiredTeachers} teachers with expired tokens`);

    const expiredStudents = await this.deletePendingStudents({
      status: 'pending',
      invitationExpires: LessThan(now),
    });
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
