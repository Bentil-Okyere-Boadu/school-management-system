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
  DateOfBirth?: string,
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
  description: string
  isApproved: boolean,
  schoolAdminApproved: boolean
}

export interface Student extends User {
  studentId: string;
  parents: Parent[];
  classLevels: ClassLevel[];
  isInvitationAccepted: boolean;
  isArchived: boolean;
}

export interface Teacher extends User {
  teacherId: string;
  isArchived: boolean;
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
  PARENT = "parent"
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
  appliesTo: string;
  dueDate: string;
  classLevelIds: string[];
}

export type Grade = {
  grade: string;
  minRange: number | null;
  maxRange: number | null;
  id: string;
  }

export type SchoolAdminInfo = {
  email: string;
  firstName: string;
  lastName: string;
  phoneContact: string;
  address: string;
  name: string;
  role: {
    label: string;
  }
  streetAddress?: string;
  optionalPhoneContact?: string;
}


export interface GradingSystem {
  id: string;
  grade: string;
  minRange: number;
  maxRange: number;
}

export interface School {
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
}

export enum AdmissionStatus {
  SUBMITTED = 'Application Submitted',
  INTERVIEW_COMPLETED = 'Interview Completed',
  INTERVIEW_PENDING = 'Interview Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  WAITLISTED = 'Waitlisted',
  ARCHIVED = 'Archived'
}

export type BadgeVariant =
  | "purple"
  | "red"
  | "indigo"
  | "blue"
  | "green"
  | "yellow"
  | "gray" | "active" | "inactive" | "pending"
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
  }[]
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
  }
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
    'Attendence-Level': number;
  }[]
}

export interface AttendanceParams {
  classLevelId: string;
  filterType?: "month" | "week";
  month?: number;
  year?: number;
  week?: number;
}

export interface Month {
  month: number,
  year: number,
  attendance: {
    classLevel: ClassLevel,
    dateRange: {
      startDate: string;
      endDate: string;
      dates: string[]
    },
    student: {
      id: string;
      attendanceByDate: Record<string, string>;
    }
  }
}

export interface StudentAttendanceData {
  academicYear: string;
  student: Student;
  terms: Term[];
  summary: {
    totalAttendanceCount: number,
    totalPresentCount: number,
    totalAbsentCount: number,
    averageAttendanceRate: number
  }
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

export interface Subject {
  id?: string;
  name: string;
  description: string;
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
};

export type PostGradesPayload = {
  classLevelId: string;
  subjectId: string;
  academicTermId: string;
  grades: {
    studentId: string;
    classScore: number;
    examScore: number;
  }[];
};

export interface SubjectResult {
  subject: string;
  classScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  percentage: string;
  percentile: string;
  rank: string;
}

export interface TermResult {
  termName: string;
  subjects: SubjectResult[];
  teacherRemarks: string;
}

export interface StudentResultsResponse {
  studentInfo: {
    academicYear: string;
    class: string;
    term: string;
  };
  terms: TermResult[];
  subjects: SubjectResult[];
  teacherRemarks: string;
  remarksBy: string;
}

export enum NotificationType {
  Admission = 'admission',
  Attendance = 'attendance',
  Results = 'results',
  General = 'general',
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
  targetClassLevels: ClassLevel[]
  targetStudents: Student[]
  targetClassLevelIds: string[]
  targetStudentIds: string[]
  scheduledAt?: string | null;
  recurringAt?: string | null;
}

export interface ApproveClassResultsPayload {
  classLevelId: string;
  forceApprove: boolean;
};

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

export interface CurriculumItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subjectCatalogIds?: string[];
  subjectCatalogs: SubjectCatalog[];
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
  subjectCatalog?: SubjectCatalog;
  curriculum?: CurriculumItem;
}

export interface TopicPayload {
    name: string;
    description?: string;
    subjectCatalogId: string;
    curriculumId: string;
}