import { Injectable, NotFoundException } from '@nestjs/common';
import { ParentAuthorizationService } from './parent.authorization';
import { ParentAttendanceService } from './parent-attendance.service';
import { FinanceService } from 'src/payments/finance.service';
import { PaymentsService } from 'src/payments/payments.service';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { SubjectService } from 'src/subject/subject.service';
import { Parent } from './parent.entity';
import { Student } from 'src/student/student.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudent } from './parent-student.entity';
import { ParentStudentStatus } from './parent.enums';
import { PaymentQueryDto } from 'src/payments/dto/payment-query.dto';
import { PaymentTransactionStatus } from 'src/payments/entities/payment-transaction.entity';
import { MessageReminder } from 'src/notification/entities/message-reminder.entity';
import { ReminderStatus } from 'src/notification/entities/message-reminder.entity';

@Injectable()
export class ParentDashboardService {
  constructor(
    private readonly authorization: ParentAuthorizationService,
    private readonly attendanceService: ParentAttendanceService,
    private readonly financeService: FinanceService,
    private readonly paymentsService: PaymentsService,
    private readonly academicCalendarService: AcademicCalendarService,
    private readonly subjectService: SubjectService,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(MessageReminder)
    private readonly reminderRepository: Repository<MessageReminder>,
  ) {}

  async getMe(parentId: string) {
    const parent = await this.parentRepository.findOne({
      where: { id: parentId },
      relations: ['role', 'school', 'profile'],
    });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    const children = await this.authorization.getActiveChildren(parentId);
    return {
      ...parent,
      children: children.map((child) => ({
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentId: child.studentId,
        classLevels: child.classLevels,
      })),
    };
  }

  async getCalendars(parentId: string) {
    const parent = await this.getMe(parentId);
    if (!parent.school?.id) {
      return [];
    }
    return this.academicCalendarService.findAllCalendars(parent.school.id);
  }

  async getOverview(
    parentId: string,
    query: { studentId?: string; calendarId?: string; termId?: string },
  ) {
    const parent = await this.getMe(parentId);
    let children = await this.authorization.getActiveChildren(parentId);
    if (query.studentId) {
      await this.authorization.requireActiveParentStudent(
        parentId,
        query.studentId,
      );
      children = children.filter((child) => child.id === query.studentId);
    }

    const pendingActions = await this.parentStudentRepository.count({
      where: {
        parent: { id: parentId },
        status: ParentStudentStatus.PendingConfirmation,
      },
    });

    const finance = await Promise.all(
      children.map((child) =>
        this.financeService.getStudentDetail(parent.school.id, child.id),
      ),
    );

    const feesCharged = round(
      finance.reduce((sum, row) => sum + (row.totals.totalPayable ?? 0), 0),
    );
    const totalPaid = round(
      finance.reduce((sum, row) => sum + (row.totals.totalPaid ?? 0), 0),
    );
    const outstanding = round(
      finance.reduce((sum, row) => sum + (row.totals.outstanding ?? 0), 0),
    );
    const overdueChildrenCount = finance.filter(
      (row) => (row.totals.arrears ?? 0) > 0,
    ).length;

    return {
      parentName: `${parent.firstName} ${parent.lastName}`.trim(),
      schoolName: parent.school?.name ?? null,
      childrenCount: children.length,
      overdueChildrenCount,
      feesCharged,
      totalPaid,
      outstanding,
      pendingActionsCount: pendingActions,
      year: query.calendarId ?? null,
      term: query.termId ?? null,
      wards: children.map((child, index) => ({
        studentId: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        studentCode: child.studentId,
        grade: child.classLevels?.[0]?.name ?? null,
        photoUrl: child.profile?.avatarUrl ?? null,
        feesCharged: finance[index]?.totals.totalPayable ?? 0,
        totalPaid: finance[index]?.totals.totalPaid ?? 0,
        outstanding: finance[index]?.totals.outstanding ?? 0,
        nextDueDate: finance[index]?.totals.nextDueDate ?? null,
        overdue: (finance[index]?.totals.arrears ?? 0) > 0,
      })),
    };
  }

  async getAttendance(
    parentId: string,
    query: { studentId?: string; month?: number; year?: number },
  ) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    let children = await this.authorization.getActiveChildren(parentId);
    if (query.studentId) {
      const { student } = await this.authorization.requireActiveParentStudent(
        parentId,
        query.studentId,
      );
      children = [student];
    }
    return Promise.all(
      children.map((child) =>
        this.attendanceService.getMonthSheet(child, year, month),
      ),
    );
  }

  async getChildAttendanceReport(
    parentId: string,
    studentId: string,
    month: number,
    year: number,
  ) {
    const { student } = await this.authorization.requireActiveParentStudent(
      parentId,
      studentId,
    );
    return this.attendanceService.getMonthSheet(student, year, month);
  }

  async getFinance(parentId: string, studentId?: string) {
    const parent = await this.getMe(parentId);
    let children = await this.authorization.getActiveChildren(parentId);
    if (studentId) {
      const { student } = await this.authorization.requireActiveParentStudent(
        parentId,
        studentId,
      );
      children = [student];
    }

    return Promise.all(
      children.map(async (child) => {
        const detail = await this.financeService.getStudentDetail(
          parent.school.id,
          child.id,
        );
        const historyQuery: PaymentQueryDto = {
          page: 1,
          limit: 20,
          status: PaymentTransactionStatus.PAID,
        };
        const history = await this.paymentsService.listStudentPayments(
          child.id,
          historyQuery,
        );
        return {
          studentId: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentCode: child.studentId,
          grade: child.classLevels?.[0]?.name ?? null,
          photoUrl: child.profile?.avatarUrl ?? null,
          feeLines: detail.feeLines,
          totals: detail.totals,
          upcoming: detail.feeLines
            .filter((line) => line.outstanding > 0)
            .map((line) => ({
              label: line.periodLabel,
              dueDate: line.dueDate,
              amount: line.outstanding,
              overdue: line.isArrear,
            })),
          history: history.data ?? [],
        };
      }),
    );
  }

  async getReceipt(parentId: string, studentId: string, transactionId: string) {
    await this.authorization.requireActiveParentStudent(parentId, studentId);
    return this.paymentsService.getReceiptByTransactionForStudent(
      studentId,
      transactionId,
    );
  }

  async getAcademics(
    parentId: string,
    calendarId: string,
    studentId?: string,
  ) {
    const parent = await this.getMe(parentId);
    let children = await this.authorization.getActiveChildren(parentId);
    if (studentId) {
      const { student } = await this.authorization.requireActiveParentStudent(
        parentId,
        studentId,
      );
      children = [student];
    }

    return Promise.all(
      children.map(async (child) => {
        const results = await this.subjectService.getStudentResults(
          child.id,
          calendarId,
          parent,
        );
        const announcements = await this.recentAnnouncements(
          parent.school.id,
          child,
        );
        const pendingConfirmations = await this.parentStudentRepository.find({
          where: {
            parent: { id: parentId },
            student: { id: child.id },
            status: ParentStudentStatus.PendingConfirmation,
          },
        });

        const terms = results?.terms ?? [];
        const published = terms.length > 0;
        return {
          studentId: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentCode: child.studentId,
          grade: child.classLevels?.[0]?.name ?? null,
          photoUrl: child.profile?.avatarUrl ?? null,
          resultsPending: !published,
          results,
          parentVisibility: {
            showScores: parent.school.parentShowScores ?? true,
            showGrades: parent.school.parentShowGrades ?? true,
            showLabels: parent.school.parentShowLabels ?? true,
            showFeedback: parent.school.parentShowFeedback ?? true,
          },
          announcements,
          requiredActions: pendingConfirmations.map((link) => ({
            id: link.id,
            type: 'child_confirmation',
            message: 'Confirm this child to grant parent portal access',
            status: link.status,
          })),
        };
      }),
    );
  }

  private async recentAnnouncements(schoolId: string, student: Student) {
    const classIds = (student.classLevels ?? []).map((level) => level.id);
    const reminders = await this.reminderRepository.find({
      where: { school: { id: schoolId }, status: ReminderStatus.ACTIVE },
      relations: ['targetStudents', 'targetClassLevels'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return reminders
      .filter((reminder) => {
        if (reminder.sendToParents !== true) {
          return false;
        }
        const targetsStudent = reminder.targetStudents?.some(
          (target) => target.id === student.id,
        );
        const targetsClass = reminder.targetClassLevels?.some((level) =>
          classIds.includes(level.id),
        );
        return (
          targetsStudent ||
          targetsClass ||
          (!reminder.targetStudents?.length && !reminder.targetClassLevels?.length)
        );
      })
      .slice(0, 5)
      .map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        message: reminder.message,
        createdAt: reminder.createdAt,
      }));
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
