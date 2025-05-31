export enum ButtonType {
  submit = "submit",
  reset = "reset",
  button = "button",
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
  profile: {
    avatarUrl?: string;
  }
  date: string;
}

export interface Student extends User {
  studentId: string;
  isInvitationAccepted: boolean;
  isArchived: boolean;
}

export type AuthCredentials = Pick<User, "email" | "password">;
export type SignUpPayload = Pick<User, "email" | "password" | "name" | "role">;

export enum Roles {
  SCHOOL_ADMIN = "admin",
  STUDENT = "student",
  TEACHER = "teacher",
  SUPER_ADMIN = "super_admin",
  PARENT = "parent"
}

export type Role = {
  id: string;
  name: keyof typeof Roles;
};

export type FeeStructure = {
  id: string;
  feeTitle: string;
  feeType: string;
  amount: number;
  appliesTo: string;
  dueDate: string;
  classes: string[];
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
}

export type BadgeVariant =
  | "purple"
  | "red"
  | "indigo"
  | "blue"
  | "green"
  | "yellow"
  | "gray" | "active" | "inactive" | "pending";

export interface Calendar {
  id: string;
  name: string;
  terms: Term[];
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  termName: string;
  holidays: Holiday[];
  academicCalendarId?: string;
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