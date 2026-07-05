import type { PerformanceCluster } from "@/@types";

export const CLUSTER_ORDER: PerformanceCluster[] = [
  "Below Expectations",
  "Developing",
  "On Track",
  "Meeting Expectations",
];

export type ClusterStyle = {
  /** Solid dot color (tailwind bg-*) */
  dotClass: string;
  /** Light pill / badge background + text (tailwind) */
  badgeClass: string;
  /** Solid filled badge background + text (tailwind) */
  solidClass: string;
  /** Mantine Progress color name */
  progressColor: string;
};

export const CLUSTER_STYLES: Record<PerformanceCluster, ClusterStyle> = {
  "Below Expectations": {
    dotClass: "bg-red-500",
    badgeClass: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100",
    solidClass: "bg-red-500 text-white",
    progressColor: "red",
  },
  Developing: {
    dotClass: "bg-orange-400",
    badgeClass: "bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100",
    solidClass: "bg-orange-400 text-white",
    progressColor: "orange",
  },
  "On Track": {
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100",
    solidClass: "bg-blue-500 text-white",
    progressColor: "blue",
  },
  "Meeting Expectations": {
    dotClass: "bg-emerald-500",
    badgeClass:
      "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
    solidClass: "bg-emerald-500 text-white",
    progressColor: "green",
  },
};

/** Maps the API distribution object keys to their cluster label */
export const CLUSTER_DISTRIBUTION_KEY: Record<
  PerformanceCluster,
  "belowExpectations" | "developing" | "onTrack" | "meetingExpectations"
> = {
  "Below Expectations": "belowExpectations",
  Developing: "developing",
  "On Track": "onTrack",
  "Meeting Expectations": "meetingExpectations",
};

export type ScoreRangeOption = {
  value: string;
  label: string;
  min?: number;
  max?: number;
};

/** Preset score-range filters for the "Score Range" dropdown */
export const SCORE_RANGE_OPTIONS: ScoreRangeOption[] = [
  { value: "", label: "All Scores" },
  { value: "80-100", label: "80 – 100%", min: 80, max: 100 },
  { value: "60-80", label: "60 – 80%", min: 60, max: 80 },
  { value: "40-60", label: "40 – 60%", min: 40, max: 60 },
  { value: "0-40", label: "0 – 40%", min: 0, max: 40 },
];

/** Two-letter initials from a full name string, e.g. "Kojo Ansah" -> "KA" */
export function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th" ... */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
