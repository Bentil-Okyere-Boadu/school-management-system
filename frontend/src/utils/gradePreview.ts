export type GradingBandPreview = {
  code: string;
  label: string;
  minScore: number;
  maxScore: number;
};

export type GradePreviewRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  classScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: string | null;
  gradeLabel: string | null;
  feedback: string;
  isMissing: boolean;
  isInvalid: boolean;
  issues: string[];
};

export function resolveGradeFromTotal(
  totalScore: number,
  bands: GradingBandPreview[],
): { grade: string; gradeLabel: string } {
  const match = bands.find(
    (band) => totalScore >= band.minScore && totalScore <= band.maxScore,
  );
  if (!match) {
    return { grade: "N/A", gradeLabel: "Not in any band" };
  }
  return { grade: match.code, gradeLabel: match.label };
}

export function validateGradingRow(
  row: {
    studentId: string;
    classScore: number | null;
    examScore: number | null;
  },
  classScoreMax: number,
  examScoreMax: number,
): { isMissing: boolean; isInvalid: boolean; issues: string[] } {
  const issues: string[] = [];
  const classProvided = row.classScore !== null && row.classScore !== undefined;
  const examProvided = row.examScore !== null && row.examScore !== undefined;

  if (!classProvided || !examProvided) {
    if (!classProvided && !examProvided) {
      issues.push("Class and exam scores missing");
    } else if (!classProvided) {
      issues.push("Class score missing");
    } else {
      issues.push("Exam score missing");
    }
  }

  if (classProvided) {
    const classScore = Number(row.classScore);
    if (
      Number.isNaN(classScore) ||
      classScore < 0 ||
      classScore > classScoreMax
    ) {
      issues.push(`Class score must be 0–${classScoreMax}`);
    }
  }
  if (examProvided) {
    const examScore = Number(row.examScore);
    if (Number.isNaN(examScore) || examScore < 0 || examScore > examScoreMax) {
      issues.push(`Exam score must be 0–${examScoreMax}`);
    }
  }

  const isMissing = issues.some((issue) => issue.includes("missing"));
  const isInvalid = issues.some((issue) => !issue.includes("missing"));
  return { isMissing, isInvalid, issues };
}

export function buildGradePreviewRows(
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    classScore: number | null;
    examScore: number | null;
    feedback: string;
    isArchived?: boolean;
  }>,
  bands: GradingBandPreview[],
  classScoreMax: number,
  examScoreMax: number,
): GradePreviewRow[] {
  return students
    .filter((s) => !s.isArchived)
    .map((student) => {
      const validation = validateGradingRow(
        {
          studentId: student.id,
          classScore: student.classScore,
          examScore: student.examScore,
        },
        classScoreMax,
        examScoreMax,
      );
      const totalScore =
        student.classScore !== null && student.examScore !== null
          ? student.classScore + student.examScore
          : null;
      const resolved =
        totalScore !== null
          ? resolveGradeFromTotal(totalScore, bands)
          : { grade: null, gradeLabel: null };

      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        classScore: student.classScore,
        examScore: student.examScore,
        totalScore,
        grade: resolved.grade,
        gradeLabel: resolved.gradeLabel,
        feedback: student.feedback,
        ...validation,
      };
    });
}
