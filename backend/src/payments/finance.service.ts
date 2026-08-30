import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { FeeObligationService, FinanceObligationLine, StudentFinanceTotals } from './fee-obligation.service';
import { StudentCreditService } from './student-credit.service';
import { PaymentsService } from './payments.service';
import { FinanceQueryDto } from './dto/finance-query.dto';
import { FinanceStudentDetailQueryDto } from './dto/finance-student-detail-query.dto';
import {
  PaymentProvider,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { StudentFeeObligation } from './entities/student-fee-obligation.entity';

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

type PeriodFilterQuery = {
  academicTermId?: string;
  academicCalendarId?: string;
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

      const data = await this.buildStudentRowsBatch(students, query, schoolId);

      const response: {
        data: FinanceStudentRow[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
        summary?: FinanceSchoolSummary;
      } = {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };

      if (query.includeSummary) {
        response.summary = await this.buildSchoolSummary(schoolId, query);
      }

      return response;
    }

    const students = await qb.getMany();
    const allRows = (await this.buildStudentRowsBatch(students, query, schoolId)).filter(
      (row) => this.matchesBalanceStatus(row, balanceStatus),
    );

    const total = allRows.length;
    const start = (page - 1) * limit;
    const data = allRows.slice(start, start + limit);
    const summary = query.includeSummary
      ? this.summarizeRows(allRows)
      : undefined;

    return {
      data,
      ...(summary ? { summary } : {}),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getSchoolSummary(
    schoolId: string,
    query: FinanceQueryDto,
  ): Promise<FinanceSchoolSummary> {
    return this.buildSchoolSummary(schoolId, query);
  }

  async listClasses(schoolId: string, query: FinanceQueryDto = {}) {
    const classes = await this.classLevelRepository.find({
      where: { school: { id: schoolId } },
      order: { name: 'ASC' },
    });

    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.classLevels', 'classLevel')
      .leftJoinAndSelect('student.school', 'school')
      .where('school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = false')
      .getMany();

    const rows = await this.buildStudentRowsBatch(students, query, schoolId);
    const rowByStudentId = new Map(rows.map((row) => [row.studentId, row]));

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
      const classStudents = students.filter((student) =>
        (student.classLevels ?? []).some((level) => level.id === cls.id),
      );

      let totalPayable = 0;
      let totalPaid = 0;
      let outstanding = 0;
      let arrears = 0;
      let prepayment = 0;

      for (const student of classStudents) {
        const row = rowByStudentId.get(student.id);
        if (!row) {
          continue;
        }
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
        studentCount: classStudents.length,
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

  async getStudentDetail(
    schoolId: string,
    studentId: string,
    query: FinanceStudentDetailQueryDto = {},
  ) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, school: { id: schoolId }, isArchived: false },
      relations: ['classLevels', 'school'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const paymentQuery: PaymentQueryDto = {
      page: query.paymentPage ?? 1,
      limit: query.paymentLimit ?? 15,
      status: PaymentTransactionStatus.PAID,
      academicTermId: query.academicTermId?.trim() || undefined,
      academicCalendarId: query.academicCalendarId?.trim() || undefined,
    };

    const [financeSnapshot, paymentsResult] = await Promise.all([
      this.buildStudentFinanceSnapshot(student, query, schoolId),
      this.paymentsService.listRecentStudentPaymentsForFinance(
        student.id,
        paymentQuery,
      ),
    ]);

    const primaryClass = student.classLevels?.[0] ?? null;
    const studentIdentity = {
      studentId: student.id,
      studentCode: student.studentId,
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      classLevelId: primaryClass?.id ?? null,
      className: primaryClass?.name ?? null,
    };

    const recentPayments = (paymentsResult.data ?? [])
      .filter((tx) => tx.provider !== PaymentProvider.INTERNAL_CREDIT)
      .map((tx) => this.mapRecentPayment(tx, student));

    return {
      student: studentIdentity,
      totals: {
        ...financeSnapshot.scopedTotals,
        hasPendingBalance: financeSnapshot.scopedTotals.netBalance > 0,
      },
      feeLines: financeSnapshot.filteredFeeLines,
      recentPayments,
      paymentMeta: paymentsResult.meta,
    };
  }

  private mapRecentPayment(transaction: PaymentTransaction, student: Student) {
    const period = this.paymentsService.getPaymentPeriodSummary(transaction);
    return {
      id: transaction.id,
      date: transaction.paymentDate ?? transaction.createdAt,
      amount:
        transaction.amountAfterCharges > 0
          ? transaction.amountAfterCharges
          : transaction.amount,
      status: transaction.status,
      channel: transaction.paymentMethod ?? transaction.provider,
      studentName: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
      studentCode: student.studentId,
      sessionId: transaction.sessionId,
      periodLabel: period.periodLabel,
      periodLabels: period.periodLabels,
      academicTermId: period.academicTermId,
      academicCalendarId: period.academicCalendarId,
      appliedFees: period.appliedFees,
    };
  }

  private filterFeeLines<
    T extends {
      academicTermId?: string | null;
      academicCalendarId?: string | null;
    },
  >(lines: T[], query?: PeriodFilterQuery): T[] {
    const termId = query?.academicTermId?.trim();
    const calendarId = query?.academicCalendarId?.trim();
    if (!termId && !calendarId) {
      return lines;
    }
    return lines.filter((line) => {
      if (termId && line.academicTermId !== termId) {
        return false;
      }
      if (calendarId && line.academicCalendarId !== calendarId) {
        return false;
      }
      return true;
    });
  }

  private hasPeriodFilter(query?: PeriodFilterQuery): boolean {
    return Boolean(
      query?.academicTermId?.trim() || query?.academicCalendarId?.trim(),
    );
  }

  private computeTotalsFromLines(
    lines: FinanceObligationLine[],
    prepayment = 0,
  ): StudentFinanceTotals {
    const round = (n: number) => Math.round(n * 100) / 100;
    const totalPayable = round(
      lines.reduce((sum, line) => sum + line.amountDue, 0),
    );
    const totalPaid = round(lines.reduce((sum, line) => sum + line.paid, 0));
    const outstanding = round(
      lines.reduce((sum, line) => sum + line.outstanding, 0),
    );
    const arrears = round(
      lines
        .filter((line) => line.isArrear)
        .reduce((sum, line) => sum + line.outstanding, 0),
    );
    const roundedPrepayment = round(prepayment);
    const netBalance = round(outstanding - roundedPrepayment);
    const today = new Date().toISOString().slice(0, 10);
    let nextDueDate: string | null = null;
    for (const line of lines) {
      if (line.outstanding <= 0 || !line.dueDate) {
        continue;
      }
      if (line.dueDate >= today) {
        if (!nextDueDate || line.dueDate < nextDueDate) {
          nextDueDate = line.dueDate;
        }
      }
    }
    return {
      totalPayable,
      totalPaid,
      outstanding,
      arrears,
      prepayment: roundedPrepayment,
      netBalance,
      nextDueDate,
    };
  }

  private async buildStudentFinanceSnapshot(
    student: Student,
    query: PeriodFilterQuery,
    schoolId: string,
  ): Promise<{
    filteredFeeLines: FinanceObligationLine[];
    scopedTotals: StudentFinanceTotals;
  }> {
    const context = await this.loadFinanceBatchContext(schoolId, [student.id]);
    const applicableFees =
      this.paymentsService.filterApplicableFeeStructuresForStudent(
        student,
        context.schoolFees,
        { ussdEligibleOnly: false },
      );
    const prepayment = context.creditsByStudentId.get(student.id) ?? 0;
    const { lines, totals: globalTotals } =
      this.feeObligationService.computeFinanceLines(
        applicableFees,
        context.obligationsByStudentId.get(student.id) ?? [],
        context.paidByObligationId,
        prepayment,
        context.arrearsCutoff,
      );
    const filteredFeeLines = this.filterFeeLines(lines, query);
    const prepaymentForScope = this.hasPeriodFilter(query) ? 0 : prepayment;
    const scopedTotals = this.hasPeriodFilter(query)
      ? this.computeTotalsFromLines(filteredFeeLines, prepaymentForScope)
      : globalTotals;

    return { filteredFeeLines, scopedTotals };
  }

  private async loadFinanceBatchContext(
    schoolId: string,
    studentIds: string[],
  ): Promise<{
    schoolFees: FeeStructure[];
    obligationsByStudentId: Map<string, StudentFeeObligation[]>;
    paidByObligationId: Map<string, number>;
    creditsByStudentId: Map<string, number>;
    arrearsCutoff: string | null;
  }> {
    const schoolFees =
      await this.paymentsService.getSchoolFeeStructures(schoolId);
    const obligations =
      studentIds.length === 0
        ? []
        : await this.feeObligationService.findObligationsForStudents(
            studentIds,
          );
    const paidByObligationId =
      await this.feeObligationService.sumPaidByObligationIds(
        obligations.map((ob) => ob.id),
      );
    const creditsByStudentId =
      await this.studentCreditService.getAvailableCreditsByStudentIds(
        studentIds,
      );
    const arrearsCutoff =
      await this.feeObligationService.getArrearsCutoffDate(schoolId);

    const obligationsByStudentId = new Map<string, StudentFeeObligation[]>();
    for (const obligation of obligations) {
      const studentId = obligation.student?.id;
      if (!studentId) {
        continue;
      }
      const bucket = obligationsByStudentId.get(studentId) ?? [];
      bucket.push(obligation);
      obligationsByStudentId.set(studentId, bucket);
    }

    return {
      schoolFees,
      obligationsByStudentId,
      paidByObligationId,
      creditsByStudentId,
      arrearsCutoff,
    };
  }

  private async buildStudentRowsBatch(
    students: Student[],
    query: PeriodFilterQuery | undefined,
    schoolId: string,
  ): Promise<FinanceStudentRow[]> {
    if (students.length === 0) {
      return [];
    }

    const context = await this.loadFinanceBatchContext(
      schoolId,
      students.map((student) => student.id),
    );

    return students.map((student) => {
      const applicableFees =
        this.paymentsService.filterApplicableFeeStructuresForStudent(
          student,
          context.schoolFees,
          { ussdEligibleOnly: false },
        );
      const prepayment = context.creditsByStudentId.get(student.id) ?? 0;
      const { lines, totals: globalTotals } =
        this.feeObligationService.computeFinanceLines(
          applicableFees,
          context.obligationsByStudentId.get(student.id) ?? [],
          context.paidByObligationId,
          prepayment,
          context.arrearsCutoff,
        );
      const filteredLines = this.filterFeeLines(lines, query);
      const totals = this.hasPeriodFilter(query)
        ? this.computeTotalsFromLines(filteredLines, prepayment)
        : globalTotals;

      return this.toFinanceStudentRow(student, totals);
    });
  }

  private toFinanceStudentRow(
    student: Student,
    totals: StudentFinanceTotals,
  ): FinanceStudentRow {
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
    return this.buildStudentRowsBatch(students, query, schoolId);
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
