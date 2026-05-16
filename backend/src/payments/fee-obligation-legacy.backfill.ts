import { INestApplication, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { StudentFeeObligation } from './entities/student-fee-obligation.entity';
import { Student } from 'src/student/student.entity';
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';

/**
 * One-time migration: attach pre-obligation PaymentAllocations to a legacy
 * StudentFeeObligation per (student, fee) so period-scoped lines do not
 * double-count historical payments.
 *
 * Schools with unusual history may still need to adjust `amountDue` on legacy
 * rows or on newer period obligations.
 */
export async function seedFeeObligationLegacyBackfill(app: INestApplication) {
  const logger = new Logger('FeeObligationLegacyBackfill');
  const allocationRepository = app.get<Repository<PaymentAllocation>>(
    getRepositoryToken(PaymentAllocation),
  );
  const obligationRepository = app.get<Repository<StudentFeeObligation>>(
    getRepositoryToken(StudentFeeObligation),
  );
  const studentRepository = app.get<Repository<Student>>(
    getRepositoryToken(Student),
  );
  const feeRepository = app.get<Repository<FeeStructure>>(
    getRepositoryToken(FeeStructure),
  );

  const orphans = await allocationRepository
    .createQueryBuilder('a')
    .leftJoinAndSelect('a.student', 'student')
    .leftJoinAndSelect('a.feeStructure', 'fee')
    .where('a.obligationId IS NULL')
    .andWhere('fee.id IS NOT NULL')
    .getMany();

  if (orphans.length === 0) {
    return;
  }

  const pairKeys = new Set<string>();
  for (const a of orphans) {
    pairKeys.add(`${a.student.id}:${a.feeStructure!.id}`);
  }

  let linked = 0;
  for (const key of pairKeys) {
    const [studentId, feeId] = key.split(':');
    let legacy = await obligationRepository.findOne({
      where: {
        student: { id: studentId },
        feeStructure: { id: feeId },
        isLegacy: true,
      },
    });

    if (!legacy) {
      const student = await studentRepository.findOne({
        where: { id: studentId },
      });
      const fee = await feeRepository.findOne({ where: { id: feeId } });
      if (!student || !fee) {
        continue;
      }
      legacy = await obligationRepository.save(
        obligationRepository.create({
          student,
          feeStructure: fee,
          periodKey: `legacy:${feeId}`,
          periodStart: '1900-01-01',
          periodEnd: '2099-12-31',
          amountDue: fee.amount,
          isLegacy: true,
          academicTerm: null,
          academicCalendar: null,
        }),
      );
    }

    const upd = await allocationRepository.update(
      {
        student: { id: studentId },
        feeStructure: { id: feeId },
        obligation: IsNull(),
      },
      { obligation: { id: legacy.id } },
    );

    linked += upd.affected ?? 0;
  }

  logger.log(
    `Fee obligation legacy backfill: ${pairKeys.size} bucket(s), ${linked} allocation row(s) linked`,
  );
}
