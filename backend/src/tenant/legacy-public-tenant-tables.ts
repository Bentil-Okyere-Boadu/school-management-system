/**
 * Public-schema table names that are tenant operational data under older
 * TypeORM synchronize names. None of these identifiers appear in application
 * queries today (planner SQL uses event_class_levels / event_subject_catalogs
 * unqualified, which resolve via tenant search_path).
 *
 * Current mapping: Event → "event"; join tables event_class_levels,
 * event_subject_catalogs.
 */
export const LEGACY_PUBLIC_TENANT_TABLES: readonly string[] = [
  'planner_event',
  'planner_event_class_levels',
  'planner_event_subject_catalogs',
  'planner_event_subjects',
  'planner_event_category',
  'planner_event_attachment',
  'planner_event_reminder',
  'event_subjects',
  'event_subject',
  'event_targetClassLevels_class_level',
  'event_targetSubjects_subject_catalog',
  'event_target_class_levels_class_level',
  'event_target_subjects_subject_catalog',
];

export const PLATFORM_PUBLIC_TABLES: readonly string[] = [
  'school',
  'role',
  'refresh_token',
  'super_admin',
  'super_admin_profile',
  'tenant_directory',
  'platform_invitation',
  'migrations',
  'typeorm_metadata',
  'platform_audit_log',
  'tenant_audit_log',
];
