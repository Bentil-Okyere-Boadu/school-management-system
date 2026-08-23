import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  GradingScheme,
  GradingSchemeScopeType,
  GradingSchemeStatus,
} from './grading-scheme.entity';
import { GradingSchemeBand } from './grading-scheme-band.entity';
import { CreateGradingSchemeDto } from './dto/create-grading-scheme.dto';
import { UpdateGradingSchemeDto } from './dto/update-grading-scheme.dto';
import { GradingSchemeBandDto } from './dto/grading-scheme-band.dto';
import { School } from '../school/school.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';

type BandValidationResult = {
  errors: string[];
  gapWarnings: string[];
};

@Injectable()
export class GradingSchemeService {
  constructor(
    @InjectRepository(GradingScheme)
    private readonly schemeRepo: Repository<GradingScheme>,
    @InjectRepository(GradingSchemeBand)
    private readonly bandRepo: Repository<GradingSchemeBand>,
    @InjectRepository(ClassLevel)
    private readonly classLevelRepo: Repository<ClassLevel>,
    @InjectRepository(GradingSystem)
    private readonly gradingSystemRepo: Repository<GradingSystem>,
  ) {}

  async list(schoolId: string, status?: GradingSchemeStatus) {
    await this.ensureDefaultSchemeFromLegacy(schoolId);

    const where: { school: { id: string }; status?: GradingSchemeStatus } = {
      school: { id: schoolId },
    };
    if (status) where.status = status;

    const schemes = await this.schemeRepo.find({
      where,
      relations: ['bands', 'classLevels', 'school'],
      order: { updatedAt: 'DESC' },
    });

    return schemes.map((scheme) => this.toResponse(scheme));
  }

  async getOne(id: string, schoolId: string) {
    return this.toResponse(await this.findOwned(id, schoolId));
  }

  async create(dto: CreateGradingSchemeDto, school: School, admin: SchoolAdmin) {
    const scoreScaleMin = dto.scoreScaleMin ?? 0;
    const scoreScaleMax = dto.scoreScaleMax ?? 100;
    const passMark = dto.passMark ?? 50;
    const scopeType: GradingSchemeScopeType = dto.scopeType ?? 'school';

    const validation = this.validateBands(
      dto.bands,
      scoreScaleMin,
      scoreScaleMax,
      passMark,
    );
    if (validation.errors.length) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    const classLevels = await this.resolveClassLevels(
      school.id,
      scopeType,
      dto.classLevelIds,
    );
    const actor = this.actorMeta(admin);

    const scheme = this.schemeRepo.create({
      name: dto.name.trim(),
      status: 'draft',
      version: 1,
      scoreScaleMin,
      scoreScaleMax,
      passMark,
      rounding: dto.rounding ?? 'nearest',
      allowManualOverride: dto.allowManualOverride ?? false,
      effectiveFrom: dto.effectiveFrom ?? null,
      scopeType,
      school,
      classLevels,
      createdById: actor.id,
      createdByName: actor.name,
      updatedById: actor.id,
      updatedByName: actor.name,
      bands: dto.bands.map((band, index) =>
        this.bandRepo.create(this.mapBand(band, index)),
      ),
    });

    const saved = await this.schemeRepo.save(scheme);
    if (dto.activate) {
      return this.activate(saved.id, school.id, admin);
    }
    return this.getOne(saved.id, school.id);
  }

  async update(
    id: string,
    dto: UpdateGradingSchemeDto,
    schoolId: string,
    admin: SchoolAdmin,
  ) {
    const scheme = await this.findOwned(id, schoolId);
    if (scheme.status !== 'draft') {
      throw new BadRequestException(
        'Only draft schemes can be edited. Create a new version from an active scheme instead.',
      );
    }

    const scoreScaleMin = dto.scoreScaleMin ?? scheme.scoreScaleMin;
    const scoreScaleMax = dto.scoreScaleMax ?? scheme.scoreScaleMax;
    const passMark = dto.passMark ?? scheme.passMark;
    const bandsDto: GradingSchemeBandDto[] =
      dto.bands ??
      scheme.bands.map((band) => ({
        code: band.code,
        label: band.label,
        description: band.description,
        minScore: band.minScore,
        maxScore: band.maxScore,
        sortOrder: band.sortOrder,
      }));

    const validation = this.validateBands(
      bandsDto,
      scoreScaleMin,
      scoreScaleMax,
      passMark,
    );
    if (validation.errors.length) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    if (dto.name !== undefined) scheme.name = dto.name.trim();
    if (dto.scoreScaleMin !== undefined) scheme.scoreScaleMin = dto.scoreScaleMin;
    if (dto.scoreScaleMax !== undefined) scheme.scoreScaleMax = dto.scoreScaleMax;
    if (dto.passMark !== undefined) scheme.passMark = dto.passMark;
    if (dto.rounding !== undefined) scheme.rounding = dto.rounding;
    if (dto.allowManualOverride !== undefined) {
      scheme.allowManualOverride = dto.allowManualOverride;
    }
    if (dto.effectiveFrom !== undefined) {
      scheme.effectiveFrom = dto.effectiveFrom;
    }
    if (dto.scopeType !== undefined) scheme.scopeType = dto.scopeType;

    const scopeType = dto.scopeType ?? scheme.scopeType;
    if (dto.scopeType !== undefined || dto.classLevelIds !== undefined) {
      scheme.classLevels = await this.resolveClassLevels(
        schoolId,
        scopeType,
        dto.classLevelIds ?? scheme.classLevels?.map((level) => level.id) ?? [],
      );
    }

    if (dto.bands) {
      await this.bandRepo.delete({ scheme: { id: scheme.id } });
      scheme.bands = dto.bands.map((band, index) =>
        this.bandRepo.create({
          ...this.mapBand(band, index),
          scheme,
        }),
      );
    }

    const actor = this.actorMeta(admin);
    scheme.updatedById = actor.id;
    scheme.updatedByName = actor.name;
    await this.schemeRepo.save(scheme);
    return this.getOne(id, schoolId);
  }

  async duplicate(id: string, schoolId: string, admin: SchoolAdmin) {
    const source = await this.findOwned(id, schoolId);
    const actor = this.actorMeta(admin);
    const clone = this.schemeRepo.create({
      name: `${source.name} (copy)`,
      status: 'draft',
      version: 1,
      scoreScaleMin: source.scoreScaleMin,
      scoreScaleMax: source.scoreScaleMax,
      passMark: source.passMark,
      rounding: source.rounding,
      allowManualOverride: source.allowManualOverride,
      effectiveFrom: source.effectiveFrom,
      scopeType: source.scopeType,
      school: source.school,
      classLevels: [...(source.classLevels ?? [])],
      createdById: actor.id,
      createdByName: actor.name,
      updatedById: actor.id,
      updatedByName: actor.name,
      bands: (source.bands ?? []).map((band, index) =>
        this.bandRepo.create({
          code: band.code,
          label: band.label,
          description: band.description,
          minScore: band.minScore,
          maxScore: band.maxScore,
          sortOrder: band.sortOrder ?? index,
        }),
      ),
    });
    const saved = await this.schemeRepo.save(clone);
    return this.getOne(saved.id, schoolId);
  }

  async activate(id: string, schoolId: string, admin: SchoolAdmin) {
    const scheme = await this.findOwned(id, schoolId);
    if (scheme.status === 'active') {
      return this.toResponse(scheme);
    }

    const validation = this.validateBands(
      scheme.bands.map((band) => ({
        code: band.code,
        label: band.label,
        description: band.description,
        minScore: band.minScore,
        maxScore: band.maxScore,
        sortOrder: band.sortOrder,
      })),
      scheme.scoreScaleMin,
      scheme.scoreScaleMax,
      scheme.passMark,
    );
    if (validation.errors.length) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    const previousActive = await this.findOverlappingActive(scheme);
    for (const other of previousActive) {
      other.status = 'inactive';
      await this.schemeRepo.save(other);
    }

    const actor = this.actorMeta(admin);
    scheme.status = 'active';
    scheme.activatedById = actor.id;
    scheme.activatedByName = actor.name;
    scheme.activatedAt = new Date();
    scheme.updatedById = actor.id;
    scheme.updatedByName = actor.name;
    await this.schemeRepo.save(scheme);
    await this.syncLegacyGradingSystem(scheme);
    return this.getOne(id, schoolId);
  }

  async deactivate(id: string, schoolId: string, admin: SchoolAdmin) {
    const scheme = await this.findOwned(id, schoolId);
    if (scheme.status !== 'active') {
      throw new BadRequestException('Only active schemes can be deactivated');
    }
    const actor = this.actorMeta(admin);
    scheme.status = 'inactive';
    scheme.updatedById = actor.id;
    scheme.updatedByName = actor.name;
    await this.schemeRepo.save(scheme);
    return this.getOne(id, schoolId);
  }

  async remove(id: string, schoolId: string) {
    const scheme = await this.findOwned(id, schoolId);
    if (scheme.status === 'active') {
      throw new BadRequestException(
        'Active schemes cannot be deleted. Deactivate the scheme first.',
      );
    }
    await this.schemeRepo.remove(scheme);
    return { message: 'Grading scheme deleted successfully' };
  }

  async newVersion(id: string, schoolId: string, admin: SchoolAdmin) {
    const source = await this.findOwned(id, schoolId);
    if (source.status !== 'active') {
      throw new BadRequestException(
        'New versions can only be created from an active scheme',
      );
    }
    const actor = this.actorMeta(admin);
    const draft = this.schemeRepo.create({
      name: source.name,
      status: 'draft',
      version: source.version + 1,
      scoreScaleMin: source.scoreScaleMin,
      scoreScaleMax: source.scoreScaleMax,
      passMark: source.passMark,
      rounding: source.rounding,
      allowManualOverride: source.allowManualOverride,
      effectiveFrom: source.effectiveFrom,
      scopeType: source.scopeType,
      school: source.school,
      classLevels: [...(source.classLevels ?? [])],
      createdById: actor.id,
      createdByName: actor.name,
      updatedById: actor.id,
      updatedByName: actor.name,
      bands: (source.bands ?? []).map((band, index) =>
        this.bandRepo.create({
          code: band.code,
          label: band.label,
          description: band.description,
          minScore: band.minScore,
          maxScore: band.maxScore,
          sortOrder: band.sortOrder ?? index,
        }),
      ),
    });
    const saved = await this.schemeRepo.save(draft);
    return this.getOne(saved.id, schoolId);
  }

  validateBands(
    bands: GradingSchemeBandDto[],
    scaleMin: number,
    scaleMax: number,
    passMark: number,
  ): BandValidationResult {
    const errors: string[] = [];
    const gapWarnings: string[] = [];

    if (scaleMin >= scaleMax) {
      errors.push('Score scale minimum must be less than maximum');
    }
    if (passMark < scaleMin || passMark > scaleMax) {
      errors.push('Pass mark must fall within the scoring scale');
    }
    if (!bands?.length) {
      errors.push('At least one grade band is required');
      return { errors, gapWarnings };
    }

    const normalized = bands.map((band, index) => ({
      ...band,
      index,
      code: (band.code ?? '').trim(),
      label: (band.label ?? '').trim(),
      minScore: Number(band.minScore),
      maxScore: Number(band.maxScore),
    }));

    for (const band of normalized) {
      if (!band.code) errors.push(`Band #${band.index + 1}: code is required`);
      if (!band.label) errors.push(`Band #${band.index + 1}: label is required`);
      if (Number.isNaN(band.minScore) || Number.isNaN(band.maxScore)) {
        errors.push(
          `Band ${band.code || `#${band.index + 1}`}: scores must be numbers`,
        );
        continue;
      }
      if (band.minScore > band.maxScore) {
        errors.push(
          `Band ${band.code}: minimum score cannot exceed maximum score`,
        );
      }
      if (band.minScore < scaleMin || band.maxScore > scaleMax) {
        errors.push(
          `Band ${band.code}: range ${band.minScore}–${band.maxScore} is outside the scale ${scaleMin}–${scaleMax}`,
        );
      }
    }

    const sorted = [...normalized].sort((a, b) => a.minScore - b.minScore);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const overlaps =
          (a.minScore >= b.minScore && a.minScore <= b.maxScore) ||
          (a.maxScore >= b.minScore && a.maxScore <= b.maxScore) ||
          (a.minScore <= b.minScore && a.maxScore >= b.maxScore);
        if (overlaps) {
          errors.push(
            `Bands ${a.code} (${a.minScore}–${a.maxScore}) and ${b.code} (${b.minScore}–${b.maxScore}) overlap`,
          );
        }
      }
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.maxScore + 1e-9 < next.minScore - 1e-9) {
        gapWarnings.push(
          `Gap between ${current.code} (ends ${current.maxScore}) and ${next.code} (starts ${next.minScore})`,
        );
      }
    }

    if (sorted.length) {
      const lowest = sorted[0];
      const highest = sorted[sorted.length - 1];
      if (lowest.minScore > scaleMin) {
        gapWarnings.push(
          `Gap from scale minimum ${scaleMin} to first band ${lowest.code} (starts ${lowest.minScore})`,
        );
      }
      if (highest.maxScore < scaleMax) {
        gapWarnings.push(
          `Gap from last band ${highest.code} (ends ${highest.maxScore}) to scale maximum ${scaleMax}`,
        );
      }
    }

    return { errors, gapWarnings };
  }

  private async ensureDefaultSchemeFromLegacy(schoolId: string) {
    const existingCount = await this.schemeRepo.count({
      where: { school: { id: schoolId } },
    });
    if (existingCount > 0) return;

    const legacy = await this.gradingSystemRepo.find({
      where: { school: { id: schoolId } },
      order: { minRange: 'DESC' },
    });
    if (!legacy.length) return;

    const scheme = this.schemeRepo.create({
      name: 'Default',
      status: 'active',
      version: 1,
      scoreScaleMin: 0,
      scoreScaleMax: 100,
      passMark: 50,
      rounding: 'nearest',
      allowManualOverride: false,
      effectiveFrom: null,
      scopeType: 'school',
      school: { id: schoolId } as School,
      classLevels: [],
      createdByName: 'System',
      activatedByName: 'System',
      activatedAt: new Date(),
      bands: legacy.map((row, index) =>
        this.bandRepo.create({
          code: row.grade,
          label: row.grade,
          description: null,
          minScore: row.minRange,
          maxScore: row.maxRange,
          sortOrder: index,
        }),
      ),
    });
    await this.schemeRepo.save(scheme);
  }

  private async syncLegacyGradingSystem(scheme: GradingScheme) {
    if (scheme.scopeType !== 'school') {
      return;
    }
    const schoolId = scheme.school?.id;
    if (!schoolId) return;

    const existing = await this.gradingSystemRepo.find({
      where: { school: { id: schoolId } },
    });
    if (existing.length) {
      await this.gradingSystemRepo.remove(existing);
    }

    const rows = (scheme.bands ?? []).map((band) =>
      this.gradingSystemRepo.create({
        grade: band.code,
        minRange: band.minScore,
        maxRange: band.maxScore,
        school: { id: schoolId } as School,
      }),
    );
    if (rows.length) {
      await this.gradingSystemRepo.save(rows);
    }
  }

  private async findOverlappingActive(scheme: GradingScheme) {
    const actives = await this.schemeRepo.find({
      where: { school: { id: scheme.school.id }, status: 'active' },
      relations: ['classLevels'],
    });

    return actives.filter((other) => {
      if (other.id === scheme.id) return false;
      if (scheme.scopeType === 'school' || other.scopeType === 'school') {
        return true;
      }
      const ids = new Set((scheme.classLevels ?? []).map((level) => level.id));
      return (other.classLevels ?? []).some((level) => ids.has(level.id));
    });
  }

  private async resolveClassLevels(
    schoolId: string,
    scopeType: GradingSchemeScopeType,
    classLevelIds?: string[],
  ): Promise<ClassLevel[]> {
    if (scopeType === 'school') return [];
    const ids = classLevelIds ?? [];
    if (!ids.length) {
      throw new BadRequestException(
        'Select at least one class level when scope is class levels',
      );
    }
    const levels = await this.classLevelRepo.find({
      where: { id: In(ids), school: { id: schoolId } },
    });
    if (levels.length !== ids.length) {
      throw new BadRequestException('One or more class levels are invalid');
    }
    return levels;
  }

  private async findOwned(id: string, schoolId: string): Promise<GradingScheme> {
    const scheme = await this.schemeRepo.findOne({
      where: { id, school: { id: schoolId } },
      relations: ['bands', 'classLevels', 'school'],
    });
    if (!scheme) {
      throw new NotFoundException('Grading scheme not found');
    }
    scheme.bands = (scheme.bands ?? []).sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    return scheme;
  }

  private mapBand(band: GradingSchemeBandDto, index: number) {
    return {
      code: band.code.trim(),
      label: band.label.trim(),
      description: band.description?.trim() || null,
      minScore: Number(band.minScore),
      maxScore: Number(band.maxScore),
      sortOrder: band.sortOrder ?? index,
    };
  }

  private actorMeta(admin: SchoolAdmin) {
    return {
      id: admin.id,
      name:
        `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() ||
        admin.email ||
        'School Admin',
    };
  }

  private toResponse(scheme: GradingScheme) {
    const bandDtos = (scheme.bands ?? []).map((band) => ({
      code: band.code,
      label: band.label,
      description: band.description,
      minScore: band.minScore,
      maxScore: band.maxScore,
      sortOrder: band.sortOrder,
    }));
    const { gapWarnings } = this.validateBands(
      bandDtos,
      scheme.scoreScaleMin,
      scheme.scoreScaleMax,
      scheme.passMark,
    );
    const classLevelIds = (scheme.classLevels ?? []).map((level) => level.id);

    return {
      id: scheme.id,
      name: scheme.name,
      status: scheme.status,
      version: scheme.version,
      scoreScaleMin: scheme.scoreScaleMin,
      scoreScaleMax: scheme.scoreScaleMax,
      passMark: scheme.passMark,
      rounding: scheme.rounding,
      allowManualOverride: scheme.allowManualOverride,
      effectiveFrom: scheme.effectiveFrom,
      scopeType: scheme.scopeType,
      bands: (scheme.bands ?? []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      ),
      classLevelIds,
      classLevels: (scheme.classLevels ?? []).map((level) => ({
        id: level.id,
        name: level.name,
      })),
      usedByClassCount:
        scheme.scopeType === 'school' ? -1 : classLevelIds.length,
      gapWarnings,
      createdById: scheme.createdById,
      createdByName: scheme.createdByName,
      updatedById: scheme.updatedById,
      updatedByName: scheme.updatedByName,
      activatedById: scheme.activatedById,
      activatedByName: scheme.activatedByName,
      activatedAt: scheme.activatedAt,
      createdAt: scheme.createdAt,
      updatedAt: scheme.updatedAt,
    };
  }
}
