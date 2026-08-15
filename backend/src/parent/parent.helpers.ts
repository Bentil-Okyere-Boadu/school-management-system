import { Parent } from './parent.entity';
import { ParentStudent } from './parent-student.entity';
import { ParentStudentStatus } from './parent.enums';
import { Student } from '../student/student.entity';

export function normalizeEmail(email?: string | null): string | null {
  if (!email) {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/[^\d+]/g, '').trim();
  return digits.length ? digits : null;
}

export function namesCompatible(
  aFirst?: string | null,
  aLast?: string | null,
  bFirst?: string | null,
  bLast?: string | null,
): boolean {
  const norm = (value?: string | null) => (value ?? '').trim().toLowerCase();
  const firstA = norm(aFirst);
  const lastA = norm(aLast);
  const firstB = norm(bFirst);
  const lastB = norm(bLast);
  const firstOk = !firstA || !firstB || firstA === firstB;
  const lastOk = !lastA || !lastB || lastA === lastB;
  return firstOk && lastOk;
}

export function phonesCompatible(
  a?: string | null,
  b?: string | null,
): boolean {
  const phoneA = normalizePhone(a);
  const phoneB = normalizePhone(b);
  return !phoneA || !phoneB || phoneA === phoneB;
}

export function guardianDetailsCompatible(
  existing: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  },
  incoming: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  },
): boolean {
  return (
    namesCompatible(
      existing.firstName,
      existing.lastName,
      incoming.firstName,
      incoming.lastName,
    ) && phonesCompatible(existing.phone, incoming.phone)
  );
}

export function isActiveRelationship(link?: ParentStudent | null): boolean {
  return link?.status === ParentStudentStatus.Active && !!link.parent && !!link.student;
}

export function getContactParents(student: Student): Parent[] {
  const fromLinks = (student.parentStudents ?? [])
    .filter(
      (link) =>
        link.status !== ParentStudentStatus.Revoked && !!link.parent,
    )
    .map((link) => link.parent);

  if (fromLinks.length > 0) {
    const seen = new Set<string>();
    return fromLinks.filter((parent) => {
      if (seen.has(parent.id)) {
        return false;
      }
      seen.add(parent.id);
      return true;
    });
  }

  return student.parents ?? [];
}
