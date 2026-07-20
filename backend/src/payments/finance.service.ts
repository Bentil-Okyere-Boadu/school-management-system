import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { FeeObligationService } from './fee-obligation.service';
import { StudentCreditService } from './student-credit.service';
import { PaymentsService } from './payments.service';
import { FinanceQueryDto } from './dto/finance-query.dto';
import {
  PaymentProvider,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { PaymentQueryDto } from './dto/payment-query.dto';

export type FinanceStudentRow = {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classLevelId: string | null;
  className: string | null;
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
  arrears: number;
  prepayment: number;
  netBalance: number;
  nextDueDate: string | null;
  hasPendingBalance: boolean;
};

export type FinanceSchoolSummary = {
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
  arrears: number;
  prepayment: number;
  owingCount: number;
  prepaidCount: number;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
    private readonly feeObligationService: FeeObligationService,
    private readonly studentCreditService: StudentCreditService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async listStudents(schoolId: string, query: FinanceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const balanceStatus = query.balanceStatus ?? 'all';

    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .leftJoinAndSelect('student.school', 'school')
      .where('school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = false');

    if (query.classLevelId?.trim()) {
      qb.andWhere('classLevel.id = :classLevelId', {
        classLevelId: query.classLevelId.trim(),
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((builder) => {
          builder
            .where('student.firstName ILIKE :search', { search })
            .orWhere('student.lastName ILIKE :search', { search })
            .orWhere('student.studentId ILIKE :search', { search });
        }),
      );
    }

    qb.orderBy('student.lastName', 'ASC').addOrderBy('student.firstName', 'ASC');

    // When filtering by balance status we need full set then paginate in memory.
    // For "all", paginate at DB then compute rows for the page only.
    if (balanceStatus === 'all') {
      const [students, total] = await qb
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const data: FinanceStudentRow[] = [];
      for (const student of students) {
        data.push(await this.buildStudentRow(student));
      }

      const summary = await this.buildSchoolSummary(schoolId, query);
      return {
        data,
        summary,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    }

    const students = await qb.getMany();
    const allRows: FinanceStudentRow[] = [];
    for (const student of students) {
      const row = await this.buildStudentRow(student);
      if (this.matchesBalanceStatus(row, balanceStatus)) {
        allRows.push(row);
      }
    }

    const total = allRows.length;
    const start = (page - 1) * limit;
    const data = allRows.slice(start, start + limit);
    const summary = this.summarizeRows(allRows);

    return {
      data,
      summary,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listClasses(schoolId: string) {
    const classes = await this.classLevelRepository.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });

    const data: Array<{
      classLevelId: string;
      className: string;
      studentCount: number;
      totalPayable: number;
      totalPaid: number;
      outstanding: number;
      arrears: number;
      prepayment: number;
      netBalance: number;
    }> = [];
    for (const cls of classes) {
      const students = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.classLevels', 'classLevel')
        .leftJoinAndSelect('student.school', 'school')
        .where('school.id = :schoolId', { schoolId })
        .andWhere('student.isArchived = false')
        .andWhere('classLevel.id = :classId', { classId: cls.id })
        .getMany();

      let totalPayable = 0;
      let totalPaid = 0;
      let outstanding = 0;
      let arrears = 0;
      let prepayment = 0;

      for (const student of students) {
        const row = await this.buildStudentRow(student);
        totalPayable += row.totalPayable;
        totalPaid += row.totalPaid;
        outstanding += row.outstanding;
        arrears += row.arrears;
        prepayment += row.prepayment;
      }

      const round = (n: number) => Math.round(n * 100) / 100;
      data.push({
        classLevelId: cls.id,
        className: cls.name,
        studentCount: students.length,
        totalPayable: round(totalPayable),
        totalPaid: round(totalPaid),
        outstanding: round(outstanding),
        arrears: round(arrears),
        prepayment: round(prepayment),
        netBalance: round(outstanding - prepayment),
      });
    }

    return { data };
  }

  async getStudentDetail(schoolId: string, studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, school: { id: schoolId }, isArchived: false },
      relations: ['classLevels', 'school'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const fees =
      await this.paymentsService.getApplicableFeeStructuresForStudent(student, {
        ussdEligibleOnly: false,
      });
    await this.feeObligationService.ensureObligationsForStudent(student, fees);
    await this.studentCreditService.applyAvailableCredit(student, fees, {
      ussdEligibleOnly: false,
    });

    const prepayment = await this.studentCreditService.getAvailableCredit(
      student.id,
    );
    const { lines, totals } =
      await this.feeObligationService.getFinanceLinesForStudent(
        student,
        fees,
        { ensure: false, prepayment },
      );

    const primaryClass = student.classLevels?.[0] ?? null;
    const studentIdentity = {
      studentId: student.id,
      studentCode: student.studentId,
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      classLevelId: primaryClass?.id ?? null,
      className: primaryClass?.name ?? null,
    };

    const paymentQuery: PaymentQueryDto = {
      page: 1,
      limit: 10,
      status: PaymentTransactionStatus.PAID,
    };
    const paymentsResult = await this.paymentsService.listStudentPayments(
      student.id,
      paymentQuery,
    );

    const recentPayments = (paymentsResult.data ?? [])
      .filter((tx) => tx.provider !== PaymentProvider.INTERNAL_CREDIT)
      .map((tx) => ({
        id: tx.id,
        date: tx.paymentDate ?? tx.createdAt,
        amount: tx.amountAfterCharges > 0 ? tx.amountAfterCharges : tx.amount,
        status: tx.status,
        channel: tx.paymentMethod ?? tx.provider,
        studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
        studentCode: student.studentId,
        sessionId: tx.sessionId,
      }));

    return {
      student: studentIdentity,
      totals: {
        ...totals,
        hasPendingBalance: totals.netBalance > 0,
      },
      feeLines: lines,
      recentPayments,
    };
  }

  private async buildStudentRow(student: Student): Promise<FinanceStudentRow> {
    if (!student.classLevels) {
      const full = await this.studentRepository.findOne({
        where: { id: student.id },
        relations: ['classLevels', 'school'],
      });
      if (full) {
        student = full;
      }
    }

    const fees =
      await this.paymentsService.getApplicableFeeStructuresForStudent(student, {
        ussdEligibleOnly: false,
      });
    await this.feeObligationService.ensureObligationsForStudent(student, fees);
    await this.studentCreditService.applyAvailableCredit(student, fees, {
      ussdEligibleOnly: false,
    });

    const prepayment = await this.studentCreditService.getAvailableCredit(
      student.id,
    );
    const { totals } =
      await this.feeObligationService.getFinanceLinesForStudent(
        student,
        fees,
        { ensure: false, prepayment },
      );

    const primaryClass = student.classLevels?.[0] ?? null;
    return {
      studentId: student.id,
      studentCode: student.studentId,
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      classLevelId: primaryClass?.id ?? null,
      className: primaryClass?.name ?? null,
      totalPayable: totals.totalPayable,
      totalPaid: totals.totalPaid,
      outstanding: totals.outstanding,
      arrears: totals.arrears,
      prepayment: totals.prepayment,
      netBalance: totals.netBalance,
      nextDueDate: totals.nextDueDate,
      hasPendingBalance: totals.netBalance > 0,
    };
  }

  private matchesBalanceStatus(
    row: FinanceStudentRow,
    status: 'all' | 'owing' | 'clear' | 'prepaid',
  ): boolean {
    if (status === 'all') {
      return true;
    }
    if (status === 'owing') {
      return row.netBalance > 0;
    }
    if (status === 'prepaid') {
      return row.prepayment > 0;
    }
    // clear
    return row.netBalance === 0 && row.prepayment === 0;
  }

  private async collectFilteredRows(
    schoolId: string,
    query: FinanceQueryDto,
  ): Promise<FinanceStudentRow[]> {
    const qb = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .leftJoinAndSelect('student.school', 'school')
      .where('school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = false');

    if (query.classLevelId?.trim()) {
      qb.andWhere('classLevel.id = :classLevelId', {
        classLevelId: query.classLevelId.trim(),
      });
    }
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((builder) => {
          builder
            .where('student.firstName ILIKE :search', { search })
            .orWhere('student.lastName ILIKE :search', { search })
            .orWhere('student.studentId ILIKE :search', { search });
        }),
      );
    }

    const students = await qb.getMany();
    const rows: FinanceStudentRow[] = [];
    const balanceStatus = query.balanceStatus ?? 'all';
    for (const student of students) {
      const row = await this.buildStudentRow(student);
      if (this.matchesBalanceStatus(row, balanceStatus)) {
        rows.push(row);
      }
    }
    return rows;
  }

  private async buildSchoolSummary(
    schoolId: string,
    query: FinanceQueryDto,
  ): Promise<FinanceSchoolSummary> {
    // Summary respects class/search filters but not balanceStatus (school-wide filtered cohort).
    const summaryQuery: FinanceQueryDto = {
      ...query,
      balanceStatus: 'all',
      page: 1,
      limit: 1_000_000,
    };
    const rows = await this.collectFilteredRows(schoolId, summaryQuery);
    return this.summarizeRows(rows);
  }

  private summarizeRows(rows: FinanceStudentRow[]): FinanceSchoolSummary {
    const round = (n: number) => Math.round(n * 100) / 100;
    let totalPayable = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let arrears = 0;
    let prepayment = 0;
    let owingCount = 0;
    let prepaidCount = 0;

    for (const row of rows) {
      totalPayable += row.totalPayable;
      totalPaid += row.totalPaid;
      outstanding += row.outstanding;
      arrears += row.arrears;
      prepayment += row.prepayment;
      if (row.netBalance > 0) {
        owingCount += 1;
      }
      if (row.prepayment > 0) {
        prepaidCount += 1;
      }
    }

    return {
      totalPayable: round(totalPayable),
      totalPaid: round(totalPaid),
      outstanding: round(outstanding),
      arrears: round(arrears),
      prepayment: round(prepayment),
      owingCount,
      prepaidCount,
    };
  }
}
