import { GradingSchemeRounding } from '../grading-scheme/grading-scheme.entity';

export type ResolvedGradingBand = {
  code: string;
  label: string;
  description: string | null;
  minScore: number;
  maxScore: number;
};

export type ResolvedGradingScheme = {
  schemeId: string | null;
  schemeVersion: number | null;
  passMark: number;
  rounding: GradingSchemeRounding;
  allowManualOverride: boolean;
  scoreScaleMin: number;
  scoreScaleMax: number;
  bands: ResolvedGradingBand[];
};

export function applyScoreRounding(
  totalScore: number,
  rounding: GradingSchemeRounding,
): number {
  switch (rounding) {
    case 'up':
      return Math.ceil(totalScore);
    case 'down':
      return Math.floor(totalScore);
    case 'nearest':
      return Math.round(totalScore);
    default:
      return totalScore;
  }
}

export function resolveGradeFromBands(
  totalScore: number,
  bands: ResolvedGradingBand[],
  passMark?: number,
): {
  grade: string;
  gradeLabel: string;
  bandDescription: string | null;
  isPassing: boolean;
} {
  const match = bands.find(
    (band) => totalScore >= band.minScore && totalScore <= band.maxScore,
  );
  const grade = match?.code ?? 'N/A';
  const gradeLabel = match?.label ?? 'Not in any band';
  const isPassing =
    passMark !== undefined ? totalScore >= passMark : grade !== 'F' && grade !== 'N/A';
  return {
    grade,
    gradeLabel,
    bandDescription: match?.description ?? null,
    isPassing,
  };
}

export function isPublishedResultStatus(
  status: string | null | undefined,
  legacySchoolAdminApproved?: boolean,
): boolean {
  if (status === 'published') return true;
  if (!status && legacySchoolAdminApproved) return true;
  return false;
}

export function isStudentParentRestrictedRole(roleLabel?: string | null): boolean {
  return roleLabel === 'Student' || roleLabel === 'Parent';
}
