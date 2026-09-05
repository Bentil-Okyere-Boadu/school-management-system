import { Student } from '../student/student.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Parent } from '../parent/parent.entity';
import { ParentStudent } from '../parent/parent-student.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Profile } from '../profile/profile.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { ClassLevelResultApproval } from '../class-level/class-level-result-approval.entity';
import { GradeSubmissionHistory } from '../class-level/grade-submission-history.entity';
import { AcademicCalendar } from '../academic-calendar/entitites/academic-calendar.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { Holiday } from '../academic-calendar/entitites/holiday.entity';
import { Subject } from '../subject/subject.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { StudentGrade } from '../subject/student-grade.entity';
import { StudentTermRemark } from '../subject/student-term-remark.entity';
import { Curriculum } from '../curriculum/entities/curriculum.entity';
import { Topic } from '../curriculum/entities/topic.entity';
import { Subtopic } from '../curriculum/entities/subtopic.entity';
import { SubtopicCompletion } from '../curriculum/entities/subtopic-completion.entity';
import { CurriculumTopicNote } from '../curriculum/entities/curriculum-topic-note.entity';
import { Assignment } from '../teacher/entities/assignment.entity';
import { AssignmentSubmission } from '../student/entities/assignment-submission.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Admission } from '../admission/admission.entity';
import { Guardian } from '../admission/guardian.entity';
import { PreviousSchoolResult } from '../admission/previous-school-result.entity';
import { AdmissionPolicy } from '../admission-policy/admission-policy.entity';
import { FeeStructure } from '../fee-structure/fee-structure.entity';
import { GradingSystem } from '../grading-system/grading-system.entity';
import { GradingScheme } from '../grading-scheme/grading-scheme.entity';
import { GradingSchemeBand } from '../grading-scheme/grading-scheme-band.entity';
import { Event } from '../planner/entities/event.entity';
import { EventCategory } from '../planner/entities/event-category.entity';
import { EventAttachment } from '../planner/entities/event-attachment.entity';
import { EventReminder } from '../planner/entities/event-reminder.entity';
import { Notification } from '../notification/notification.entity';
import { MessageReminder } from '../notification/entities/message-reminder.entity';
import { PaymentTransaction } from '../payments/entities/payment-transaction.entity';
import { PaymentReceipt } from '../payments/entities/payment-receipt.entity';
import { PaymentAllocation } from '../payments/entities/payment-allocation.entity';
import { PaymentProviderEvent } from '../payments/entities/payment-provider-event.entity';
import { StudentFeeObligation } from '../payments/entities/student-fee-obligation.entity';
import { StudentCreditBalance } from '../payments/entities/student-credit-balance.entity';
import { CheckoutOtp } from '../payments/entities/checkout-otp.entity';

/** Operational entities cloned into each tenant_<uuid> schema. No School/Role. */
export const TENANT_ENTITIES = [
  Profile,
  SchoolAdmin,
  Student,
  Teacher,
  Parent,
  ParentStudent,
  ClassLevel,
  ClassLevelResultApproval,
  GradeSubmissionHistory,
  AcademicCalendar,
  AcademicTerm,
  Holiday,
  SubjectCatalog,
  Subject,
  StudentGrade,
  StudentTermRemark,
  Curriculum,
  Topic,
  Subtopic,
  SubtopicCompletion,
  CurriculumTopicNote,
  Assignment,
  AssignmentSubmission,
  Attendance,
  Admission,
  Guardian,
  PreviousSchoolResult,
  AdmissionPolicy,
  FeeStructure,
  GradingSystem,
  GradingScheme,
  GradingSchemeBand,
  EventCategory,
  Event,
  EventAttachment,
  EventReminder,
  Notification,
  MessageReminder,
  PaymentTransaction,
  PaymentReceipt,
  PaymentAllocation,
  PaymentProviderEvent,
  StudentFeeObligation,
  StudentCreditBalance,
  CheckoutOtp,
];
