import { GradingSchemeBand } from "@/@types";

export type BandFormRow = {
  code: string;
  label: string;
  description: string;
  minScore: number | "";
  maxScore: number | "";
};

export const SUGGESTED_AF_BANDS: BandFormRow[] = [
  { code: "A", label: "Excellent", description: "Outstanding performance", minScore: 80, maxScore: 100 },
  { code: "B", label: "Very Good", description: "Strong performance", minScore: 70, maxScore: 79 },
  { code: "C", label: "Good", description: "Satisfactory performance", minScore: 60, maxScore: 69 },
  { code: "D", label: "Credit", description: "Fair performance", minScore: 50, maxScore: 59 },
  { code: "E", label: "Pass", description: "Minimum pass", minScore: 45, maxScore: 49 },
  { code: "F", label: "Fail", description: "Below pass mark", minScore: 0, maxScore: 44 },
];

/** @deprecated alias */
export const SUGGESTED_AF_BANDS_ALIAS = SUGGESTED_AF_BANDS;

export function bandsFromApi(bands: GradingSchemeBand[]): BandFormRow[] {
  return (bands ?? []).map((band) => ({
    code: band.code,
    label: band.label,
    description: band.description ?? "",
    minScore: band.minScore,
    maxScore: band.maxScore,
  }));
}

export function bandsToPayload(bands: BandFormRow[]): GradingSchemeBand[] {
  return bands.map((band, index) => ({
    code: band.code.trim(),
    label: band.label.trim(),
    description: band.description.trim() || null,
    minScore: Number(band.minScore),
    maxScore: Number(band.maxScore),
    sortOrder: index,
  }));
}

export function validateBandRows(
  bands: BandFormRow[],
  scaleMin: number,
  scaleMax: number,
  passMark: number,
): { errors: string[]; gapWarnings: string[] } {
  const errors: string[] = [];
  const gapWarnings: string[] = [];

  if (scaleMin >= scaleMax) {
    errors.push("Score scale minimum must be less than maximum");
  }
  if (passMark < scaleMin || passMark > scaleMax) {
    errors.push("Pass mark must fall within the scoring scale");
  }
  if (!bands.length) {
    errors.push("Add at least one grade band");
    return { errors, gapWarnings };
  }

  const normalized = bands.map((band, index) => ({
    ...band,
    index,
    code: band.code.trim(),
    label: band.label.trim(),
    minScore: Number(band.minScore),
    maxScore: Number(band.maxScore),
  }));

  for (const band of normalized) {
    if (!band.code) errors.push(`Band #${band.index + 1}: code is required`);
    if (!band.label) errors.push(`Band #${band.index + 1}: label is required`);
    if (Number.isNaN(band.minScore) || Number.isNaN(band.maxScore)) {
      errors.push(`Band ${band.code || `#${band.index + 1}`}: scores must be numbers`);
      continue;
    }
    if (band.minScore > band.maxScore) {
      errors.push(`Band ${band.code}: minimum cannot exceed maximum`);
    }
    if (band.minScore < scaleMin || band.maxScore > scaleMax) {
      errors.push(
        `Band ${band.code}: ${band.minScore}–${band.maxScore} is outside ${scaleMin}–${scaleMax}`,
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
    if (sorted[0].minScore > scaleMin) {
      gapWarnings.push(
        `Gap from scale minimum ${scaleMin} to ${sorted[0].code} (starts ${sorted[0].minScore})`,
      );
    }
    const last = sorted[sorted.length - 1];
    if (last.maxScore < scaleMax) {
      gapWarnings.push(
        `Gap from ${last.code} (ends ${last.maxScore}) to scale maximum ${scaleMax}`,
      );
    }
  }

  return { errors, gapWarnings };
}

export function applyRounding(
  score: number,
  rounding: "none" | "nearest" | "up" | "down",
): number {
  if (rounding === "nearest") return Math.round(score);
  if (rounding === "up") return Math.ceil(score);
  if (rounding === "down") return Math.floor(score);
  return score;
}

export function mapScoreToBand(
  score: number,
  bands: BandFormRow[],
  rounding: "none" | "nearest" | "up" | "down",
): BandFormRow | null {
  const rounded = applyRounding(score, rounding);
  const match = bands.find((band) => {
    const min = Number(band.minScore);
    const max = Number(band.maxScore);
    return !Number.isNaN(min) && !Number.isNaN(max) && rounded >= min && rounded <= max;
  });
  return match ?? null;
}
