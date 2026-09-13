import { GradingSchemeBandDto } from './dto/grading-scheme-band.dto';
import { GradingScheme } from './grading-scheme.entity';

export type BandValidationResult = {
  errors: string[];
  gapWarnings: string[];
};

export function validateGradingSchemeBands(
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

export function mapGradingSchemeToResponse(scheme: GradingScheme) {
  const bandDtos = (scheme.bands ?? []).map((band) => ({
    code: band.code,
    label: band.label,
    description: band.description,
    minScore: band.minScore,
    maxScore: band.maxScore,
    sortOrder: band.sortOrder,
  }));
  const { gapWarnings } = validateGradingSchemeBands(
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
