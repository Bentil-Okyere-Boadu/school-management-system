import { INestApplication, Logger } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';

/**
 * Sets Topic.academicTerm from Topic.curriculum.academicTerm when missing.
 */
export async function seedTopicAcademicTerms(
  app: INestApplication,
): Promise<void> {
  const logger = new Logger('TopicAcademicTermBackfill');
  const topicRepo = app.get(getRepositoryToken(Topic)) as Repository<Topic>;

  const pending = await topicRepo.find({
    where: { academicTerm: IsNull() },
    relations: ['curriculum', 'curriculum.academicTerm'],
  });

  if (pending.length === 0) {
    await ensureTopicAcademicTermNotNull(topicRepo, logger);
    return;
  }

  logger.log(`Backfilling academic_term_id for ${pending.length} topic(s)`);

  for (const t of pending) {
    const term = t.curriculum?.academicTerm;
    if (!term?.id) continue;
    t.academicTerm = { id: term.id } as AcademicTerm;
    await topicRepo.save(t);
  }

  await ensureTopicAcademicTermNotNull(topicRepo, logger);
}

async function ensureTopicAcademicTermNotNull(
  topicRepo: Repository<Topic>,
  logger: Logger,
): Promise<void> {
  const qr = topicRepo.manager.connection.createQueryRunner();
  await qr.connect();
  try {
    const countRows = await qr.query(
      `SELECT COUNT(*)::int AS count FROM topic WHERE academic_term_id IS NULL`,
    );
    const count = Number(countRows?.[0]?.count ?? 0);
    if (count > 0) {
      logger.warn(
        `${String(count)} topic(s) still have NULL academic_term_id; skipping NOT NULL`,
      );
      return;
    }
    await qr.query(
      `ALTER TABLE topic ALTER COLUMN academic_term_id SET NOT NULL`,
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes('contains null values') ||
      msg.includes('does not exist') ||
      msg.includes('already')
    ) {
      logger.debug(`topic academic_term_id NOT NULL alter skipped: ${msg}`);
      return;
    }
    throw e;
  } finally {
    await qr.release();
  }
}
