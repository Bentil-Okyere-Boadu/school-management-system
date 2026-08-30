export function gradeCircleClass(grade?: string | null) {
  const value = (grade ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (value.startsWith("A") || value === "B+") return "bg-emerald-500";
  if (value.startsWith("B")) return "bg-teal-500";
  if (value.startsWith("C")) return "bg-sky-500";
  if (value.startsWith("D")) return "bg-amber-500";
  return "bg-zinc-400";
}

export function gradeRemark(grade?: string | null) {
  const value = (grade ?? "").trim().toUpperCase().replace(/\s/g, "");
  if (!value) return "—";
  if (value.startsWith("A")) return "Excellent";
  if (value === "B+") return "Very Good";
  if (value.startsWith("B")) return "Good";
  if (value === "C+") return "Credit";
  if (value.startsWith("C")) return "Satisfactory";
  if (value.startsWith("D")) return "Pass";
  return "Needs Improvement";
}

export function overallPerformanceBand(average: number | null) {
  if (average == null) return null;
  if (average >= 80) return "Excellent";
  if (average >= 70) return "Very Good";
  if (average >= 60) return "Good";
  if (average >= 50) return "Credit";
  if (average >= 40) return "Pass";
  return "Needs Improvement";
}

export function performanceBandClass(band: string | null) {
  switch (band) {
    case "Excellent":
    case "Very Good":
      return "bg-emerald-50 text-emerald-700";
    case "Good":
    case "Credit":
      return "bg-teal-50 text-teal-700";
    case "Pass":
      return "bg-amber-50 text-amber-800";
    case "Needs Improvement":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export function averagePercentage(
  percentages: Array<string | number | null | undefined>,
) {
  const values = percentages
    .map((value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        return Number.parseFloat(value.replace("%", ""));
      }
      return Number.NaN;
    })
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
