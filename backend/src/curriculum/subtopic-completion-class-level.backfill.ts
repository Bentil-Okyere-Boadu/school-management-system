import { INestApplication, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SubtopicCompletion } from './entities/subtopic-completion.entity';
import { Subject } from '../subject/subject.entity';

/**
 * One-time data fix for existing rows after adding class_level_id.
 * Runs at startup until no NULL class_level_id remains; then enforces NOT NULL in DB.
 */
export async function seedSubtopicCompletionClassLevels(
  app: INestApplication,
): Promise<void> {
  const logger = new Logger('SubtopicCompletionClassLevelBackfill');
  const completionRepo = app.get(
    getRepositoryToken(SubtopicCompletion),
  ) as Repository<SubtopicCompletion>;
  const subjectRepo = app.get(
    getRepositoryToken(Subject),
  ) as Repository<Subject>;

  const pending = await completionRepo.find({
    where: { classLevel: IsNull() },
    relations: ['subtopic', 'subject', 'academicTerm'],
  });

  if (pending.length === 0) {
    await ensureClassLevelColumnNotNull(completionRepo, logger);
    return;
  }

  logger.log(
    `Backfilling class_level_id for ${pending.length} subtopic completion row(s)`,
  );

  for (const row of pending) {
    const subject = await subjectRepo.findOne({
      where: { id: row.subject.id },
      relations: ['classLevels'],
    });
    const levels = subject?.classLevels ?? [];

    if (levels.length === 0) {
      await completionRepo.remove(row);
      logger.warn(
        `Removed completion ${row.id}: subject has no class levels (orphan)`,
      );
      continue;
    }

    if (levels.length === 1) {
      row.classLevel = levels[0];
      await completionRepo.save(row);
      continue;
    }

    for (const cl of levels) {
      const copy = completionRepo.create({
        subtopic: row.subtopic,
        subject: row.subject,
        academicTerm: row.academicTerm,
        completedAt: row.completedAt,
        completedBy: row.completedBy,
        classLevel: cl,
      });
      await completionRepo.save(copy);
    }
    await completionRepo.remove(row);
  }

  await ensureClassLevelColumnNotNull(completionRepo, logger);
}

async function ensureClassLevelColumnNotNull(
  completionRepo: Repository<SubtopicCompletion>,
  logger: Logger,
): Promise<void> {
  const qr = completionRepo.manager.connection.createQueryRunner();
  await qr.connect();
  try {
    const countRows = await qr.query(
      `SELECT COUNT(*)::int AS count FROM subtopic_completion WHERE class_level_id IS NULL`,
    );
    const count = Number(countRows?.[0]?.count ?? 0);
    if (count > 0) {
      logger.warn(
        `${String(count)} subtopic_completion row(s) still have NULL class_level_id; skipping NOT NULL constraint`,
      );
      return;
    }
    await qr.query(
      `ALTER TABLE subtopic_completion ALTER COLUMN class_level_id SET NOT NULL`,
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes(
        'column "class_level_id" of relation "subtopic_completion" contains null values',
      ) ||
      msg.includes('does not exist')
    ) {
      logger.debug(`class_level_id NOT NULL alter skipped: ${msg}`);
      return;
    }
    if (msg.includes('is already NOT NULL') || msg.includes('already')) {
      return;
    }
    throw e;
  } finally {
    await qr.release();
  }
}
