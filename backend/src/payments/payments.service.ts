import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  In,
  LessThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import {
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { PaymentProviderEvent } from './entities/payment-provider-event.entity';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CheckoutOtp } from './entities/checkout-otp.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { TransactionUtil } from 'src/common/utils/transaction.util';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { HubtelMobileMoneyChannel } from 'src/integrations/hubtel/dto/initiate-receive-money.dto';
import { School } from 'src/school/school.entity';
import { PAYMENT_CONFIG_STATUS, SchoolPaymentConfig } from './payment-config';
import { EmailService } from 'src/common/services/email.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { RequestPaymentSetupDto } from './dto/request-payment-setup.dto';
import { FeeObligationService } from './fee-obligation.service';
import { StudentCreditService } from './student-credit.service';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const BILLING_CODE_PREFIX = 'SBC';
const BILLING_CODE_DIGITS = 6;

export interface CreateCheckoutOtpInput {
  student: Student;
  msisdn: string;
  channel: HubtelMobileMoneyChannel;
  amount: number;
  targetFeeStructureId: string | null;
  targetStudentFeeObligationId?: string | null;
  targetAcademicTermId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  parentId?: string | null;
  allocations?: { studentId: string; amount: number }[] | null;
}

export interface CreatedCheckoutOtp {
  otpRequestId: string;
  otpPlain: string;
  expiresAt: Date;
}

export interface ConsumedCheckoutOtp {
  otp: CheckoutOtp;
  student: Student;
}

export interface SchoolPaymentsSummary {
  totalTransactions: number;
  paidCount: number;
  pendingCount: number;
  totalAmountGhs: number;
}

export interface StudentPaymentsSummary {
  totalTransactions: number;
  totalPaidAmountGhs: number;
  pendingValueGhs: number;
  pendingCount: number;
}

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
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(CheckoutOtp)
    private readonly checkoutOtpRepository: Repository<CheckoutOtp>,
    private readonly transactionUtil: TransactionUtil,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly feeObligationService: FeeObligationService,
    private readonly studentCreditService: StudentCreditService,
  ) {}

  private buildPaymentConfigFromSchool(school: School): SchoolPaymentConfig {
    const configured = Boolean(
      school.hubtelClientId &&
        school.hubtelClientSecretEnc &&
        school.hubtelCollectionAccountNumber,
    );

    let status: SchoolPaymentConfig['status'];
    if (!configured) {
      status = PAYMENT_CONFIG_STATUS.NOT_ONBOARDED;
    } else if (!school.hubtelMerchantActive) {
      status = PAYMENT_CONFIG_STATUS.PAUSED;
    } else {
      status = PAYMENT_CONFIG_STATUS.READY;
    }

    const sentAt = school.paymentSetupRequestedAt;
    return {
      status,
      canInitiatePayment: status === PAYMENT_CONFIG_STATUS.READY,
      paymentSetupRequestSentAt: sentAt ? sentAt.toISOString() : null,
      hasRequestedPaymentSetup: Boolean(sentAt),
    };
  }

  async getPaymentConfigForSchool(
    schoolId: string,
  ): Promise<SchoolPaymentConfig> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    return this.buildPaymentConfigFromSchool(school);
  }

  async requestPaymentSetup(
    schoolId: string,
    admin: SchoolAdmin,
    dto: RequestPaymentSetupDto,
  ): Promise<SchoolPaymentConfig> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const configured = Boolean(
      school.hubtelClientId &&
        school.hubtelClientSecretEnc &&
        school.hubtelCollectionAccountNumber,
    );
    if (configured) {
      throw new BadRequestException(
        'Your school is already set up for payments.',
      );
    }

    const notifyTo =
      this.configService
        .get<string>('PAYMENT_SETUP_NOTIFY_EMAIL', '')
        ?.trim() ||
      this.configService.get<string>('MAIL_USER', '')?.trim() ||
      this.configService.get<string>('MAIL_FROM', '')?.trim();
    if (!notifyTo) {
      throw new BadRequestException(
        'Payment setup requests are not configured. Set PAYMENT_SETUP_NOTIFY_EMAIL, MAIL_USER, or MAIL_FROM.',
      );
    }

    const adminName =
      [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim() ||
      'School admin';

    await this.emailService.sendPaymentSetupRequestToTeam({
      to: notifyTo,
      schoolName: school.name,
      schoolId: school.id,
      adminName,
      adminEmail: admin.email,
      contactEmail: dto.contactEmail,
      note: dto.note,
    });

    school.paymentSetupRequestedAt = new Date();
    await this.schoolRepository.save(school);

    return this.buildPaymentConfigFromSchool(school);
  }

  /**
   * Create a one-time-password tied to a specific payment intent
   * (student + amount + msisdn + channel + optional target fee).
   * Returns the plaintext OTP so the caller can deliver it via SMS.
   * Plain OTP is NEVER persisted — only a salted SHA-256 hash.
   */
  async createCheckoutOtp(
    input: CreateCheckoutOtpInput,
  ): Promise<CreatedCheckoutOtp> {
    if (input.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (!input.student.school) {
      throw new BadRequestException('Student is not linked to a school');
    }

    const otpPlain = String(randomInt(100000, 1000000));
    const salt = randomBytes(16).toString('hex');
    const codeHash = createHash('sha256')
      .update(`${salt}:${otpPlain}`)
      .digest('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const record = this.checkoutOtpRepository.create({
      msisdn: input.msisdn,
      channel: input.channel,
      amount: Math.round(input.amount * 100) / 100,
      targetFeeStructureId: input.targetFeeStructureId ?? null,
      targetStudentFeeObligationId: input.targetStudentFeeObligationId ?? null,
      targetAcademicTermId: input.targetAcademicTermId ?? null,
      customerName: input.customerName ?? null,
      customerEmail: input.customerEmail ?? null,
      codeHash,
      salt,
      attempts: 0,
      expiresAt,
      consumedAt: null,
      school: input.student.school,
      student: input.student,
      parentId: input.parentId ?? null,
      allocations: input.allocations ?? null,
    });
    const saved = await this.checkoutOtpRepository.save(record);
    return { otpRequestId: saved.id, otpPlain, expiresAt };
  }

  /**
   * Verify a previously issued OTP against (otpRequestId, otp). Increments
   * attempts on failure; consumes (single-use) on success. Throws on expiry,
   * too many attempts, or already-consumed.
   */
  async verifyAndConsumeCheckoutOtp(
    otpRequestId: string,
    otpPlain: string,
  ): Promise<ConsumedCheckoutOtp> {
    const otp = await this.checkoutOtpRepository.findOne({
      where: { id: otpRequestId },
      relations: ['student', 'student.school', 'student.classLevels', 'school'],
    });
    if (!otp) {
      throw new NotFoundException('OTP request not found');
    }
    if (otp.consumedAt) {
      throw new BadRequestException('OTP already used');
    }
    if (otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many OTP attempts');
    }

    const candidate = createHash('sha256')
      .update(`${otp.salt}:${otpPlain}`)
      .digest('hex');
    if (candidate !== otp.codeHash) {
      otp.attempts += 1;
      await this.checkoutOtpRepository.save(otp);
      throw new BadRequestException('Invalid OTP');
    }

    otp.consumedAt = new Date();
    const saved = await this.checkoutOtpRepository.save(otp);
    return { otp: saved, student: otp.student };
  }

  /**
   * Generate a fresh, alphanumeric ClientReference (max 36 chars) suitable for
   * Hubtel's `ClientReference`. We use it as both `sessionId` on the
   * PaymentTransaction and `ClientReference` to Hubtel.
   */
  generateClientReference(): string {
    const id = randomUUID().replace(/-/g, '');
    return id.slice(0, 32);
  }

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

    const normalizedInput = q.toUpperCase().replace(/\s+/g, '');
    const billingCandidates = this.toBillingCodeCandidates(normalizedInput);

    let student = await this.studentRepository.findOne({
      where: { studentBillingCode: In(billingCandidates) },
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

  private toBillingCodeCandidates(normalizedInput: string): string[] {
    const candidates = new Set<string>();
    candidates.add(normalizedInput);

    const digitsOnly = normalizedInput.replace(/\D/g, '');
    if (digitsOnly && digitsOnly.length <= BILLING_CODE_DIGITS) {
      candidates.add(digitsOnly.padStart(BILLING_CODE_DIGITS, '0'));
      candidates.add(
        `${BILLING_CODE_PREFIX}${digitsOnly.padStart(BILLING_CODE_DIGITS, '0')}`,
      );
    }

    if (
      normalizedInput.startsWith(BILLING_CODE_PREFIX) &&
      normalizedInput.length > BILLING_CODE_PREFIX.length
    ) {
      const suffixDigits = normalizedInput
        .slice(BILLING_CODE_PREFIX.length)
        .replace(/\D/g, '');
      if (suffixDigits && suffixDigits.length <= BILLING_CODE_DIGITS) {
        candidates.add(suffixDigits.padStart(BILLING_CODE_DIGITS, '0'));
        candidates.add(
          `${BILLING_CODE_PREFIX}${suffixDigits.padStart(BILLING_CODE_DIGITS, '0')}`,
        );
      }
    }

    return Array.from(candidates);
  }

  /**
   * Sum of outstanding school fee amounts for the student (matches allocation logic).
   */
  async getTotalOutstandingForStudent(
    student: Student,
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<number> {
    const ussdOnly = options?.ussdEligibleOnly ?? true;
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: ussdOnly,
    });
    return this.feeObligationService.getTotalOutstanding(student, fees, {
      ussdEligibleOnly: ussdOnly,
    });
  }

  async getTermOutstandingForStudent(
    student: Student,
    academicTermId: string,
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<number> {
    const ussdOnly = options?.ussdEligibleOnly ?? true;
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: ussdOnly,
    });
    return this.feeObligationService.getTermOutstanding(
      student,
      fees,
      academicTermId,
      { ussdEligibleOnly: ussdOnly },
    );
  }

  /**
   * Lines with positive outstanding (id = StudentFeeObligation id). USSD-eligible only by default.
   */
  async getOutstandingFees(
    student: Student,
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<
    {
      id: string;
      feeTitle: string;
      outstanding: number;
      periodLabel: string;
      feeStructureId: string;
    }[]
  > {
    const ussdOnly = options?.ussdEligibleOnly ?? true;
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: ussdOnly,
    });
    const lines = await this.feeObligationService.getOutstandingLines(
      student,
      fees,
      { ussdEligibleOnly: ussdOnly },
    );
    return lines.map((l) => ({
      id: l.id,
      feeTitle: l.feeTitle,
      outstanding: l.outstanding,
      periodLabel: l.periodLabel,
      feeStructureId: l.feeStructureId,
    }));
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
   * Simulate pay-specific obligation (or fee) first, then remainder auto-allocated.
   */
  async previewAllocationForSpecificFee(
    studentId: string,
    amount: number,
    target: { obligationId: string } | { feeStructureId: string },
  ): Promise<{ feeName: string; amount: number }[]> {
    const student = await this.getStudentById(studentId);
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: true,
    });
    const outstanding = await this.feeObligationService.getOutstandingLines(
      student,
      fees,
      { ussdEligibleOnly: true },
    );

    let prioritizeObligationId: string | null = null;
    let prioritizeFeeStructureId: string | null = null;

    if ('obligationId' in target) {
      if (!outstanding.some((l) => l.id === target.obligationId)) {
        throw new BadRequestException('Fee not applicable or already paid');
      }
      prioritizeObligationId = target.obligationId;
    } else {
      if (
        !outstanding.some((l) => l.feeStructureId === target.feeStructureId)
      ) {
        throw new BadRequestException('Fee not applicable or already paid');
      }
      prioritizeFeeStructureId = target.feeStructureId;
    }

    return this.simulateAllocationLines(student, amount, {
      ussdOnly: true,
      prioritizeObligationId,
      prioritizeFeeStructureId,
    });
  }

  private async simulateAllocationLines(
    student: Student,
    amount: number,
    opts?: {
      ussdOnly?: boolean;
      prioritizeObligationId?: string | null;
      prioritizeFeeStructureId?: string | null;
    },
  ): Promise<{ feeName: string; amount: number }[]> {
    const ussdOnly = opts?.ussdOnly ?? false;
    const fees = await this.findApplicableFeeStructuresForStudent(student, {
      ussdEligibleOnly: ussdOnly,
    });

    const ordered =
      await this.feeObligationService.getOrderedOutstandingObligations(
        student,
        fees,
        {
          ussdEligibleOnly: ussdOnly,
          prioritizeObligationId: opts?.prioritizeObligationId,
          prioritizeFeeStructureId: opts?.prioritizeFeeStructureId,
        },
      );

    const virtualOut = new Map<string, number>();
    for (const row of ordered) {
      virtualOut.set(row.obligation.id, row.outstanding);
    }

    let remaining = Math.round(amount * 100) / 100;
    const lines: { feeName: string; amount: number }[] = [];

    for (const row of ordered) {
      if (remaining <= 0) {
        break;
      }
      const out = virtualOut.get(row.obligation.id) ?? 0;
      if (out <= 0) {
        continue;
      }
      const take = Math.round(Math.min(remaining, out) * 100) / 100;
      if (take > 0) {
        const feeName = `${(row.fee.feeTitle ?? 'Fee').trim() || 'Fee'} · ${row.periodLabel}`;
        lines.push({
          feeName,
          amount: take,
        });
        virtualOut.set(row.obligation.id, Math.round((out - take) * 100) / 100);
        remaining = Math.round((remaining - take) * 100) / 100;
      }
    }

    if (remaining > 0) {
      lines.push({ feeName: 'Prepayment (credit)', amount: remaining });
    }

    return lines;
  }

  /**
   * Look up a PaymentTransaction by its ClientReference (we store it as
   * `sessionId`), eagerly loading `student` and `school`. Used by the
   * Direct Receive Money callback handler and the public status endpoint.
   */
  async findTransactionByClientReference(
    clientReference: string,
  ): Promise<PaymentTransaction | null> {
    return this.paymentTransactionRepository.findOne({
      where: { sessionId: clientReference },
      relations: ['student', 'school', 'receipt'],
    });
  }

  /**
   * Mark a PENDING transaction as FAILED with a stored reason. Idempotent:
   * if the transaction has already moved to a non-pending state, this is a no-op.
   */
  async markTransactionFailed(
    transactionId: string,
    reason: string,
    rawPayload?: Record<string, unknown> | null,
  ): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionRepository.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Payment transaction ${transactionId} not found`,
      );
    }
    if (transaction.status !== PaymentTransactionStatus.PENDING) {
      return transaction;
    }
    transaction.status = PaymentTransactionStatus.FAILED;
    transaction.providerStatus = reason;
    if (rawPayload) {
      transaction.rawFulfilmentPayload = rawPayload;
    }
    return this.paymentTransactionRepository.save(transaction);
  }

  async createPendingTransaction(input: {
    sessionId: string;
    student: Student;
    amount: number;
    mobile: string;
    interactionPayload: Record<string, unknown>;
    targetFeeStructureId?: string | null;
    targetStudentFeeObligationId?: string | null;
    targetAcademicTermId?: string | null;
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
      targetStudentFeeObligationId: input.targetStudentFeeObligationId ?? null,
      targetAcademicTermId: input.targetAcademicTermId ?? null,
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

  /**
   * Fee structures applicable to a student (optionally USSD-eligible only).
   * Used by Finance and payment allocation.
   */
  async getApplicableFeeStructuresForStudent(
    student: Student,
    options?: { ussdEligibleOnly?: boolean },
  ): Promise<FeeStructure[]> {
    return this.findApplicableFeeStructuresForStudent(student, options);
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

  /**
   * Prioritize a fee then auto-allocate remainder (same as fulfilment when
   * `targetFeeStructureId` is set on the transaction). Updates target and runs allocation.
   * When `expectedAmount` is passed, it must match the transaction net amount (after charges).
   */
  async allocateToSpecificFee(
    transactionId: string,
    feeStructureId: string,
    expectedAmount?: number,
    obligationId?: string | null,
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
      {
        targetFeeStructureId: feeStructureId,
        targetStudentFeeObligationId: obligationId ?? null,
      },
    );
    await this.allocatePaidTransaction(transactionId);
  }

  async allocatePaidTransaction(transactionId: string): Promise<void> {
    const txPreview = await this.paymentTransactionRepository.findOne({
      where: { id: transactionId },
      relations: ['student', 'student.classLevels', 'school'],
    });

    if (!txPreview) {
      throw new NotFoundException('Transaction not found for allocation');
    }

    if (txPreview.status !== PaymentTransactionStatus.PAID) {
      return;
    }

    // Internal credit applications already carry their own allocations.
    if (txPreview.provider === PaymentProvider.INTERNAL_CREDIT) {
      return;
    }

    const existingCount = await this.paymentAllocationRepository.count({
      where: { transaction: { id: transactionId } },
    });
    if (existingCount > 0) {
      return;
    }

    const ussdOnly = txPreview.provider === PaymentProvider.HUBTEL;
    const filteredFees = await this.findApplicableFeeStructuresForStudent(
      txPreview.student,
      {
        ussdEligibleOnly: ussdOnly,
      },
    );
    await this.feeObligationService.ensureObligationsForStudent(
      txPreview.student,
      filteredFees,
    );

    // Apply existing wallet credit before new cash (all fees).
    const allFees = await this.findApplicableFeeStructuresForStudent(
      txPreview.student,
      { ussdEligibleOnly: false },
    );
    await this.studentCreditService.applyAvailableCredit(
      txPreview.student,
      allFees,
      { ussdEligibleOnly: false },
    );

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

      const filteredFeesInner =
        await this.findApplicableFeeStructuresForStudent(transaction.student, {
          ussdEligibleOnly: ussdOnly,
        });

      const ordered =
        await this.feeObligationService.getOrderedOutstandingObligations(
          transaction.student,
          filteredFeesInner,
          {
            ussdEligibleOnly: ussdOnly,
            prioritizeObligationId:
              transaction.targetStudentFeeObligationId ?? null,
            prioritizeFeeStructureId: transaction.targetStudentFeeObligationId
              ? null
              : transaction.targetFeeStructureId,
            prioritizeAcademicTermId:
              transaction.targetStudentFeeObligationId ||
              transaction.targetFeeStructureId
                ? null
                : transaction.targetAcademicTermId,
          },
        );

      const virtualOut = new Map<string, number>();
      for (const row of ordered) {
        virtualOut.set(row.obligation.id, row.outstanding);
      }

      let remaining = transaction.amountAfterCharges || transaction.amount;
      let order = 1;

      for (const row of ordered) {
        if (remaining <= 0) {
          break;
        }
        const out = virtualOut.get(row.obligation.id) ?? 0;
        if (out <= 0) {
          continue;
        }
        const allocationAmount = Math.min(remaining, out);
        await allocationRepo.save(
          allocationRepo.create({
            transaction,
            student: transaction.student,
            feeStructure: row.fee,
            obligation: row.obligation,
            allocatedAmount: allocationAmount,
            allocationOrder: order++,
          }),
        );
        virtualOut.set(
          row.obligation.id,
          Math.round((out - allocationAmount) * 100) / 100,
        );
        remaining -= allocationAmount;
      }

      if (remaining > 0) {
        const surplus = Math.round(remaining * 100) / 100;
        await allocationRepo.save(
          allocationRepo.create({
            transaction,
            student: transaction.student,
            feeStructure: null,
            obligation: null,
            allocatedAmount: surplus,
            allocationOrder: order,
          }),
        );
        await this.studentCreditService.addCredit(
          transaction.student,
          transaction.school,
          surplus,
          manager,
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
      .where('payment.school.id = :schoolId', { schoolId })
      .andWhere('payment.provider != :internalCredit', {
        internalCredit: PaymentProvider.INTERNAL_CREDIT,
      });

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

    const summary = await this.buildSchoolPaymentsSummary(qb);

    qb.orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();

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

  private async buildSchoolPaymentsSummary(
    qb: SelectQueryBuilder<PaymentTransaction>,
  ): Promise<SchoolPaymentsSummary> {
    const rows = await this.getDistinctPaymentRows(qb);
    const paidRows = rows.filter(
      (row) => row.status === PaymentTransactionStatus.PAID,
    );
    const pendingRows = rows.filter(
      (row) => row.status === PaymentTransactionStatus.PENDING,
    );
    const totalAmountGhs = paidRows.reduce((sum, row) => {
      const netAmount =
        row.amountAfterCharges > 0 ? row.amountAfterCharges : row.amount;
      return sum + netAmount;
    }, 0);
    return {
      totalTransactions: rows.length,
      paidCount: paidRows.length,
      pendingCount: pendingRows.length,
      totalAmountGhs: Math.round(totalAmountGhs * 100) / 100,
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
    const qb = this.paymentTransactionRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.receipt', 'receipt')
      .leftJoinAndSelect('payment.allocations', 'allocations')
      .leftJoinAndSelect('allocations.feeStructure', 'feeStructure')
      .leftJoinAndSelect('payment.student', 'student')
      .where('student.id = :studentId', { studentId })
      .andWhere('payment.provider != :internalCredit', {
        internalCredit: PaymentProvider.INTERNAL_CREDIT,
      })
      .distinct(true);

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }
    if (query.feeStructureId) {
      qb.andWhere('feeStructure.id = :feeStructureId', {
        feeStructureId: query.feeStructureId,
      });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((builder) => {
          builder
            .where('payment.sessionId ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('payment.orderId ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('receipt.receiptNumber ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('feeStructure.feeTitle ILIKE :search', {
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

    const summary = await this.buildStudentPaymentsSummary(qb);
    const feeTypes = await this.buildStudentFeeTypeFilters(studentId);

    qb.orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      summary,
      filters: { feeTypes },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async buildStudentPaymentsSummary(
    qb: SelectQueryBuilder<PaymentTransaction>,
  ): Promise<StudentPaymentsSummary> {
    const rows = await this.getDistinctPaymentRows(qb);
    const paidRows = rows.filter(
      (row) => row.status === PaymentTransactionStatus.PAID,
    );
    const pendingRows = rows.filter(
      (row) => row.status === PaymentTransactionStatus.PENDING,
    );
    const totalPaidAmountGhs = paidRows.reduce((sum, row) => {
      const netAmount =
        row.amountAfterCharges > 0 ? row.amountAfterCharges : row.amount;
      return sum + netAmount;
    }, 0);
    const pendingValueGhs = pendingRows.reduce((sum, row) => {
      return sum + row.amount;
    }, 0);
    return {
      totalTransactions: rows.length,
      totalPaidAmountGhs: Math.round(totalPaidAmountGhs * 100) / 100,
      pendingValueGhs: Math.round(pendingValueGhs * 100) / 100,
      pendingCount: pendingRows.length,
    };
  }

  private async buildStudentFeeTypeFilters(
    studentId: string,
  ): Promise<{ id: string; title: string }[]> {
    const student = await this.getStudentById(studentId);
    const feeStructures =
      await this.findApplicableFeeStructuresForStudent(student);
    return feeStructures.map((fee) => ({
      id: fee.id,
      title: (fee.feeTitle ?? 'Fee').trim() || 'Fee',
    }));
  }

  private async getDistinctPaymentRows(
    qb: SelectQueryBuilder<PaymentTransaction>,
  ): Promise<
    Array<{
      id: string;
      status: PaymentTransactionStatus;
      amount: number;
      amountAfterCharges: number;
    }>
  > {
    const rows = await qb
      .clone()
      .select('payment.id', 'id')
      .addSelect('payment.status', 'status')
      .addSelect('payment.amount', 'amount')
      .addSelect('payment.amountAfterCharges', 'amountAfterCharges')
      .distinct(true)
      .getRawMany<{
        id: string;
        status: PaymentTransactionStatus;
        amount: number;
        amountAfterCharges: number;
      }>();
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      amount: Number(row.amount),
      amountAfterCharges: Number(row.amountAfterCharges),
    }));
  }

  async getReceiptByTransactionForSchoolAdmin(
    schoolId: string,
    transactionId: string,
  ): Promise<PaymentReceipt> {
    const receipt = await this.paymentReceiptRepository.findOne({
      where: {
        transaction: { id: transactionId, school: { id: schoolId } },
      },
      relations: [
        'transaction',
        'transaction.allocations',
        'transaction.allocations.feeStructure',
        'student',
        'school',
      ],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return this.ensureReceiptAllocations(receipt.id);
  }

  async getReceiptByTransactionForStudent(
    studentId: string,
    transactionId: string,
  ): Promise<PaymentReceipt> {
    const receipt = await this.paymentReceiptRepository.findOne({
      where: {
        transaction: { id: transactionId, student: { id: studentId } },
      },
      relations: [
        'transaction',
        'transaction.allocations',
        'transaction.allocations.feeStructure',
        'student',
        'school',
      ],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }
    return this.ensureReceiptAllocations(receipt.id);
  }

  private async ensureReceiptAllocations(
    receiptId: string,
  ): Promise<PaymentReceipt> {
    let receipt = await this.paymentReceiptRepository.findOne({
      where: { id: receiptId },
      relations: [
        'transaction',
        'transaction.allocations',
        'transaction.allocations.feeStructure',
        'student',
        'school',
      ],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const allocations = receipt.transaction.allocations ?? [];
    if (
      receipt.transaction.status === PaymentTransactionStatus.PAID &&
      allocations.length === 0
    ) {
      await this.allocatePaidTransaction(receipt.transaction.id);
      receipt = await this.paymentReceiptRepository.findOne({
        where: { id: receiptId },
        relations: [
          'transaction',
          'transaction.allocations',
          'transaction.allocations.feeStructure',
          'student',
          'school',
        ],
      });
      if (!receipt) {
        throw new NotFoundException('Receipt not found');
      }
    }

    return receipt;
  }
}
