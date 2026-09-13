import { BadgeVariant, Parent } from "@/@types";

export type GuardianPortalResendAction = "invitation" | "confirmation";

export type GuardianPortalState = {
  label: string;
  variant: BadgeVariant;
  resendAction: GuardianPortalResendAction | null;
  helperText?: string;
};

export function getGuardianPortalState(
  parent: Parent,
): GuardianPortalState | null {
  const email = parent.email?.trim();
  if (!email) {
    return null;
  }

  const relationshipStatus = parent.relationshipStatus;
  const accountStatus = parent.status ?? "pending";

  if (relationshipStatus === "active") {
    return { label: "Portal active", variant: "active", resendAction: null };
  }

  if (relationshipStatus === "pending_review") {
    return {
      label: "Needs review",
      variant: "yellow",
      resendAction: null,
      helperText: "Details conflict with an existing parent record and need admin review.",
    };
  }

  if (parent.invitationExpired) {
    return {
      label: "Invitation expired",
      variant: "red",
      resendAction: "invitation",
      helperText:
        "The registration link expired. Resend a new invitation to the parent.",
    };
  }

  if (relationshipStatus === "pending_confirmation") {
    if (accountStatus === "active") {
      return {
        label: "Awaiting confirmation",
        variant: "pending",
        resendAction: "confirmation",
        helperText: "Parent must confirm this child from the email we sent.",
      };
    }

    return {
      label: "Invitation pending",
      variant: "pending",
      resendAction: "invitation",
      helperText: "Parent must register before they can confirm this child.",
    };
  }

  if (accountStatus === "pending" || !parent.isInvitationAccepted) {
    return {
      label: "Invitation pending",
      variant: "pending",
      resendAction: "invitation",
      helperText: "Registration link sent. Resend if they did not receive it.",
    };
  }

  if (accountStatus === "active") {
    return { label: "Portal active", variant: "active", resendAction: null };
  }

  return null;
}
