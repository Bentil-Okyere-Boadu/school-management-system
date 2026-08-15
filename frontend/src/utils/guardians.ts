import { Parent } from "@/@types";

export const GUARDIAN_RELATIONSHIP_OPTIONS = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Other", label: "Other" },
];

export function relationshipSelectData(current?: string) {
  const options = [...GUARDIAN_RELATIONSHIP_OPTIONS];
  const value = current?.trim();
  if (value && !options.some((option) => option.value === value)) {
    options.push({ value, label: value });
  }
  return options;
}

export function validateGuardianIdentity(guardian: Partial<Parent>): string | null {
  if (!guardian.firstName?.trim()) {
    return "First name is required.";
  }
  if (!guardian.lastName?.trim()) {
    return "Last name is required.";
  }
  if (!guardian.relationship?.trim()) {
    return "Relationship is required.";
  }
  const email = guardian.email?.trim() ?? "";
  if (!email) {
    return "Email is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}
