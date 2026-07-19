import { INestApplication, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import {
  PaymentProvider,
  PaymentTransaction,
  PaymentTransactionStatus,
} from './entities/payment-transaction.entity';
import { StudentCreditBalance } from './entities/student-credit-balance.entity';
import { Student } from 'src/student/student.entity';

/**
 * Idempotent: set each student's availableCredit from Hubtel unallocated
 * (null obligation + null fee) PAID surplus minus INTERNAL_CREDIT applications.
 */
export async function seedStudentCreditBalanceBackfill(app: INestApplication) {
  const logger = new Logger('StudentCreditBalanceBackfill');
  const allocationRepository = app.get<Repository<PaymentAllocation>>(
    getRepositoryToken(PaymentAllocation),
  );
  const transactionRepository = app.get<Repository<PaymentTransaction>>(
    getRepositoryToken(PaymentTransaction),
  );
  const creditRepository = app.get<Repository<StudentCreditBalance>>(
    getRepositoryToken(StudentCreditBalance),
  );
  const studentRepository = app.get<Repository<Student>>(
    getRepositoryToken(Student),
  );

  const surplusRows = await allocationRepository
    .createQueryBuilder('allocation')
    .leftJoin('allocation.student', 'student')
    .leftJoin('allocation.obligation', 'obligation')
    .leftJoin('allocation.feeStructure', 'fee')
    .leftJoin('allocation.transaction', 'transaction')
    .where('obligation.id IS NULL')
    .andWhere('fee.id IS NULL')
    .andWhere('transaction.status = :status', {
      status: PaymentTransactionStatus.PAID,
    })
    .andWhere('transaction.provider = :hubtel', {
      hubtel: PaymentProvider.HUBTEL,
    })
    .select('student.id', 'studentId')
    .addSelect('COALESCE(SUM(allocation.allocatedAmount), 0)', 'surplus')
    .groupBy('student.id')
    .getRawMany<{ studentId: string; surplus: string }>();

  const appliedRows = await transactionRepository
    .createQueryBuilder('payment')
    .leftJoin('payment.student', 'student')
    .where('payment.provider = :provider', {
      provider: PaymentProvider.INTERNAL_CREDIT,
    })
    .andWhere('payment.status = :status', {
      status: PaymentTransactionStatus.PAID,
    })
    .select('student.id', 'studentId')
    .addSelect(
      'COALESCE(SUM(CASE WHEN payment.amountAfterCharges > 0 THEN payment.amountAfterCharges ELSE payment.amount END), 0)',
      'applied',
    )
    .groupBy('student.id')
    .getRawMany<{ studentId: string; applied: string }>();

  const appliedByStudent = new Map(
    appliedRows.map((r) => [r.studentId, Number(r.applied ?? 0)]),
  );

  const studentIds = new Set<string>([
    ...surplusRows.map((r) => r.studentId),
    ...appliedRows.map((r) => r.studentId),
  ]);

  // Also refresh existing credit rows so wallet stays consistent
  const existing = await creditRepository.find({
    relations: ['student'],
  });
  for (const row of existing) {
    if (row.student?.id) {
      studentIds.add(row.student.id);
    }
  }

  let upserted = 0;
  for (const studentId of studentIds) {
    const student = await studentRepository.findOne({
      where: { id: studentId },
      relations: ['school'],
    });
    if (!student?.school) {
      continue;
    }

    const surplusRow = surplusRows.find((r) => r.studentId === studentId);
    const surplus = Number(surplusRow?.surplus ?? 0);
    const applied = appliedByStudent.get(studentId) ?? 0;
    const credit = Math.max(0, Math.round((surplus - applied) * 100) / 100);

    let row = await creditRepository.findOne({
      where: { student: { id: studentId } },
    });
    if (!row) {
      if (credit <= 0) {
        continue;
      }
      row = creditRepository.create({
        student,
        school: student.school,
        availableCredit: credit,
      });
    } else {
      row.availableCredit = credit;
    }
    await creditRepository.save(row);
    upserted += 1;
  }

  if (upserted > 0) {
    logger.log(
      `Student credit balance backfill: ${upserted} student wallet(s) upserted`,
    );
  }
}
