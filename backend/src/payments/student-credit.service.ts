import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Student } from 'src/student/student.entity';
import { School } from 'src/school/school.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { StudentCreditBalance } from './entities/student-credit-balance.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import {
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { FeeObligationService } from './fee-obligation.service';

@Injectable()
export class StudentCreditService {
  private readonly logger = new Logger(StudentCreditService.name);

  constructor(
    @InjectRepository(StudentCreditBalance)
    private readonly creditRepository: Repository<StudentCreditBalance>,
    @InjectRepository(PaymentAllocation)
    private readonly paymentAllocationRepository: Repository<PaymentAllocation>,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    private readonly feeObligationService: FeeObligationService,
  ) {}

  async getAvailableCredit(studentId: string): Promise<number> {
    const row = await this.creditRepository.findOne({
      where: { student: { id: studentId } },
    });
    return Math.round((row?.availableCredit ?? 0) * 100) / 100;
  }

  async getOrCreateBalance(
    student: Student,
    school: School,
    manager?: EntityManager,
  ): Promise<StudentCreditBalance> {
    const repo = manager
      ? manager.getRepository(StudentCreditBalance)
      : this.creditRepository;

    let row = await repo.findOne({
      where: { student: { id: student.id } },
      relations: ['student', 'school'],
    });
    if (row) {
      return row;
    }

    row = repo.create({
      student,
      school,
      availableCredit: 0,
    });
    return repo.save(row);
  }

  async addCredit(
    student: Student,
    school: School,
    amount: number,
    manager?: EntityManager,
  ): Promise<number> {
    const add = Math.round(amount * 100) / 100;
    if (add <= 0) {
      return this.getAvailableCredit(student.id);
    }

    const repo = manager
      ? manager.getRepository(StudentCreditBalance)
      : this.creditRepository;

    const row = await this.getOrCreateBalance(student, school, manager);
    row.availableCredit = Math.round((row.availableCredit + add) * 100) / 100;
    await repo.save(row);
    return row.availableCredit;
  }

  /**
   * Apply wallet credit to open obligations (oldest / due-first).
   * Creates an INTERNAL_CREDIT PAID transaction + obligation allocations so
   * sumPaidForObligation stays consistent.
   */
  async applyAvailableCredit(
    student: Student,
    applicableFees: FeeStructure[],
    options?: {
      ussdEligibleOnly?: boolean;
      manager?: EntityManager;
    },
  ): Promise<number> {
    if (!student.school?.id || applicableFees.length === 0) {
      return 0;
    }

    const manager = options?.manager;
    const creditRepo = manager
      ? manager.getRepository(StudentCreditBalance)
      : this.creditRepository;
    const txRepo = manager
      ? manager.getRepository(PaymentTransaction)
      : this.paymentTransactionRepository;
    const allocationRepo = manager
      ? manager.getRepository(PaymentAllocation)
      : this.paymentAllocationRepository;

    const balance = await this.getOrCreateBalance(
      student,
      student.school,
      manager,
    );
    let remainingCredit = Math.round((balance.availableCredit ?? 0) * 100) / 100;
    if (remainingCredit <= 0) {
      return 0;
    }

    const ordered =
      await this.feeObligationService.getOrderedOutstandingObligations(
        student,
        applicableFees,
        { ussdEligibleOnly: options?.ussdEligibleOnly ?? false },
      );
    if (ordered.length === 0) {
      return 0;
    }

    const virtualOut = new Map<string, number>();
    for (const row of ordered) {
      virtualOut.set(row.obligation.id, row.outstanding);
    }

    type Planned = {
      obligation: (typeof ordered)[0]['obligation'];
      fee: FeeStructure;
      amount: number;
    };
    const planned: Planned[] = [];

    for (const row of ordered) {
      if (remainingCredit <= 0) {
        break;
      }
      const out = virtualOut.get(row.obligation.id) ?? 0;
      if (out <= 0) {
        continue;
      }
      const take = Math.round(Math.min(remainingCredit, out) * 100) / 100;
      if (take <= 0) {
        continue;
      }
      planned.push({ obligation: row.obligation, fee: row.fee, amount: take });
      virtualOut.set(
        row.obligation.id,
        Math.round((out - take) * 100) / 100,
      );
      remainingCredit = Math.round((remainingCredit - take) * 100) / 100;
    }

    if (planned.length === 0) {
      return 0;
    }

    const appliedTotal = Math.round(
      planned.reduce((s, p) => s + p.amount, 0) * 100,
    ) / 100;

    const creditTx = await txRepo.save(
      txRepo.create({
        sessionId: `CREDIT-${randomUUID()}`,
        orderId: null,
        hubtelTransactionId: null,
        networkTransactionId: null,
        provider: PaymentProvider.INTERNAL_CREDIT,
        status: PaymentTransactionStatus.PAID,
        providerStatus: 'CREDIT_APPLIED',
        mobile: null,
        currency: 'GHS',
        amount: appliedTotal,
        charges: 0,
        amountAfterCharges: appliedTotal,
        isFulfilled: true,
        paymentMethod: 'PREPAYMENT_CREDIT',
        paymentDate: new Date(),
        school: student.school,
        student,
      }),
    );

    let allocationOrder = 1;
    for (const p of planned) {
      await allocationRepo.save(
        allocationRepo.create({
          transaction: creditTx,
          student,
          feeStructure: p.fee,
          obligation: p.obligation,
          allocatedAmount: p.amount,
          allocationOrder: allocationOrder++,
        }),
      );
    }

    balance.availableCredit =
      Math.round((balance.availableCredit - appliedTotal) * 100) / 100;
    if (balance.availableCredit < 0) {
      balance.availableCredit = 0;
    }
    await creditRepo.save(balance);

    this.logger.debug(
      `Applied GHS ${appliedTotal} credit for student ${student.id}; remaining ${balance.availableCredit}`,
    );

    return appliedTotal;
  }

  /**
   * Idempotent: wallet = unallocated PAID surplus − INTERNAL_CREDIT applications.
   */
  async recomputeCreditFromLedger(studentId: string): Promise<number> {
    const student = await this.creditRepository.manager
      .getRepository(Student)
      .findOne({
        where: { id: studentId },
        relations: ['school'],
      });
    if (!student?.school) {
      return 0;
    }

    const surplusRow = await this.paymentAllocationRepository
      .createQueryBuilder('allocation')
      .leftJoin('allocation.student', 'student')
      .leftJoin('allocation.obligation', 'obligation')
      .leftJoin('allocation.feeStructure', 'fee')
      .leftJoin('allocation.transaction', 'transaction')
      .where('student.id = :sid', { sid: studentId })
      .andWhere('obligation.id IS NULL')
      .andWhere('fee.id IS NULL')
      .andWhere('transaction.status = :status', {
        status: PaymentTransactionStatus.PAID,
      })
      .andWhere('transaction.provider = :hubtel', {
        hubtel: PaymentProvider.HUBTEL,
      })
      .select('COALESCE(SUM(allocation.allocatedAmount), 0)', 'sum')
      .getRawOne<{ sum: string }>();

    const appliedRow = await this.paymentTransactionRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.student', 'student')
      .where('student.id = :sid', { sid: studentId })
      .andWhere('payment.provider = :provider', {
        provider: PaymentProvider.INTERNAL_CREDIT,
      })
      .andWhere('payment.status = :status', {
        status: PaymentTransactionStatus.PAID,
      })
      .select(
        'COALESCE(SUM(payment.amountAfterCharges), SUM(payment.amount), 0)',
        'sum',
      )
      .getRawOne<{ sum: string }>();

    const surplus = Number(surplusRow?.sum ?? 0);
    const applied = Number(appliedRow?.sum ?? 0);
    const credit = Math.max(0, Math.round((surplus - applied) * 100) / 100);

    const balance = await this.getOrCreateBalance(student, student.school);
    balance.availableCredit = credit;
    await this.creditRepository.save(balance);
    return credit;
  }
}
