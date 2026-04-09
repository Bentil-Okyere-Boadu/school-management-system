import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  Brackets,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { PaymentProviderEvent } from './entities/payment-provider-event.entity';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { TransactionUtil } from 'src/common/utils/transaction.util';
import { PaymentQueryDto } from './dto/payment-query.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(PaymentProviderEvent)
    private readonly providerEventRepository: Repository<PaymentProviderEvent>,
    @InjectRepository(PaymentReceipt)
    private readonly paymentReceiptRepository: Repository<PaymentReceipt>,
    @InjectRepository(PaymentAllocation)
    private readonly paymentAllocationRepository: Repository<PaymentAllocation>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(FeeStructure)
    private readonly feeStructureRepository: Repository<FeeStructure>,
    private readonly transactionUtil: TransactionUtil,
  ) {}

  async getStudentByBillingCode(studentBillingCode: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { studentBillingCode },
      relations: ['school', 'classLevels'],
    });

    if (!student) {
      throw new NotFoundException('Invalid student billing code');
    }

    return student;
  }

  async getStudentById(studentId: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['school', 'classLevels'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * USSD / payments: resolve by billing code or login student ID (human-readable).
   */
  async resolveStudentByBillingCodeOrStudentId(raw: string): Promise<Student> {
    const q = raw.trim();
    if (!q) {
      throw new NotFoundException('Student not found');
    }

    let student = await this.studentRepository.findOne({
      where: { studentBillingCode: q },
      relations: ['school', 'classLevels'],
    });

    if (!student) {
      student = await this.studentRepository.findOne({
        where: { studentId: q },
        relations: ['school', 'classLevels'],
      });
    }

    if (!student) {
      student = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.school', 'school')
        .leftJoinAndSelect('student.classLevels', 'classLevels')
        .where('LOWER(student.studentId) = LOWER(:q)', { q })
        .getOne();
    }

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  /**
   * Sum of outstanding school fee amounts for the student (matches allocation logic).
   */
  async getTotalOutstandingForStudent(student: Student): Promise<number> {
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: true,
    });
    let total = 0;
    for (const fee of fees) {
      const paid = await this.sumPaidAllocationsForStudentFee(
        student.id,
        fee.id,
      );
      total += Math.max(0, fee.amount - paid);
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * USSD: fees with positive outstanding, oldest due first (same order as allocation).
   */
  async getOutstandingFees(
    student: Student,
  ): Promise<{ id: string; feeTitle: string; outstanding: number }[]> {
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: true,
    });
    const rows: { id: string; feeTitle: string; outstanding: number }[] = [];
    for (const fee of fees) {
      const paid = await this.sumPaidAllocationsForStudentFee(
        student.id,
        fee.id,
      );
      const outstanding = Math.max(0, fee.amount - paid);
      if (outstanding > 0) {
        rows.push({
          id: fee.id,
          feeTitle: (fee.feeTitle ?? 'Fee').trim() || 'Fee',
          outstanding: Math.round(outstanding * 100) / 100,
        });
      }
    }
    return rows;
  }

  /**
   * Simulate pay-all allocation (oldest due first) without persisting.
   */
  async previewAllocation(
    studentId: string,
    amount: number,
  ): Promise<{ feeName: string; amount: number }[]> {
    const student = await this.getStudentById(studentId);
    return this.simulateAllocationLines(student, amount, {
      ussdOnly: true,
    });
  }

  /**
   * Simulate pay-specific-fee first, then remainder auto-allocated.
   */
  async previewAllocationForSpecificFee(
    studentId: string,
    feeStructureId: string,
    amount: number,
  ): Promise<{ feeName: string; amount: number }[]> {
    const student = await this.getStudentById(studentId);
    const fees = await this.getOutstandingFees(student);
    if (!fees.some((f) => f.id === feeStructureId)) {
      throw new BadRequestException('Fee not applicable or already paid');
    }
    return this.simulateAllocationLines(student, amount, {
      ussdOnly: true,
      prioritizeFeeId: feeStructureId,
    });
  }

  private async simulateAllocationLines(
    student: Student,
    amount: number,
    opts?: { ussdOnly?: boolean; prioritizeFeeId?: string | null },
  ): Promise<{ feeName: string; amount: number }[]> {
    const ussdOnly = opts?.ussdOnly ?? false;
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: ussdOnly,
    });

    const virtualOut = new Map<string, number>();
    for (const fee of fees) {
      const paid = await this.sumPaidAllocationsForStudentFee(
        student.id,
        fee.id,
      );
      virtualOut.set(fee.id, Math.max(0, fee.amount - paid));
    }

    let ordered: FeeStructure[] = [...fees];
    if (opts?.prioritizeFeeId) {
      const t = ordered.find((f) => f.id === opts.prioritizeFeeId);
      ordered = t ? [t, ...ordered.filter((f) => f.id !== t.id)] : ordered;
    }

    let remaining = Math.round(amount * 100) / 100;
    const lines: { feeName: string; amount: number }[] = [];

    for (const fee of ordered) {
      if (remaining <= 0) {
        break;
      }
      const out = virtualOut.get(fee.id) ?? 0;
      if (out <= 0) {
        continue;
      }
      const take = Math.round(Math.min(remaining, out) * 100) / 100;
      if (take > 0) {
        lines.push({
          feeName: (fee.feeTitle ?? 'Fee').trim() || 'Fee',
          amount: take,
        });
        virtualOut.set(fee.id, Math.round((out - take) * 100) / 100);
        remaining = Math.round((remaining - take) * 100) / 100;
      }
    }

    if (remaining > 0) {
      lines.push({ feeName: 'Unallocated', amount: remaining });
    }

    return lines;
  }

  async createPendingTransaction(input: {
    sessionId: string;
    student: Student;
    amount: number;
    mobile: string;
    interactionPayload: Record<string, unknown>;
    targetFeeStructureId?: string | null;
  }): Promise<PaymentTransaction> {
    if (input.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const existing = await this.paymentTransactionRepository.findOne({
      where: { sessionId: input.sessionId },
    });
    if (existing) {
      return existing;
    }

    const transaction = this.paymentTransactionRepository.create({
      sessionId: input.sessionId,
      student: input.student,
      school: input.student.school,
      amount: input.amount,
      mobile: input.mobile,
      rawInteractionPayload: input.interactionPayload,
      status: PaymentTransactionStatus.PENDING,
      targetFeeStructureId: input.targetFeeStructureId ?? null,
    });

    return this.paymentTransactionRepository.save(transaction);
  }

  async updateTransactionStatusFromHubtel(input: {
    sessionId: string;
    orderId?: string | null;
    status: PaymentTransactionStatus;
    providerStatus?: string | null;
    hubtelTransactionId?: string | null;
    networkTransactionId?: string | null;
    paymentMethod?: string | null;
    paymentDate?: Date | null;
    amount?: number;
    charges?: number;
    amountAfterCharges?: number;
    rawFulfilmentPayload?: Record<string, unknown> | null;
  }): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepository.findOne({
      where: { sessionId: input.sessionId },
      relations: ['student', 'school', 'receipt'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction not found for session ${input.sessionId}`,
      );
    }

    transaction.orderId = input.orderId ?? transaction.orderId;
    transaction.status = input.status;
    transaction.providerStatus =
      input.providerStatus ?? transaction.providerStatus;
    transaction.hubtelTransactionId =
      input.hubtelTransactionId ?? transaction.hubtelTransactionId;
    transaction.networkTransactionId =
      input.networkTransactionId ?? transaction.networkTransactionId;
    transaction.paymentMethod =
      input.paymentMethod ?? transaction.paymentMethod;
    transaction.paymentDate = input.paymentDate ?? transaction.paymentDate;
    transaction.amount =
      typeof input.amount === 'number' ? input.amount : transaction.amount;
    transaction.charges =
      typeof input.charges === 'number' ? input.charges : transaction.charges;
    transaction.amountAfterCharges =
      typeof input.amountAfterCharges === 'number'
        ? input.amountAfterCharges
        : transaction.amountAfterCharges;
    transaction.rawFulfilmentPayload =
      input.rawFulfilmentPayload ?? transaction.rawFulfilmentPayload;

    return this.paymentTransactionRepository.save(transaction);
  }

  async markStatusCheck(transactionId: string): Promise<void> {
    await this.paymentTransactionRepository.update(
      { id: transactionId },
      { lastStatusCheckAt: new Date() },
    );
  }

  async getStalePendingTransactions(
    minutes = 5,
  ): Promise<PaymentTransaction[]> {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);

    return this.paymentTransactionRepository.find({
      where: {
        status: PaymentTransactionStatus.PENDING,
        createdAt: LessThanOrEqual(threshold),
      },
      relations: ['student', 'school'],
      take: 100,
      order: { createdAt: 'ASC' },
    });
  }

  async createProviderEvent(event: {
    eventType: string;
    eventKey: string;
    sessionId?: string | null;
    orderId?: string | null;
    payload: Record<string, unknown>;
  }): Promise<{ created: boolean; record: PaymentProviderEvent }> {
    const existing = await this.providerEventRepository.findOne({
      where: { eventKey: event.eventKey },
    });

    if (existing) {
      return { created: false, record: existing };
    }

    const created = this.providerEventRepository.create({
      eventType: event.eventType,
      eventKey: event.eventKey,
      sessionId: event.sessionId ?? null,
      orderId: event.orderId ?? null,
      payload: event.payload,
      processedAt: null,
    });

    const saved = await this.providerEventRepository.save(created);
    return { created: true, record: saved };
  }

  async markProviderEventProcessed(eventId: string): Promise<void> {
    await this.providerEventRepository.update(
      { id: eventId },
      { processedAt: new Date() },
    );
  }

  private async findApplicableFeeStructuresForStudent(
    student: Student,
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<FeeStructure[]> {
    if (!student.school?.id) {
      return [];
    }
    const classLevelIds = student.classLevels?.map((c) => c.id) ?? [];
    const fees = await this.feeStructureRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.classLevels', 'classLevel')
      .leftJoinAndSelect('fee.school', 'school')
      .where('school.id = :schoolId', { schoolId: student.school.id })
      .orderBy('fee.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('fee.id', 'ASC')
      .getMany();

    return fees.filter((fee) => {
      if (options?.ussdEligibleOnly && fee.allowUssdPayment === false) {
        return false;
      }
      const levels = fee.classLevels ?? [];
      // No class restriction: fee applies to every student in the school.
      if (levels.length === 0) {
        return true;
      }
      // Class-restricted: student must belong to at least one of the fee's classes.
      if (classLevelIds.length === 0) {
        return false;
      }
      return levels.some((c) => classLevelIds.includes(c.id));
    });
  }

  private async sumPaidAllocationsForStudentFee(
    studentId: string,
    feeId: string,
  ): Promise<number> {
    const paidAgainstFee = await this.paymentAllocationRepository
      .createQueryBuilder('allocation')
      .leftJoin('allocation.feeStructure', 'fee')
      .leftJoin('allocation.student', 'student')
      .leftJoin('allocation.transaction', 'transaction')
      .where('fee.id = :feeId', { feeId })
      .andWhere('student.id = :studentId', { studentId })
      .andWhere('transaction.status = :status', {
        status: PaymentTransactionStatus.PAID,
      })
      .select('COALESCE(SUM(allocation.allocatedAmount), 0)', 'sum')
      .getRawOne<{ sum: string }>();

    return Number(paidAgainstFee?.sum ?? 0);
  }

  /**
   * Prioritize a fee then auto-allocate remainder (same as fulfilment when
   * `targetFeeStructureId` is set on the transaction). Updates target and runs allocation.
   * When `expectedAmount` is passed, it must match the transaction net amount (after charges).
   */
  async allocateToSpecificFee(
    transactionId: string,
    feeStructureId: string,
    expectedAmount?: number,
  ): Promise<void> {
    if (expectedAmount !== undefined) {
      const tx = await this.paymentTransactionRepository.findOne({
        where: { id: transactionId },
      });
      if (!tx) {
        throw new NotFoundException('Transaction not found for allocation');
      }
      const net = tx.amountAfterCharges || tx.amount;
      if (Math.abs(net - expectedAmount) > 0.02) {
        throw new BadRequestException(
          'Payment amount does not match transaction',
        );
      }
    }
    await this.paymentTransactionRepository.update(
      { id: transactionId },
      { targetFeeStructureId: feeStructureId },
    );
    await this.allocatePaidTransaction(transactionId);
  }

  async allocatePaidTransaction(transactionId: string): Promise<void> {
    await this.transactionUtil.executeInTransaction(async (manager) => {
      const transactionRepo = manager.getRepository(PaymentTransaction);
      const allocationRepo = manager.getRepository(PaymentAllocation);
      const receiptRepo = manager.getRepository(PaymentReceipt);

      const transaction = await transactionRepo.findOne({
        where: { id: transactionId },
        relations: [
          'student',
          'student.classLevels',
          'school',
          'allocations',
          'receipt',
        ],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found for allocation');
      }

      if (transaction.status !== PaymentTransactionStatus.PAID) {
        return;
      }

      const existingAllocations = await allocationRepo.find({
        where: { transaction: { id: transaction.id } },
      });
      if (existingAllocations.length > 0) {
        return;
      }

      const ussdOnly = transaction.provider === PaymentProvider.HUBTEL;
      const filteredFees = await this.findApplicableFeeStructuresForStudent(
        transaction.student,
        {
          ussdEligibleOnly: ussdOnly,
        },
      );

      let feeOrder: FeeStructure[] = [...filteredFees];
      if (transaction.targetFeeStructureId) {
        const t = feeOrder.find(
          (f) => f.id === transaction.targetFeeStructureId,
        );
        feeOrder = t ? [t, ...feeOrder.filter((f) => f.id !== t.id)] : feeOrder;
      }

      let remaining = transaction.amountAfterCharges || transaction.amount;
      let order = 1;

      for (const fee of feeOrder) {
        if (remaining <= 0) {
          break;
        }

        const alreadyPaid = await this.sumPaidAllocationsForStudentFee(
          transaction.student.id,
          fee.id,
        );
        const outstanding = Math.max(0, fee.amount - alreadyPaid);
        if (outstanding <= 0) {
          continue;
        }

        const allocationAmount = Math.min(remaining, outstanding);
        await allocationRepo.save(
          allocationRepo.create({
            transaction,
            student: transaction.student,
            feeStructure: fee,
            allocatedAmount: allocationAmount,
            allocationOrder: order++,
          }),
        );
        remaining -= allocationAmount;
      }

      if (remaining > 0) {
        await allocationRepo.save(
          allocationRepo.create({
            transaction,
            student: transaction.student,
            feeStructure: null,
            allocatedAmount: remaining,
            allocationOrder: order,
          }),
        );
      }

      if (!transaction.receipt) {
        const sequence = Date.now();
        const receipt = receiptRepo.create({
          receiptNumber: `RCT-${sequence}`,
          amount: transaction.amount,
          school: transaction.school,
          student: transaction.student,
          transaction,
        });
        await receiptRepo.save(receipt);
      }

      await transactionRepo.update(
        { id: transaction.id },
        { isFulfilled: true },
      );
    });
  }

  async listSchoolPayments(schoolId: string, query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.paymentTransactionRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.receipt', 'receipt')
      .leftJoinAndSelect('payment.allocations', 'allocations')
      .leftJoinAndSelect('allocations.feeStructure', 'feeStructure')
      .where('payment.school.id = :schoolId', { schoolId });

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }
    if (query.studentId) {
      qb.andWhere('student.id = :studentId', { studentId: query.studentId });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((builder) => {
          builder
            .where('student.firstName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('student.lastName ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('student.studentId ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('payment.sessionId ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('payment.orderId ILIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    if (query.dateFrom && query.dateTo) {
      qb.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });
    } else if (query.dateFrom) {
      qb.andWhere('payment.createdAt >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    } else if (query.dateTo) {
      qb.andWhere('payment.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listStudentPayments(studentId: string, query: PaymentQueryDto) {
    return this.listSchoolPaymentsByStudent(studentId, query);
  }

  private async listSchoolPaymentsByStudent(
    studentId: string,
    query: PaymentQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Record<string, unknown> = { student: { id: studentId } };
    if (query.status) {
      where.status = query.status;
    }

    let dateCondition: Date[] | undefined;
    if (query.dateFrom && query.dateTo) {
      dateCondition = [new Date(query.dateFrom), new Date(query.dateTo)];
    }

    const [data, total] = await this.paymentTransactionRepository.findAndCount({
      where: {
        ...where,
        ...(dateCondition
          ? { createdAt: Between(dateCondition[0], dateCondition[1]) }
          : {}),
        ...(query.dateFrom && !query.dateTo
          ? { createdAt: MoreThanOrEqual(new Date(query.dateFrom)) }
          : {}),
        ...(query.dateTo && !query.dateFrom
          ? { createdAt: LessThanOrEqual(new Date(query.dateTo)) }
          : {}),
      },
      relations: [
        'receipt',
        'allocations',
        'allocations.feeStructure',
        'student',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getReceiptByTransactionForSchoolAdmin(
    schoolId: string,
    transactionId: string,
  ): Promise<PaymentReceipt> {
    const receipt = await this.paymentReceiptRepository.findOne({
      where: {
        transaction: { id: transactionId, school: { id: schoolId } },
      },
      relations: ['transaction', 'student', 'school'],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return receipt;
  }

  async getReceiptByTransactionForStudent(
    studentId: string,
    transactionId: string,
  ): Promise<PaymentReceipt> {
    const receipt = await this.paymentReceiptRepository.findOne({
      where: {
        transaction: { id: transactionId, student: { id: studentId } },
      },
      relations: ['transaction', 'student', 'school'],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return receipt;
  }
}
