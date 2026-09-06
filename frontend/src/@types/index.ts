export enum ButtonType {
  submit = "submit",
  reset = "reset",
  button = "button",
}

export interface Profile {
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  otherName?: string;
  DateOfBirth?: string;
  optionalPhoneContact: string;
  email: string;
  PlaceOfBirth: string;
  streetAddress: string;
  phoneContact: string;
  BoxAddress: string;
  gender?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  name: string;
  role: Role;
  status: string;
  school: School;
  gender: string;
  phoneContact: string;
  profile: Profile;
  date: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  description: string;
  isApproved: boolean;
  schoolAdminApproved: boolean;
  resultStatus?: string;
  returnNote?: string | null;
  classTeacher?: User;
}

export interface Student extends User {
  studentId: string;
  parents: Parent[];
  classLevels: ClassLevel[];
  isInvitationAccepted: boolean;
  isArchived: boolean;
  studentBillingCode?: string;
}

export interface Teacher extends User {
  teacherId: string;
  isArchived: boolean;
  isSuspended?: boolean;
  phoneContact: string;
  BoxAddress: string;
  streetAddress: string;
  optionalPhoneContact: string;
}

export interface Parent {
  id?: string;
  firstName: string;
  lastName: string;
  occupation: string;
  email: string;
  address: string;
  phone: string;
  relationship: string;
}

export type AuthCredentials = Pick<User, "email" | "password">;
export type SignUpPayload = Pick<User, "email" | "password" | "name" | "role">;

export enum Roles {
  SCHOOL_ADMIN = "school_admin",
  STUDENT = "student",
  TEACHER = "teacher",
  SUPER_ADMIN = "super_admin",
  PARENT = "parent",
}

export type Role = {
  id: string;
  name: Roles;
  label?: string;
};

export type FeeStructure = {
  id: string;
  feeTitle: string;
  feeType: string;
  amount: number;
  /** Default true when omitted (API). */
  allowUssdPayment?: boolean;
  dueDate: string;
  classLevels?: { name: string }[];
  classLevelIds?: string[];
};

export type Grade = {
  grade: string;
  minRange: number | null;
  maxRange: number | null;
  id: string;
};

export type GradingSchemeStatus = "draft" | "active" | "inactive";
export type GradingSchemeRounding = "none" | "nearest" | "up" | "down";
export type GradingSchemeScopeType = "school" | "classLevels";

export type GradingSchemeBand = {
  id?: string;
  code: string;
  label: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  sortOrder?: number;
};

export type GradingScheme = {
  id: string;
  name: string;
  status: GradingSchemeStatus;
  version: number;
  scoreScaleMin: number;
  scoreScaleMax: number;
  passMark: number;
  rounding: GradingSchemeRounding;
  allowManualOverride: boolean;
  effectiveFrom: string | null;
  scopeType: GradingSchemeScopeType;
  bands: GradingSchemeBand[];
  classLevelIds: string[];
  classLevels: { id: string; name: string }[];
  usedByClassCount: number;
  gapWarnings: string[];
  createdById?: string | null;
  createdByName?: string | null;
  updatedById?: string | null;
  updatedByName?: string | null;
  activatedById?: string | null;
  activatedByName?: string | null;
  activatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateGradingSchemePayload = {
  name: string;
  scoreScaleMin?: number;
  scoreScaleMax?: number;
  passMark?: number;
  rounding?: GradingSchemeRounding;
  allowManualOverride?: boolean;
  effectiveFrom?: string | null;
  scopeType?: GradingSchemeScopeType;
  classLevelIds?: string[];
  bands: GradingSchemeBand[];
  activate?: boolean;
};

export type UpdateGradingSchemePayload = Partial<
  Omit<CreateGradingSchemePayload, "activate">
>;

export type SchoolAdminInfo = {
  email: string;
  firstName: string;
  lastName: string;
  phoneContact: string;
  address: string;
  name: string;
  role: {
    label: string;
  };
  streetAddress?: string;
  optionalPhoneContact?: string;
};

export interface GradingSystem {
  id: string;
  grade: string;
  minRange: number;
  maxRange: number;
}

export interface School {
  classScorePercentage?: number;
  examScorePercentage?: number;
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  schoolCode: string;
  classLevels: ClassLevel[];
  admissionPolicies: AdmissionPolicy[];
  gradingSystems: GradingSystem[];
  feeStructures: FeeStructure[];
  profile: object | null;
  academicCalendars: object[];
  users: User[];
  createdAt: string;
  updatedAt: string;
  logoUrl: string;
  calendlyUrl: string;
  parentShowScores?: boolean;
  parentShowGrades?: boolean;
  parentShowLabels?: boolean;
  parentShowFeedback?: boolean;
  performanceAnalyticsEnabled?: boolean;
}

export enum AdmissionStatus {
  SUBMITTED = "Application Submitted",
  INTERVIEW_COMPLETED = "Interview Completed",
  INTERVIEW_PENDING = "Interview Pending",
  ACCEPTED = "Accepted",
  REJECTED = "Rejected",
  WAITLISTED = "Waitlisted",
  ARCHIVED = "Archived",
}

export type BadgeVariant =
  | "purple"
  | "red"
  | "indigo"
  | "blue"
  | "green"
  | "yellow"
  | "gray"
  | "active"
  | "inactive"
  | "pending"
  | AdmissionStatus;

export interface Calendar {
  id: string;
  name: string;
  terms: Term[];
}

export interface Term {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  termName: string;
  holidays: Holiday[];
  academicCalendarId?: string;
  months?: Month[];
  entries?: Entry[];
  remarks?: string;
}

export interface Entry {
  id: string;
  name: string;
  subject: string;
  classScore: string;
  examScore: string;
  percentageScore: string;
  grade: string;
}

export interface Holiday {
  id?: string;
  name: string;
  date: string;
}

export interface ErrorResponse {
  response: {
    data: {
      message: string;
    };
  };
}

export interface ClassLevel {
  id: string;
  name: string;
  description: string;
  teacherIds: string[];
  studentIds: string[];
  students: User[];
  teachers: User[];
  studentCount?: number;
  classTeacher: User;
  classTeacherId: string;
}

export interface AdmissionPolicy {
  id: string;
  name: string;
  description: string | null;
  documentPath: string;
  mediaType: string;
  documentUrl: string;
}

export interface SchoolPerformance {
  schoolName: string;
  topPerforming: number;
  lowPerforming: number;
}

export interface SuperAdminDashStats {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  averageAttendanceRate: number;
  performance: SchoolPerformance[];
}

export interface StudentInformation {
  firstName: string;
  lastName: string;
  otherNames: string;
  email: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  languagesSpoken: string[];
  streetAddress: string;
  boxAddress: string;
  phone: string;
  academicYear: string;
  classFor: string;
  headshotFile?: File;
  birthCertificateFile?: File;
}

export interface Guardian {
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  nationality: string;
  occupation: string;
  company: string;
  streetAddress: string;
  boxAddress: string;
  phone: string;
  optionalPhone: string;
  headshotFile?: File;
}

export interface AdditionalInformation {
  primaryHomeLanguage: string;
  studentPrimaryLanguage: string;
  hasAcademicHistory: "yes" | "no";
  previousSchool?: {
    name: string;
    url: string;
    street: string;
    city: string;
    state: string;
    country: string;
    attendedFrom: string;
    attendedTo: string;
    grade: string;
    reportCards: File[];
  };
}

export interface AdmissionTableData {
  id: string;
  fullName: string;
  email: string;
  submittedAt: string;
  enrollmentStatus: string;
}

export interface AdmissionData {
  applicationId: string;
  school: School;
  status: string;
  studentFirstName: string;
  studentLastName: string;
  studentOtherNames: string;
  studentEmail: string;
  studentDOB: string;
  studentPlaceOfBirth: string;
  studentGender: string;
  studentNationality: string;
  studentReligion: string;
  studentLanguages: string[];
  studentStreetAddress: string;
  studentBoxAddress: string;
  studentPhone: string;
  studentOtherPhone: string;
  studentOtherPhoneOptional: string;
  studentBirthCertUrl: string;
  academicYear: string;
  forClass: ClassLevel;
  studentHeadshotPath: string;
  studentHeadshotMediaType: string;
  studentHeadshotUrl: string;
  studentBirthCertPath: string;
  studentBirthCertMediaType: string;
  guardians: GuardianData[];
  homePrimaryLanguage: string;
  homeOtherLanguage: string;
  hasPreviousSchool: boolean;
  previousSchoolName: string;
  previousSchoolUrl: string;
  previousSchoolStreetAddress: string;
  previousSchoolCity: string;
  previousSchoolState: string;
  previousSchoolCountry: string;
  previousSchoolBoxAddress: string;
  previousSchoolPhone: string;
  previousSchoolAttendedFrom: string;
  previousSchoolAttendedTo: string;
  previousSchoolGradeClass: string;
  previousSchoolResultPath: string;
  previousSchoolResultMediaType: string;
  previousSchoolResults: {
    id: string;
    fileUrl: string;
  }[];
}

export interface GuardianData {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  dob: string;
  nationality: string;
  company: string;
  gender: string;
  occupation: string;
  streetAddress: string;
  boxAddress: string;
  guardianPhone: string;
  guardianOtherPhone: string;
  guardianOtherPhoneOptional: string;
  headshotPath: string;
  headshotMediaType: string;
  headshotUrl: string;
}

export interface AdmissionDashboardInfo {
  summary: {
    totalApplications: number;
    acceptedApplications: number;
    rejectedApplications: number;
    pendingApplications: number;
  };
  monthlyTrends: {
    month: string;
    value: number;
  }[];
  weeklyTrends: {
    date: string;
    value: number;
  }[];
  statusBreakdown: {
    name: string;
    value: number;
    rate: string;
  }[];
  applicationsThisYear: number;
}

export interface AdminDashboardStats {
  averageAttendanceRate: number;
  totalApplications: number;
  totalStudents: number;
  totalTeachers: number;
  attendanceByClass: {
    name: string;
    "Attendence-Level": number;
  }[];
}

export interface AttendanceParams {
  classLevelId: string;
  filterType?: "month" | "week";
  month?: number;
  year?: number;
  week?: number;
}

export interface Month {
  month: number;
  year: number;
  attendance: {
    classLevel: ClassLevel;
    dateRange: {
      startDate: string;
      endDate: string;
      dates: string[];
    };
    student: {
      id: string;
      attendanceByDate: Record<string, string>;
    };
  };
}

export interface StudentAttendanceData {
  academicYear: string;
  student: Student;
  terms: Term[];
  summary: {
    totalAttendanceCount: number;
    totalPresentCount: number;
    totalAbsentCount: number;
    averageAttendanceRate: number;
  };
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent";
}

export interface PostAttendancePayload {
  date: string;
  records: AttendanceRecord[];
}

export interface Payment {
  feeTitle: string;
  feeAmount: number;
  dueDate: string;
  status: string;
  paymentMethod: string;
  paidDate: string;
  paidBy: string;
}

export type SchoolPaymentTransactionStatus =
  | "PENDING"
  | "PAID"
  | "UNPAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export interface SchoolPaymentFeeStructure {
  id: string;
  feeTitle: string | null;
  feeType: string;
  amount: number;
}

export interface SchoolPaymentAllocation {
  id: string;
  allocatedAmount: number;
  allocationOrder: number;
  feeStructure: SchoolPaymentFeeStructure | null;
}

export interface PaymentAppliedFee {
  feeTitle: string;
  periodLabel: string;
  amount: number;
}

export interface SchoolPaymentReceiptRow {
  id: string;
  receiptNumber: string;
  amount: number;
  issuedAt: string;
}

export interface SchoolPaymentTransaction {
  id: string;
  sessionId: string;
  orderId: string | null;
  hubtelTransactionId?: string | null;
  networkTransactionId?: string | null;
  provider: string;
  status: SchoolPaymentTransactionStatus;
  providerStatus: string | null;
  mobile: string | null;
  currency: string | null;
  amount: number;
  charges: number;
  amountAfterCharges: number;
  isFulfilled: boolean;
  paymentMethod: string | null;
  paymentDate: string | null;
  targetFeeStructureId: string | null;
  createdAt: string;
  updatedAt: string;
  student: Student;
  receipt: SchoolPaymentReceiptRow | null;
  allocations: SchoolPaymentAllocation[];
  periodLabel?: string | null;
  periodLabels?: string[];
  academicTermId?: string | null;
  academicCalendarId?: string | null;
  appliedFees?: PaymentAppliedFee[];
}

export interface SchoolPaymentsSummary {
  totalTransactions: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalAmountGhs?: number;
  totalPaidAmountGhs?: number;
}

export interface StudentPaymentsSummary {
  totalTransactions: number;
  totalPaidAmountGhs: number;
  pendingValueGhs: number;
  pendingCount: number;
  paidCount: number;
  totalAmountGhs?: number;
}

export interface PaymentFeeTypeFilter {
  id: string;
  title: string;
}

export interface PaginatedSchoolPaymentsResponse {
  data: SchoolPaymentTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary?: SchoolPaymentsSummary | StudentPaymentsSummary;
  filters?: {
    feeTypes: PaymentFeeTypeFilter[];
  };
}

export interface SchoolPaymentsListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  studentId?: string;
  feeStructureId?: string;
  dateFrom?: string;
  dateTo?: string;
  academicTermId?: string;
  academicCalendarId?: string;
}

export type PaymentConfigStatus = "ready" | "paused" | "not_onboarded";

export interface SchoolPaymentConfig {
  status: PaymentConfigStatus;
  canInitiatePayment: boolean;
  paymentSetupRequestSentAt?: string | null;
  hasRequestedPaymentSetup?: boolean;
}

export interface HubtelMerchant {
  clientId: string | null;
  collectionAccountNumber: string | null;
  active: boolean;
  configured: boolean;
  primaryCallbackUrl: string | null;
}

export interface HubtelMerchantConfigResponse {
  schoolId: string;
  merchant: HubtelMerchant;
}

export interface UpsertHubtelMerchantPayload {
  clientId: string;
  clientSecret: string;
  collectionAccountNumber: string;
  active?: boolean;
}

export interface SchoolPaymentReceiptDetail {
  id: string;
  receiptNumber: string;
  amount: number;
  issuedAt: string;
  school: School;
  student: Student;
  transaction: SchoolPaymentTransaction;
}

export type FinanceBalanceStatus = "all" | "owing" | "clear" | "prepaid";

export interface FinanceMoneyTotals {
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
  arrears: number;
  prepayment: number;
  netBalance: number;
}

export interface FinanceSchoolSummary {
  totalPayable: number;
  totalPaid: number;
  outstanding: number;
  arrears: number;
  prepayment: number;
  owingCount: number;
  prepaidCount: number;
}

export interface FinanceStudentRow extends FinanceMoneyTotals {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classLevelId: string | null;
  className: string | null;
  nextDueDate: string | null;
  hasPendingBalance: boolean;
}

export interface FinanceClassRow extends FinanceMoneyTotals {
  classLevelId: string;
  className: string;
  studentCount: number;
}

export interface FinanceStudentsListParams {
  page?: number;
  limit?: number;
  search?: string;
  classLevelId?: string;
  balanceStatus?: FinanceBalanceStatus;
  academicTermId?: string;
  academicCalendarId?: string;
}

export interface PaginatedFinanceStudentsResponse {
  data: FinanceStudentRow[];
  summary?: FinanceSchoolSummary;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FinanceClassesResponse {
  data: FinanceClassRow[];
}

export interface FinanceStudentIdentity {
  studentId: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  classLevelId: string | null;
  className: string | null;
}

export interface FinanceFeeLine {
  obligationId: string;
  feeStructureId: string;
  feeTitle: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amountDue: number;
  paid: number;
  outstanding: number;
  isArrear: boolean;
  dueDate: string | null;
  academicTermId?: string | null;
  academicCalendarId?: string | null;
}

export interface FinanceRecentPayment {
  id: string;
  date: string;
  amount: number;
  status: SchoolPaymentTransactionStatus | string;
  channel: string | null;
  studentName: string;
  studentCode: string;
  sessionId: string;
  periodLabel?: string | null;
  periodLabels?: string[];
  academicTermId?: string | null;
  academicCalendarId?: string | null;
  appliedFees?: PaymentAppliedFee[];
}

export interface FinanceStudentDetailTotals extends FinanceMoneyTotals {
  nextDueDate?: string | null;
  hasPendingBalance: boolean;
}

export interface FinanceStudentDetailResponse {
  student: FinanceStudentIdentity;
  totals: FinanceStudentDetailTotals;
  feeLines: FinanceFeeLine[];
  recentPayments: FinanceRecentPayment[];
  paymentMeta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type FinanceStudentDetailFilters = {
  academicTermId?: string;
  academicCalendarId?: string;
  paymentPage?: number;
  paymentLimit?: number;
};

export interface Subject {
  id?: string;
  name: string;
  description: string;
}

export interface TeacherSubject {
  id: string;
  name: string;
  description: string;
}

export interface AdminAssignment {
  id: string;
  title: string;
  instructions?: string | null;
  dueDate: string;
  maxScore: number;
  state: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  assignmentType?: "online" | "offline";
  termAggregatedScore?: number;
  topic: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
  } | null;
  classLevel: {
    id: string;
    name: string;
  } | null;
  academicTerm?: {
    id: string;
    termName: string;
  } | null;
  curriculum?: {
    id: string;
    name: string;
  } | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    teacherId: string;
  } | null;
  attachmentPath?: string | null;
  attachmentUrl?: string | null;
  attachmentMediaType?: string | null;
  submissions: number;
}

export interface Assignment {
  id: string;
  title: string;
  topicId: string;
  topic?: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
  status: "published" | "draft";
  submissions: number;
  isPublished: boolean;
  assignmentType?: "online" | "offline";
  termAggregatedScore?: number;
  classLevelId?: string;
  class?: string;
  attachmentPath?: string | null;
  attachmentUrl?: string | null;
  attachmentMediaType?: string | null;
}

export interface StudentAssignment {
  id: string;
  title: string;
  assignment: string;
  subject: string;
  topic?: string;
  teacher: string;
  dueDate: string;
  submittedDate?: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  status: "pending" | "submitted" | "graded";
  assignmentType?: "online" | "offline";
  daysOverdue?: number;
  instructions?: string;
  attachmentPath?: string;
  attachmentUrl?: string;
  attachmentMediaType?: string;
  submissionId?: string | null;
  feedback?: string | null;
}

export interface AssignmentSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  hasSubmitted: boolean;
  submissionId: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  assignmentType?: "online" | "offline";
  termAggregatedScore?: number;
}

export interface AssignSubjectTeacherPayload {
  subjectCatalogId: string;
  classLevelIds: string[];
  teacherId: string;
}

export interface ClassSubjectInfo {
  classLevel: ClassLevel;
  subjects: {
    id: string;
    name: string;
  }[];
}

export type PostGradesPayload = {
  classLevelId: string;
  subjectId: string;
  academicTermId: string;
  saveMode: "draft" | "submit";
  forceSubmit?: boolean;
  grades: {
    studentId: string;
    classScore: number | null;
    examScore: number | null;
    feedback?: string | null;
  }[];
};

export type GradingBandPreview = {
  code: string;
  label: string;
  minScore: number;
  maxScore: number;
};

export type StudentsForGradingResponse = {
  metadata: {
    subject: { id: string; name: string };
    classLevel: { id: string; name: string };
    academicTerm: { id: string; name: string };
    academicCalendar: { id: string; name: string };
    isApproved: boolean;
    approvedAt?: string;
    schoolAdminApproved: boolean;
    schoolAdminApprovedAt?: string;
    resultStatus?: string;
    returnNote?: string | null;
    allowManualOverride?: boolean;
    passMark?: number;
    classScoreMax: number;
    examScoreMax: number;
    gradingBands: GradingBandPreview[];
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    isArchived?: boolean;
    archivedAt?: string | null;
    hasGradeRecord?: boolean;
    feedback?: string | null;
    status?: "draft" | "submitted" | null;
    scores: {
      classScore: number | null;
      examScore: number | null;
      totalScore: number | null;
      grade: string | null;
      gradeLabel: string | null;
    };
  }>;
};

export interface GradingLegendBand {
  code: string;
  label: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
}

export interface SubjectResult {
  subject: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradeLabel?: string | null;
  bandDescription?: string | null;
  feedback?: string | null;
  percentage: string;
  percentile?: string;
  rank?: string;
  hasOverride?: boolean;
  overrideReason?: string | null;
}

export interface TermResult {
  termName: string;
  termId?: string;
  resultStatus?: string;
  isPublished?: boolean;
  subjects: SubjectResult[];
  teacherRemarks: string;
  remarksBy?: string;
}

export interface StudentResultsResponse {
  studentInfo: {
    academicYear: string;
    class: string;
    term?: string;
  };
  terms: TermResult[];
  subjects?: SubjectResult[];
  teacherRemarks?: string;
  remarksBy?: string;
  gradingLegend?: GradingLegendBand[];
  passMark?: number;
}

/** One graded submission under a topic (performance analytics API) */
export interface TopicAssignmentGradeDetail {
  submissionId: string;
  assignmentId: string;
  title: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  dueDate: string;
  assignmentType: "online" | "offline";
  submissionStatus: string;
  submittedAt: string;
  gradedAt: string;
  classLevelName: string;
}

/** GET .../students/:id/performance-analytics — school admin & teacher (scoped) */
export interface StudentPerformanceAnalytics {
  academicCalendar: { id: string; name: string };
  selectedTerm: { id: string; termName: string };
  summary: {
    gradedAssignmentsCount: number;
    assignmentAveragePercent: number | null;
  };
  subjectAssignmentPerformance: Array<{
    subjectCatalogId: string;
    subjectName: string;
    gradedCount: number;
    averagePercent: number | null;
    topics: Array<{
      topicId: string;
      topicName: string;
      gradedCount: number;
      averagePercent: number | null;
      assignments: TopicAssignmentGradeDetail[];
    }>;
  }>;
}

/** Performance cluster buckets used across the analytics endpoints */
export type PerformanceCluster =
  | "Below Expectations"
  | "Developing"
  | "On Track"
  | "Meeting Expectations";

/** One ranked student row in the class subject-performance breakdown */
export interface ClassSubjectPerformanceStudent {
  studentId: string;
  studentName: string;
  classLevelName: string;
  subjectName: string;
  aggregatedScore: number | null;
  rank: number;
  cluster: PerformanceCluster | null;
}

export interface ClassSubjectPerformanceResponse {
  classLevel: { id: string; name: string };
  academicTerm: { id: string; termName: string };
  subject: { id: string; name: string };
  aggregation: {
    asOfDate: string;
    latestGradedAt: string | null;
    gradedAssignmentsCount: number;
  };
  summary: {
    totalStudents: number;
    classAverage: number | null;
    medianScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  clusterDistribution: {
    belowExpectations: number;
    developing: number;
    onTrack: number;
    meetingExpectations: number;
  };
  students: ClassSubjectPerformanceStudent[];
}

/** One topic row in the student topic-performance breakdown */
export interface StudentTopicPerformanceTopic {
  topicId: string;
  topicName: string;
  studentAggregatedScore: number | null;
  classAverage: number | null;
  range: { min: number | null; max: number | null };
  median: number | null;
  testCount: number;
  cluster: PerformanceCluster | null;
}

export interface StudentTopicPerformanceResponse {
  student: {
    id: string;
    name: string;
    classLevelName: string;
    overallAveragePercent: number | null;
    cluster: PerformanceCluster | null;
  };
  academicTerm: { id: string; termName: string };
  subject: { id: string; name: string };
  topics: StudentTopicPerformanceTopic[];
}

export interface TeacherAnalyticsSubjectsResponse {
  classLevelId: string;
  isClassTeacher: boolean;
  subjects: Array<{ id: string; name: string }>;
}

export enum NotificationType {
  Admission = "admission",
  Attendance = "attendance",
  Results = "results",
  Fee = "fee",
  General = "general",
  ClassTeacherResultSubmission = "classTeacherResultSubmission",
  ParentInvitation = "parentInvitation",
  ParentAccepted = "parentAccepted",
  ParentChildConfirmation = "parentChildConfirmation",
  ParentChildConfirmed = "parentChildConfirmed",
  ParentReviewRequired = "parentReviewRequired",
  ParentAccessRevoked = "parentAccessRevoked",
  AssignmentPublished = "assignmentPublished",
  AssignmentUpdated = "assignmentUpdated",
  AssignmentSubmitted = "assignmentSubmitted",
  AssignmentGraded = "assignmentGraded",
  CurriculumNote = "curriculumNote",
  CurriculumNoteReply = "curriculumNoteReply",
  GradesSubmitted = "gradesSubmitted",
  ClassResultsSubmitted = "classResultsSubmitted",
  ResultsReleased = "resultsReleased",
  ResultsUnlocked = "resultsUnlocked",
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  read?: boolean;
  createdAt?: string;
  schoolId: string;
}

export interface Reminder {
  id: string;
  title: string;
  message: string;
  status: string;
  type: string;
  dateFrom?: string;
  to?: string;
  createdAt: string;
  updatedAt: string;
  recipientId?: string;
  sendToStudents: boolean;
  sendToParents: boolean;
  targetClassLevels: ClassLevel[];
  targetStudents: Student[];
  targetClassLevelIds: string[];
  targetStudentIds: string[];
  scheduledAt?: string | null;
  recurringAt?: string | null;
}

export interface ApproveClassResultsPayload {
  classLevelId: string;
  action?: "approve" | "unapprove";
  forceApprove?: boolean;
  academicTermId?: string;
}

export interface MissingGradesResponse {
  message: string;
  approved: boolean;
  missingGrades: MissingGrade[];
}

export interface MissingGrade {
  student: Student;
  missingSubjects: MissingSubject[];
}

export interface MissingSubject {
  subjectId: string;
  subjectName: string;
  teacher: Teacher;
}

export interface CurriculumPayload {
  name: string;
  description?: string;
  isActive?: boolean;
  subjectCatalogIds: string[];
  academicTermId: string;
}

export interface SubjectOption {
  value: string;
  label: string;
}

export interface CurriculumRecord {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subjectCatalogIds?: string[];
  subjectCatalogs?: Array<{ id: string; name: string }>;
  academicTerm?: {
    id: string;
    name?: string;
    termName?: string;
    academicCalendar?: {
      id: string;
      name: string;
    };
  };
  academicCalendar?: {
    id: string;
    name: string;
  };
}

export interface CurriculumItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subjectCatalogIds?: string[];
  subjectCatalogs: SubjectCatalog[];
  academicTerm?: {
    id: string;
    name?: string;
    termName?: string;
    /** YYYY-MM-DD — term window for planned topic dates */
    startDate?: string | null;
    endDate?: string | null;
    academicCalendar?: { id: string; name: string };
  };
}

export interface CurriculumProgressDashboardTeacher {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export interface CurriculumProgressDashboardSummary {
  totalTopics: number;
  completed: number;
  pending: number;
  avgProgress: number;
}

export interface CurriculumProgressDashboardRow {
  subjectId: string;
  teacher: CurriculumProgressDashboardTeacher;
  classLevel: { id: string; name: string };
  subjectCatalog: { id: string; name: string };
  topicId: string;
  topicName: string;
  topicDescription?: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  progressPercent: number;
  status: "pending" | "completed";
  dateCompleted: string | null;
}

export interface CurriculumProgressDashboardData {
  summary: CurriculumProgressDashboardSummary;
  rows: CurriculumProgressDashboardRow[];
}

export interface CurriculumTopicDetailSubtopic {
  id: string;
  name: string;
  description?: string | null;
  completed: boolean;
  completedAt: string | null;
}

export interface Subtopic {
  name: string;
  description?: string;
}

export interface CreateSubtopicPayload {
  name: string;
  description?: string;
}

export interface UpdateSubtopicPayload {
  name?: string;
  description?: string;
}

export interface CurriculumTopicDetailData {
  topic: {
    id: string;
    name: string;
    description?: string | null;
    plannedStartDate: string | null;
    plannedEndDate: string | null;
    progressPercent: number;
    status: "pending" | "completed";
    dateCompleted: string | null;
    weekDuration: number | null;
    weekNumber: number | null;
    weekLabel: string | null;
  };
  subject: {
    id: string;
    subjectCatalog: { id: string; name: string };
    teacher: {
      id: string;
      firstName?: string;
      lastName?: string;
      name?: string;
    } | null;
    classLevels: Array<{ id: string; name: string }>;
    activeClassLevel: { id: string; name: string };
  };
  academicTerm: {
    id: string;
    termName: string;
    /** YYYY-MM-DD — bounds for planned topic dates (from API) */
    startDate?: string | null;
    endDate?: string | null;
  };
  subtopics: CurriculumTopicDetailSubtopic[];
}

export interface CurriculumTopicNote {
  id: string;
  content: string;
  createdAt: string;
  authorRole?: string;
  replies?: CurriculumTopicNote[];
}

export interface CreateCurriculumTopicNotePayload {
  topicId: string;
  content: string;
  subjectId?: string;
  parentId?: string;
  academicTermId?: string;
}

/** GET /teacher/curriculum/progress */
export interface TeacherProgressSubtopicRow {
  id: string;
  name: string;
  completed: boolean;
  completedAt: string | null;
}

export interface TeacherProgressTopicCard {
  subjectId: string;
  classLevelId: string | null;
  /** Present when classLevelId is set; helps distinguish duplicate topic rows in “All classes”. */
  classLevelName?: string | null;
  topicId: string;
  name: string;
  description: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  progressPercent: number;
  status: "pending" | "completed";
  weekLabel: string | null;
  subtopicCounts: { total: number; completed: number };
  notesCount: number;
  subtopics: TeacherProgressSubtopicRow[];
}

export interface TeacherCurriculumProgressDashboard {
  selection: {
    academicTermId: string;
    subjectId: string | null;
    classLevelId: string | null;
  };
  overall: {
    totalTopics: number;
    completedTopics: number;
    pendingTopics: number;
    avgProgress: number;
    completedLabel: string;
  };
  topics: TeacherProgressTopicCard[];
}

export interface SubjectCatalog {
  id: string;
  name: string;
  description?: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  subjectCatalog?: SubjectCatalog;
  curriculum?: CurriculumItem;
  academicTermId?: string;
  academicTerm?: {
    id: string;
    termName?: string;
    name?: string;
    startDate?: string | null;
    endDate?: string | null;
  };
}

export interface TopicPayload {
  name: string;
  description?: string;
  subjectCatalogId: string;
  curriculumId: string;
  academicTermId: string;
  /** ISO date string (YYYY-MM-DD). Use `null` on PATCH to clear. */
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
}

/** POST /curriculum/topics/duplicate-to-term */
export interface DuplicateTopicsToTermPayload {
  sourceAcademicTermId: string;
  targetAcademicTermId: string;
  duplicateAllFromSource?: boolean;
  topicIds?: string[];
}

/** POST /teacher/topics, PATCH /teacher/topics/:id */
export interface TeacherTopicPayload {
  name: string;
  description?: string;
  subjectCatalogId: string;
  /** Required on POST; omitted on PATCH if unchanged */
  academicTermId?: string;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
}

export enum VisibilityScope {
  SCHOOL_WIDE = "school_wide",
  CLASS_LEVEL = "class_level",
  SUBJECT = "subject",
  TEACHERS = "teachers",
}

export interface EventCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAttachment {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mediaType: string;
  uploadedAt: string;
  signedUrl?: string | null; // Signed URL from backend
}

export interface EventReminder {
  id: string;
  reminderTime: string;
  sent: boolean;
  notificationType: "email" | "sms" | "both";
  createdAt: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  sendNotifications?: boolean;
  location?: string;
  category?: EventCategory;
  categoryId: string;
  visibilityScope: VisibilityScope;
  targetClassLevelIds?: string[];
  targetSubjectIds?: string[];
  targetClassLevels?: ClassLevel[];
  targetSubjects?: Subject[];
  attachments?: EventAttachment[];
  reminders?: EventReminder[];
  createdByTeacherId?: string;
  createdByAdminId?: string;
  createdByTeacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdByAdmin?: {
    id: string;
    firstName: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlannerEventPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  location?: string;
  categoryId: string;
  visibilityScope: VisibilityScope;
  targetClassLevelIds?: string[];
  targetSubjectIds?: string[];
  reminders?: Array<{
    reminderTime: string;
    notificationType?: "email" | "sms" | "both";
  }>;
  files?: File[];
  sendNotifications?: boolean;
}

export interface CreateEventCategoryPayload {
  name: string;
  description?: string;
  color: string;
}
