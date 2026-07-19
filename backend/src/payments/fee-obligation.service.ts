import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { StudentFeeObligation } from './entities/student-fee-obligation.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import {
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';

/** Max calendar days of daily fee lines to materialise (lookback from today). */
export const DAILY_FEE_LOOKBACK_MAX_DAYS = 120;

export type OutstandingFeeLine = {
  id: string;
  feeStructureId: string;
  feeTitle: string;
  outstanding: number;
  periodLabel: string;
  periodEnd: string;
  periodStart: string;
};

export type ObligationAllocationRow = {
  obligation: StudentFeeObligation;
  fee: FeeStructure;
  outstanding: number;
  periodLabel: string;
};

type AcademicContext = {
  calendar: AcademicCalendar;
  /** First day of the school year group that contains today. */
  legacyCutover: string;
  /** Envelope for the school year containing today (min/max term dates in that group). */
  envelopeStart: string;
  envelopeEnd: string;
  /** Start of the academic term containing today (fallback: envelopeStart). */
  currentTermStart: string;
};

export type FinanceObligationLine = {
  obligationId: string;
  feeStructureId: string;
  feeTitle: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  paid: number;
  outstanding: number;
  isArrear: boolean;
  dueDate: string | null;
};

export type StudentFinanceTotals = {
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
  arrears: number;
  prepayment: number;
  netBalance: number;
  nextDueDate: string | null;
};

@Injectable()
export class FeeObligationService {
  private readonly logger = new Logger(FeeObligationService.name);

  constructor(
    @InjectRepository(StudentFeeObligation)
    private readonly obligationRepository: Repository<StudentFeeObligation>,
    @InjectRepository(AcademicCalendar)
    private readonly calendarRepository: Repository<AcademicCalendar>,
    @InjectRepository(PaymentAllocation)
    private readonly paymentAllocationRepository: Repository<PaymentAllocation>,
  ) {}

  normalizeCadence(feeType: string | undefined | null): string {
    const t = (feeType ?? '').trim().toLowerCase();
    if (t === 'daily' || t === 'monthly' || t === 'term' || t === 'yearly') {
      return t;
    }
    return 'term';
  }

  /**
   * Ensure period obligations exist for this student (idempotent).
   * Legacy buckets are only created by the one-time backfill, not here.
   */
  async ensureObligationsForStudent(
    student: Student,
    applicableFees: FeeStructure[],
  ): Promise<void> {
    if (!student.school?.id) {
      return;
    }

    const ctx = await this.resolveAcademicContext(student.school.id);
    const studentFrom = this.toIsoDate(student.createdAt);

    for (const fee of applicableFees) {
      const cadence = this.normalizeCadence(fee.feeType);
      await this.ensureLegacyIfNeeded(student, fee);

      if (!ctx) {
        if (cadence !== 'term' && cadence !== 'yearly' && cadence !== 'monthly' && cadence !== 'daily') {
          continue;
        }
        this.logger.debug(
          `Skipping period obligations for fee ${fee.id}: no academic calendar`,
        );
        continue;
      }

      if (cadence === 'term') {
        await this.ensureTermObligations(student, fee, ctx, studentFrom);
      } else if (cadence === 'yearly') {
        await this.ensureYearlyObligations(student, fee, ctx, studentFrom);
      } else if (cadence === 'monthly') {
        await this.ensureMonthlyObligations(student, fee, ctx, studentFrom);
      } else if (cadence === 'daily') {
        await this.ensureDailyObligations(student, fee, ctx, studentFrom);
      }
    }
  }

  /**
   * Legacy row for pre-cutover / migrated payments (amountDue set by backfill).
   * Only creates when old allocations still have null obligation (pre-backfill edge).
   */
  private async ensureLegacyIfNeeded(
    student: Student,
    fee: FeeStructure,
  ): Promise<void> {
    const existing = await this.obligationRepository.findOne({
      where: {
        student: { id: student.id },
        feeStructure: { id: fee.id },
        isLegacy: true,
      },
    });
    if (existing) {
      return;
    }

    const orphanCount = await this.paymentAllocationRepository
      .createQueryBuilder('a')
      .innerJoin('a.student', 'stu')
      .innerJoin('a.feeStructure', 'fee')
      .innerJoin('a.transaction', 't')
      .where('stu.id = :sid', { sid: student.id })
      .andWhere('fee.id = :fid', { fid: fee.id })
      .andWhere('t.status = :st', { st: PaymentTransactionStatus.PAID })
      .andWhere('a.obligationId IS NULL')
      .getCount();

    if (orphanCount === 0) {
      return;
    }

    await this.obligationRepository.save(
      this.obligationRepository.create({
        student,
        feeStructure: fee,
        periodKey: `legacy:${fee.id}`,
        periodStart: '1900-01-01',
        periodEnd: '2099-12-31',
        amountDue: fee.amount,
        isLegacy: true,
        academicTerm: null,
        academicCalendar: null,
      }),
    );
  }

  private async ensureTermObligations(
    student: Student,
    fee: FeeStructure,
    ctx: AcademicContext,
    studentFrom: string,
  ): Promise<void> {
    const terms = ctx.calendar.terms ?? [];
    for (const term of terms) {
      if (this.cmpIso(term.endDate, ctx.legacyCutover) < 0) {
        continue;
      }
      if (this.cmpIso(studentFrom, term.endDate) > 0) {
        continue;
      }
      const periodKey = `term:${term.id}`;
      const exists = await this.obligationRepository.findOne({
        where: {
          student: { id: student.id },
          feeStructure: { id: fee.id },
          periodKey,
        },
      });
      if (exists) {
        continue;
      }
      await this.obligationRepository.save(
        this.obligationRepository.create({
          student,
          feeStructure: fee,
          periodKey,
          periodStart: term.startDate,
          periodEnd: term.endDate,
          amountDue: fee.amount,
          isLegacy: false,
          academicTerm: term,
          academicCalendar: ctx.calendar,
        }),
      );
    }
  }

  private async ensureYearlyObligations(
    student: Student,
    fee: FeeStructure,
    ctx: AcademicContext,
    studentFrom: string,
  ): Promise<void> {
    const groups = this.groupTermsBySchoolYear(ctx.calendar.terms ?? []);
    for (const g of groups) {
      if (this.cmpIso(g.end, ctx.legacyCutover) < 0) {
        continue;
      }
      if (this.cmpIso(studentFrom, g.end) > 0) {
        continue;
      }
      const periodKey = `year:${ctx.calendar.id}:${g.key}`;
      const exists = await this.obligationRepository.findOne({
        where: {
          student: { id: student.id },
          feeStructure: { id: fee.id },
          periodKey,
        },
      });
      if (exists) {
        continue;
      }
      await this.obligationRepository.save(
        this.obligationRepository.create({
          student,
          feeStructure: fee,
          periodKey,
          periodStart: g.start,
          periodEnd: g.end,
          amountDue: fee.amount,
          isLegacy: false,
          academicTerm: null,
          academicCalendar: ctx.calendar,
        }),
      );
    }
  }

  private async ensureMonthlyObligations(
    student: Student,
    fee: FeeStructure,
    ctx: AcademicContext,
    studentFrom: string,
  ): Promise<void> {
    const rangeStart = this.maxIso(
      ctx.legacyCutover,
      studentFrom,
      ctx.envelopeStart,
    );
    const today = this.todayIso();
    const endCap = this.minIso(today, ctx.envelopeEnd);

    if (this.cmpIso(rangeStart, endCap) > 0) {
      return;
    }

    for (const { start, end } of this.iterateMonthsOverlapping(rangeStart, endCap)) {
      const periodKey = `month:${start.slice(0, 7)}`;
      const exists = await this.obligationRepository.findOne({
        where: {
          student: { id: student.id },
          feeStructure: { id: fee.id },
          periodKey,
        },
      });
      if (exists) {
        continue;
      }
      await this.obligationRepository.save(
        this.obligationRepository.create({
          student,
          feeStructure: fee,
          periodKey,
          periodStart: start,
          periodEnd: end,
          amountDue: fee.amount,
          isLegacy: false,
          academicTerm: null,
          academicCalendar: ctx.calendar,
        }),
      );
    }
  }

  private async ensureDailyObligations(
    student: Student,
    fee: FeeStructure,
    ctx: AcademicContext,
    studentFrom: string,
  ): Promise<void> {
    const today = this.todayIso();
    const lookbackStart = this.addDays(today, -DAILY_FEE_LOOKBACK_MAX_DAYS);
    let d = this.maxIso(
      ctx.legacyCutover,
      studentFrom,
      ctx.envelopeStart,
      lookbackStart,
    );
    const endCap = this.minIso(today, ctx.envelopeEnd);

    while (this.cmpIso(d, endCap) <= 0) {
      const periodKey = `day:${d}`;
      const exists = await this.obligationRepository.findOne({
        where: {
          student: { id: student.id },
          feeStructure: { id: fee.id },
          periodKey,
        },
      });
      if (!exists) {
        await this.obligationRepository.save(
          this.obligationRepository.create({
            student,
            feeStructure: fee,
            periodKey,
            periodStart: d,
            periodEnd: d,
            amountDue: fee.amount,
            isLegacy: false,
            academicTerm: null,
            academicCalendar: ctx.calendar,
          }),
        );
      }
      d = this.addDays(d, 1);
    }
  }

  async sumPaidForObligation(
    studentId: string,
    obligationId: string,
  ): Promise<number> {
    const row = await this.paymentAllocationRepository
      .createQueryBuilder('allocation')
      .leftJoin('allocation.obligation', 'obligation')
      .leftJoin('allocation.student', 'student')
      .leftJoin('allocation.transaction', 'transaction')
      .where('obligation.id = :oid', { oid: obligationId })
      .andWhere('student.id = :sid', { sid: studentId })
      .andWhere('transaction.status = :status', {
        status: PaymentTransactionStatus.PAID,
      })
      .select('COALESCE(SUM(allocation.allocatedAmount), 0)', 'sum')
      .getRawOne<{ sum: string }>();

    return Number(row?.sum ?? 0);
  }

  async getOutstandingLines(
    student: Student,
    applicableFees: FeeStructure[],
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<OutstandingFeeLine[]> {
    await this.ensureObligationsForStudent(student, applicableFees);

    const ussdOnly = options?.ussdEligibleOnly ?? false;
    const feeIds = new Set(applicableFees.map((f) => f.id));
    const feeById = new Map(applicableFees.map((f) => [f.id, f]));

    const obligations = await this.obligationRepository.find({
      where: { student: { id: student.id } },
      relations: ['feeStructure', 'feeStructure.classLevels', 'academicTerm'],
    });

    const rows: OutstandingFeeLine[] = [];
    for (const ob of obligations) {
      const fee = ob.feeStructure;
      if (!feeIds.has(fee.id)) {
        continue;
      }
      if (ussdOnly && fee.allowUssdPayment === false) {
        continue;
      }
      const paid = await this.sumPaidForObligation(student.id, ob.id);
      const outstanding = Math.max(0, ob.amountDue - paid);
      if (outstanding <= 0) {
        continue;
      }
      rows.push({
        id: ob.id,
        feeStructureId: fee.id,
        feeTitle: (fee.feeTitle ?? 'Fee').trim() || 'Fee',
        outstanding: Math.round(outstanding * 100) / 100,
        periodLabel: this.formatPeriodLabel(ob),
        periodEnd: ob.periodEnd,
        periodStart: ob.periodStart,
      });
    }

    rows.sort((a, b) => {
      const c1 = this.cmpIso(a.periodEnd, b.periodEnd);
      if (c1 !== 0) {
        return c1;
      }
      const c2 = this.cmpIso(a.periodStart, b.periodStart);
      if (c2 !== 0) {
        return c2;
      }
      const fa = feeById.get(a.feeStructureId);
      const fb = feeById.get(b.feeStructureId);
      const da = fa?.dueDate ?? '';
      const db = fb?.dueDate ?? '';
      if (da !== db) {
        return da.localeCompare(db);
      }
      return a.feeStructureId.localeCompare(b.feeStructureId);
    });

    return rows;
  }

  async getTotalOutstanding(
    student: Student,
    applicableFees: FeeStructure[],
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<number> {
    const lines = await this.getOutstandingLines(
      student,
      applicableFees,
      options,
    );
    const t = lines.reduce((s, r) => s + r.outstanding, 0);
    return Math.round(t * 100) / 100;
  }

  /**
   * Ordered obligations with positive outstanding for allocation / simulation.
   */
  async getOrderedOutstandingObligations(
    student: Student,
    applicableFees: FeeStructure[],
    options?: {
      ussdEligibleOnly?: boolean;
      prioritizeObligationId?: string | null;
      prioritizeFeeStructureId?: string | null;
    },
  ): Promise<ObligationAllocationRow[]> {
    const lines = await this.getOutstandingLines(
      student,
      applicableFees,
      { ussdEligibleOnly: options?.ussdEligibleOnly },
    );
    const obIds = lines.map((l) => l.id);
    if (obIds.length === 0) {
      return [];
    }

    const obligations = await this.obligationRepository.find({
      where: { id: In(obIds) },
      relations: ['feeStructure'],
    });
    const obMap = new Map(obligations.map((o) => [o.id, o]));
    const feeById = new Map(applicableFees.map((f) => [f.id, f]));

    let ordered: ObligationAllocationRow[] = lines.map((l) => {
      const obligation = obMap.get(l.id)!;
      const fee = feeById.get(l.feeStructureId)!;
      return {
        obligation,
        fee,
        outstanding: l.outstanding,
        periodLabel: l.periodLabel,
      };
    });

    const po = options?.prioritizeObligationId;
    if (po) {
      const idx = ordered.findIndex((r) => r.obligation.id === po);
      if (idx > 0) {
        const [pick] = ordered.splice(idx, 1);
        ordered = [pick, ...ordered];
      }
    } else if (options?.prioritizeFeeStructureId) {
      const fid = options.prioritizeFeeStructureId;
      const head = ordered.filter((r) => r.fee.id === fid);
      const tail = ordered.filter((r) => r.fee.id !== fid);
      ordered = [...head, ...tail];
    }

    return ordered;
  }

  async findObligationByIdForStudent(
    obligationId: string,
    studentId: string,
  ): Promise<StudentFeeObligation | null> {
    return this.obligationRepository.findOne({
      where: { id: obligationId, student: { id: studentId } },
      relations: ['feeStructure'],
    });
  }

  formatPeriodLabel(ob: StudentFeeObligation): string {
    if (ob.isLegacy) {
      return 'Previous balance';
    }
    const key = ob.periodKey;
    if (key.startsWith('term:') && ob.academicTerm) {
      return ob.academicTerm.termName;
    }
    if (key.startsWith('month:')) {
      const m = key.slice('month:'.length);
      return m;
    }
    if (key.startsWith('day:')) {
      return key.slice('day:'.length);
    }
    if (key.startsWith('year:')) {
      const parts = key.split(':');
      const yk = parts[parts.length - 1] ?? '';
      return `Year ${yk}`;
    }
    return ob.periodStart;
  }

  /**
   * Start of the current academic term for arrears classification.
   * Arrears = outstanding on obligations with periodEnd &lt; this date.
   */
  async getArrearsCutoffDate(schoolId: string): Promise<string | null> {
    const ctx = await this.resolveAcademicContext(schoolId);
    return ctx?.currentTermStart ?? null;
  }

  /**
   * All obligation lines for finance (including fully paid), with arrears flags.
   */
  async getFinanceLinesForStudent(
    student: Student,
    applicableFees: FeeStructure[],
    options?: { ensure?: boolean; prepayment?: number },
  ): Promise<{ lines: FinanceObligationLine[]; totals: StudentFinanceTotals }> {
    if (options?.ensure !== false) {
      await this.ensureObligationsForStudent(student, applicableFees);
    }

    const feeIds = new Set(applicableFees.map((f) => f.id));
    const feeById = new Map(applicableFees.map((f) => [f.id, f]));
    const arrearsCutoff = student.school?.id
      ? await this.getArrearsCutoffDate(student.school.id)
      : null;

    const obligations = await this.obligationRepository.find({
      where: { student: { id: student.id } },
      relations: ['feeStructure', 'feeStructure.classLevels', 'academicTerm'],
    });

    const lines: FinanceObligationLine[] = [];
    for (const ob of obligations) {
      const fee = ob.feeStructure;
      if (!fee || !feeIds.has(fee.id)) {
        continue;
      }
      const paid = await this.sumPaidForObligation(student.id, ob.id);
      const outstanding = Math.max(
        0,
        Math.round((ob.amountDue - paid) * 100) / 100,
      );
      const isArrear =
        outstanding > 0 &&
        !!arrearsCutoff &&
        this.cmpIso(ob.periodEnd, arrearsCutoff) < 0;

      lines.push({
        obligationId: ob.id,
        feeStructureId: fee.id,
        feeTitle: (fee.feeTitle ?? 'Fee').trim() || 'Fee',
        periodLabel: this.formatPeriodLabel(ob),
        periodStart: ob.periodStart,
        periodEnd: ob.periodEnd,
        amountDue: Math.round(ob.amountDue * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        outstanding,
        isArrear,
        dueDate: fee.dueDate ?? null,
      });
    }

    lines.sort((a, b) => {
      const c1 = this.cmpIso(a.periodEnd, b.periodEnd);
      if (c1 !== 0) {
        return c1;
      }
      const c2 = this.cmpIso(a.periodStart, b.periodStart);
      if (c2 !== 0) {
        return c2;
      }
      return a.feeStructureId.localeCompare(b.feeStructureId);
    });

    const totalPayable = Math.round(
      lines.reduce((s, l) => s + l.amountDue, 0) * 100,
    ) / 100;
    const totalPaid = Math.round(
      lines.reduce((s, l) => s + l.paid, 0) * 100,
    ) / 100;
    const outstanding = Math.round(
      lines.reduce((s, l) => s + l.outstanding, 0) * 100,
    ) / 100;
    const arrears = Math.round(
      lines.filter((l) => l.isArrear).reduce((s, l) => s + l.outstanding, 0) *
        100,
    ) / 100;
    const prepayment = Math.round((options?.prepayment ?? 0) * 100) / 100;
    const netBalance = Math.round((outstanding - prepayment) * 100) / 100;

    const today = this.todayIso();
    let nextDueDate: string | null = null;
    for (const l of lines) {
      if (l.outstanding <= 0 || !l.dueDate) {
        continue;
      }
      if (this.cmpIso(l.dueDate, today) < 0) {
        continue;
      }
      if (!nextDueDate || this.cmpIso(l.dueDate, nextDueDate) < 0) {
        nextDueDate = l.dueDate;
      }
    }
    // If all due dates are past but still outstanding, use earliest dueDate among open lines
    if (!nextDueDate) {
      for (const l of lines) {
        if (l.outstanding <= 0 || !l.dueDate) {
          continue;
        }
        if (!nextDueDate || this.cmpIso(l.dueDate, nextDueDate) < 0) {
          nextDueDate = l.dueDate;
        }
      }
    }

    return {
      lines,
      totals: {
        totalPayable,
        totalPaid,
        outstanding,
        arrears,
        prepayment,
        netBalance,
        nextDueDate,
      },
    };
  }

  private async resolveAcademicContext(
    schoolId: string,
  ): Promise<AcademicContext | null> {
    const calendars = await this.calendarRepository.find({
      where: { school: { id: schoolId } },
      relations: ['terms'],
      order: { id: 'ASC' },
    });

    if (calendars.length === 0) {
      return null;
    }

    const today = this.todayIso();
    let chosen: AcademicCalendar | null = null;

    outer: for (const cal of calendars) {
      for (const term of cal.terms ?? []) {
        if (
          this.cmpIso(term.startDate, today) <= 0 &&
          this.cmpIso(today, term.endDate) <= 0
        ) {
          chosen = cal;
          break outer;
        }
      }
    }

    if (!chosen) {
      let best: { cal: AcademicCalendar; diff: number } | null = null;
      for (const cal of calendars) {
        for (const term of cal.terms ?? []) {
          const startMs = new Date(`${term.startDate}T12:00:00Z`).getTime();
          const tMs = new Date(`${today}T12:00:00Z`).getTime();
          const diff = startMs - tMs;
          if (diff >= 0) {
            if (!best || diff < best.diff) {
              best = { cal, diff };
            }
          }
        }
      }
      if (best) {
        chosen = best.cal;
      }
    }

    if (!chosen) {
      let latest: { cal: AcademicCalendar; end: string } | null = null;
      for (const cal of calendars) {
        for (const term of cal.terms ?? []) {
          if (!latest || this.cmpIso(term.endDate, latest.end) > 0) {
            latest = { cal, end: term.endDate };
          }
        }
      }
      chosen = latest?.cal ?? null;
    }

    if (!chosen || !(chosen.terms && chosen.terms.length)) {
      return null;
    }

    const groups = this.groupTermsBySchoolYear(chosen.terms);
    let groupWithToday = groups.find(
      (g) =>
        this.cmpIso(g.start, today) <= 0 && this.cmpIso(today, g.end) <= 0,
    );
    if (!groupWithToday && groups.length > 0) {
      groupWithToday = groups.reduce((a, b) =>
        this.cmpIso(a.end, b.end) > 0 ? a : b,
      );
    }
    if (!groupWithToday) {
      return null;
    }

    let currentTermStart = groupWithToday.start;
    for (const term of chosen.terms ?? []) {
      if (
        this.cmpIso(term.startDate, today) <= 0 &&
        this.cmpIso(today, term.endDate) <= 0
      ) {
        currentTermStart = term.startDate;
        break;
      }
    }

    return {
      calendar: chosen,
      legacyCutover: groupWithToday.start,
      envelopeStart: groupWithToday.start,
      envelopeEnd: groupWithToday.end,
      currentTermStart,
    };
  }

  private groupTermsBySchoolYear(
    terms: AcademicTerm[],
  ): { key: string; start: string; end: string }[] {
    const map = new Map<string, AcademicTerm[]>();
    for (const term of terms) {
      const key = this.schoolYearKeyFromIso(term.startDate);
      const list = map.get(key) ?? [];
      list.push(term);
      map.set(key, list);
    }
    const out: { key: string; start: string; end: string }[] = [];
    for (const [key, list] of map.entries()) {
      let start = list[0].startDate;
      let end = list[0].endDate;
      for (const t of list) {
        if (this.cmpIso(t.startDate, start) < 0) {
          start = t.startDate;
        }
        if (this.cmpIso(t.endDate, end) > 0) {
          end = t.endDate;
        }
      }
      out.push({ key, start, end });
    }
    out.sort((a, b) => this.cmpIso(a.start, b.start));
    return out;
  }

  private schoolYearKeyFromIso(iso: string): string {
    const d = new Date(`${iso}T12:00:00Z`);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const start = m >= 8 ? y : y - 1;
    return `${start}-${start + 1}`;
  }

  private iterateMonthsOverlapping(
    rangeStart: string,
    rangeEnd: string,
  ): { start: string; end: string }[] {
    const out: { start: string; end: string }[] = [];
    let y = parseInt(rangeStart.slice(0, 4), 10);
    let m = parseInt(rangeStart.slice(5, 7), 10);
    const endY = parseInt(rangeEnd.slice(0, 4), 10);
    const endM = parseInt(rangeEnd.slice(5, 7), 10);

    while (y < endY || (y === endY && m <= endM)) {
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const ms = `${y}-${String(m).padStart(2, '0')}-01`;
      const me = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const clipStart = this.maxIso(ms, rangeStart);
      const clipEnd = this.minIso(me, rangeEnd);
      if (this.cmpIso(clipStart, clipEnd) <= 0) {
        out.push({ start: clipStart, end: clipEnd });
      }
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return out;
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private todayIso(): string {
    return this.toIsoDate(new Date());
  }

  private cmpIso(a: string, b: string): number {
    return a.localeCompare(b);
  }

  private maxIso(...xs: string[]): string {
    return xs.reduce((m, x) => (this.cmpIso(x, m) > 0 ? x : m));
  }

  private minIso(...xs: string[]): string {
    return xs.reduce((m, x) => (this.cmpIso(x, m) < 0 ? x : m));
  }

  private addDays(iso: string, delta: number): string {
    const t = new Date(`${iso}T12:00:00Z`).getTime() + delta * 86400000;
    return this.toIsoDate(new Date(t));
  }
}
