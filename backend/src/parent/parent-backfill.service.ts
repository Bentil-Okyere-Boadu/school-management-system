import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Parent } from './parent.entity';
import { ParentStudent } from './parent-student.entity';
import {
  ParentAccountStatus,
  ParentStudentSource,
  ParentStudentStatus,
} from './parent.enums';
import {
  guardianDetailsCompatible,
  normalizeEmail,
  pickCanonicalParent,
} from './parent.helpers';
import { Role } from 'src/role/role.entity';
import { Student } from 'src/student/student.entity';

@Injectable()
export class ParentBackfillService implements OnModuleInit {
  private readonly logger = new Logger(ParentBackfillService.name);

  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'Parent relationship backfill skipped (schema-per-school; not a public-schema job)',
    );
  }

  private async dropLegacyGlobalEmailUnique(): Promise<void> {
    await this.parentRepository.query(
      `ALTER TABLE "parent" DROP CONSTRAINT IF EXISTS "UQ_9158391af7b8ca4911efaad8a73"`,
    );
    await this.parentRepository.query(
      `DROP INDEX IF EXISTS "UQ_9158391af7b8ca4911efaad8a73"`,
    );
  }

  async backfill(): Promise<void> {
    const parentRole = await this.roleRepository.findOne({
      where: { name: 'parent' },
    });

    const parents = await this.parentRepository.find({
      relations: ['student', 'student.school', 'school', 'role'],
    });

    if (parents.length === 0) {
      return;
    }

    await this.mergeOrphanParentsByEmail();

    const remainingParents = await this.parentRepository.find({
      relations: ['student', 'student.school', 'school', 'role'],
    });

    for (const parent of remainingParents) {
      const school = parent.school ?? parent.student?.school ?? null;
      let dirty = false;

      if (!parent.school && school) {
        parent.school = school;
        dirty = true;
      }

      if (!parent.role && parentRole) {
        parent.role = parentRole;
        dirty = true;
      }

      if (!parent.status) {
        parent.status = ParentAccountStatus.Pending;
        dirty = true;
      }

      if (parent.email) {
        const normalized = normalizeEmail(parent.email);
        if (normalized && normalized !== parent.email) {
          parent.email = normalized;
          dirty = true;
        }
      }

      if (dirty) {
        await this.parentRepository.save(parent);
      }

      if (!parent.student || !school) {
        continue;
      }

      const existingLink = await this.parentStudentRepository.findOne({
        where: { parent: { id: parent.id }, student: { id: parent.student.id } },
      });

      if (!existingLink) {
        const link = this.parentStudentRepository.create({
          parent,
          student: parent.student,
          school,
          relationship: parent.relationship ?? null,
          status: ParentStudentStatus.Pending,
          source: ParentStudentSource.Migration,
        });
        await this.parentStudentRepository.save(link);
      }
    }

    await this.deduplicateBySchoolEmail();
    this.logger.log('Parent relationship backfill complete');
  }

  private async deduplicateBySchoolEmail(): Promise<void> {
    const parents = await this.parentRepository.find({
      relations: ['school', 'parentStudents', 'parentStudents.student'],
    });

    const groups = new Map<string, Parent[]>();
    for (const parent of parents) {
      const email = normalizeEmail(parent.email);
      const schoolId = parent.school?.id;
      if (!email || !schoolId) {
        continue;
      }
      const key = `${schoolId}:${email}`;
      const list = groups.get(key) ?? [];
      list.push(parent);
      groups.set(key, list);
    }

    for (const group of groups.values()) {
      if (group.length < 2) {
        continue;
      }

      const canonical = pickCanonicalParent(group) ?? group[0];
      const others = group.filter((parent) => parent.id !== canonical.id);
      const conflict = others.some(
        (other) => !guardianDetailsCompatible(canonical, other),
      );

      for (const duplicate of others) {
        const links = await this.parentStudentRepository.find({
          where: { parent: { id: duplicate.id } },
          relations: ['student', 'school'],
        });

        for (const link of links) {
          const already = await this.parentStudentRepository.findOne({
            where: {
              parent: { id: canonical.id },
              student: { id: link.student.id },
            },
          });
          if (already) {
            await this.parentStudentRepository.remove(link);
            continue;
          }
          link.parent = canonical;
          if (conflict) {
            link.status = ParentStudentStatus.PendingReview;
          }
          await this.parentStudentRepository.save(link);
        }

        await this.parentRepository.remove(duplicate);
      }

      if (conflict) {
        await this.parentStudentRepository.update(
          { parent: { id: canonical.id }, status: Not(In([ParentStudentStatus.Revoked])) },
          { status: ParentStudentStatus.PendingReview },
        );
      }
    }
  }

  private async mergeOrphanParentsByEmail(): Promise<void> {
    const parents = await this.parentRepository.find({
      relations: ['school', 'role'],
    });
    const byEmail = new Map<string, Parent[]>();
    for (const parent of parents) {
      const email = normalizeEmail(parent.email);
      if (!email) {
        continue;
      }
      const list = byEmail.get(email) ?? [];
      list.push(parent);
      byEmail.set(email, list);
    }

    for (const group of byEmail.values()) {
      if (group.length < 2) {
        continue;
      }

      const schooled = group.filter((parent) => parent.school?.id);
      const orphans = group.filter((parent) => !parent.school?.id);
      if (orphans.length === 0 && schooled.length < 2) {
        continue;
      }

      const canonical = pickCanonicalParent(schooled) ?? pickCanonicalParent(group);
      if (!canonical) {
        continue;
      }

      for (const duplicate of group) {
        if (duplicate.id === canonical.id) {
          continue;
        }
        const sameSchool =
          Boolean(duplicate.school?.id) &&
          duplicate.school?.id === canonical.school?.id;
        const isOrphan = !duplicate.school?.id;
        if (!sameSchool && !isOrphan) {
          continue;
        }
        await this.mergeParentInto(canonical, duplicate);
      }
    }
  }

  private async mergeParentInto(
    canonical: Parent,
    duplicate: Parent,
  ): Promise<void> {
    const links = await this.parentStudentRepository.find({
      where: { parent: { id: duplicate.id } },
      relations: ['student', 'school'],
    });

    for (const link of links) {
      const already = await this.parentStudentRepository.findOne({
        where: {
          parent: { id: canonical.id },
          student: { id: link.student.id },
        },
      });
      if (already) {
        await this.parentStudentRepository.remove(link);
        continue;
      }
      link.parent = canonical;
      if (!link.school && canonical.school) {
        link.school = canonical.school;
      }
      await this.parentStudentRepository.save(link);
    }

    if (
      duplicate.password &&
      (!canonical.password || duplicate.updatedAt > canonical.updatedAt)
    ) {
      canonical.password = duplicate.password;
    }
    if (!canonical.school && duplicate.school) {
      canonical.school = duplicate.school;
    }
    if (
      duplicate.status === ParentAccountStatus.Active &&
      canonical.status !== ParentAccountStatus.Active
    ) {
      canonical.status = ParentAccountStatus.Active;
    }
    if (duplicate.isInvitationAccepted) {
      canonical.isInvitationAccepted = true;
    }
    await this.parentRepository.save(canonical);
    await this.parentRepository.remove(duplicate);
  }
}
