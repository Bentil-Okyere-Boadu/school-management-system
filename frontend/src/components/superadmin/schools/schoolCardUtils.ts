import { School } from "@/@types";

export function canRemoveSchool(school: School): boolean {
  if ((school.adminSummary?.activeAdmins ?? 0) > 0) {
    return false;
  }
  if (school.provisioningStatus === "provisioning") {
    return false;
  }
  return true;
}
