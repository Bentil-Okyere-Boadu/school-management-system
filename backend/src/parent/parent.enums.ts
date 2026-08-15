export enum ParentStudentStatus {
  Pending = 'pending',
  PendingConfirmation = 'pending_confirmation',
  PendingReview = 'pending_review',
  Active = 'active',
  Revoked = 'revoked',
}

export enum ParentStudentSource {
  Admission = 'admission',
  StudentProfile = 'student_profile',
  Admin = 'admin',
  Migration = 'migration',
}

export enum ParentAccountStatus {
  Pending = 'pending',
  Active = 'active',
  Suspended = 'suspended',
  Archived = 'archived',
}
