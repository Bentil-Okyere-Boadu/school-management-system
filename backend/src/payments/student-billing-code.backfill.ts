import { INestApplication, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Student } from 'src/student/student.entity';
import { randomBytes } from 'crypto';

export async function seedStudentBillingCodes(app: INestApplication) {
  const logger = new Logger('StudentBillingCodeBackfill');
  const studentRepository = app.get(
    getRepositoryToken(Student),
  ) as Repository<Student>;

  const students = await studentRepository.find({
    where: { studentBillingCode: IsNull() },
    take: 5000,
  });

  if (students.length === 0) {
    return;
  }

  for (const student of students) {
    if (!student.studentBillingCode) {
      student.studentBillingCode = await generateUniqueBillingCode(studentRepository);
    }
  }

  await studentRepository.save(students);
  logger.log(`Backfilled ${students.length} student billing code(s)`);
}

async function generateUniqueBillingCode(
  studentRepository: Repository<Student>,
): Promise<string> {
  let code = '';
  let exists = true;
  while (exists) {
    code = `SBC${randomBytes(4).toString('hex').toUpperCase()}`;
    const student = await studentRepository.findOne({
      where: { studentBillingCode: code },
      select: ['id'],
    });
    exists = Boolean(student);
  }
  return code;
}
