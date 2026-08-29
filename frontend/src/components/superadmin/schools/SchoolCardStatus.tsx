"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import InviteSchoolAdminFields from "./InviteSchoolAdminFields";
import {
  emptyInviteSchoolAdminValues,
  InviteSchoolAdminFormValues,
  isInviteSchoolAdminValid,
  useInviteSchoolAdmin,
} from "@/hooks/invite-school-admin";
import {
  useProvisionSchool,
  useResendSchoolAdminInvitation,
} from "@/hooks/super-admin";
import { ErrorResponse, School } from "@/@types";

interface SchoolCardStatusProps {
  school: School;
}

const pillClasses = "inline-block rounded-full px-2 py-0.5 text-[11px]";
const actionClasses = "!px-2 !py-1 !text-xs !w-full max-sm:!w-full";

const errorMessage = (error: unknown, fallback: string) =>
  (error as ErrorResponse)?.response?.data?.message ||
  (error as { message?: string })?.message ||
  fallback;

const SchoolCardStatus: React.FC<SchoolCardStatusProps> = ({ school }) => {
  const [dialogMode, setDialogMode] = useState<"invite" | "resend" | null>(
    null,
  );
  const [formValues, setFormValues] = useState<InviteSchoolAdminFormValues>(
    emptyInviteSchoolAdminValues,
  );

  const { mutate: provisionSchool, isPending: isProvisioning } =
    useProvisionSchool();
  const { mutate: resendInvitation, isPending: isResending } =
    useResendSchoolAdminInvitation();
  const { inviteSchoolAdmin, isInviting } = useInviteSchoolAdmin();

  const status = school.provisioningStatus ?? "not_provisioned";
  const summary = school.adminSummary;
  const pendingInvitation = summary?.pendingInvitation ?? null;
  const hasAdmin = (summary?.activeAdmins ?? 0) > 0;
  const isResend = dialogMode === "resend";
  const isBusy = isResend ? isResending : isInviting;

  const closeDialog = () => {
    setDialogMode(null);
    setFormValues(emptyInviteSchoolAdminValues);
  };

  const openInvite = () => {
    setFormValues(emptyInviteSchoolAdminValues);
    setDialogMode("invite");
  };

  const openResend = () => {
    if (!pendingInvitation) return;
    setFormValues({
      firstName: pendingInvitation.firstName,
      lastName: pendingInvitation.lastName,
      email: pendingInvitation.email,
    });
    setDialogMode("resend");
  };

  const submitInvite = () => {
    inviteSchoolAdmin(school.id, formValues, { onSuccess: closeDialog });
  };

  const submitResend = () => {
    if (!pendingInvitation) return;
    if (!isInviteSchoolAdminValid(formValues)) {
      toast.error("First name, last name and email are required.");
      return;
    }
    resendInvitation(
      {
        invitationId: pendingInvitation.id,
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim(),
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${formValues.email.trim()}.`);
          closeDialog();
        },
        onError: (error: unknown) =>
          toast.error(errorMessage(error, "Unable to resend the invitation.")),
      },
    );
  };

  const handleProvision = () => {
    provisionSchool(school.id, {
      onSuccess: () => toast.success(`${school.name} is now provisioned.`),
      onError: (error: unknown) =>
        toast.error(errorMessage(error, "Provisioning failed.")),
    });
  };

  const renderState = () => {
    if (school.isDisabled) {
      return (
        <span className={`${pillClasses} bg-gray-200 text-gray-700`}>
          Disabled
        </span>
      );
    }

    if (status === "provisioning") {
      return (
        <span className={`${pillClasses} bg-amber-100 text-amber-800`}>
          Provisioning...
        </span>
      );
    }

    if (status !== "active") {
      const failed = status === "failed";
      return (
        <>
          <span
            className={`${pillClasses} ${failed ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"}`}
            title={failed ? (school.lastProvisionError ?? undefined) : undefined}
          >
            {failed ? "Provision failed" : "Not provisioned"}
          </span>
          <CustomButton
            text={isProvisioning ? "Provisioning..." : "Provision"}
            variant="outline"
            className={actionClasses}
            onClick={handleProvision}
            loading={isProvisioning}
          />
        </>
      );
    }

    if (hasAdmin) {
      return (
        <span className={`${pillClasses} bg-green-100 text-green-800`}>
          Admin active
        </span>
      );
    }

    if (pendingInvitation) {
      return (
        <>
          <span
            className={`${pillClasses} bg-blue-100 text-blue-800`}
            title={`Invited ${pendingInvitation.email}`}
          >
            Invite sent
          </span>
          <CustomButton
            text="Resend"
            variant="outline"
            className={actionClasses}
            onClick={openResend}
          />
        </>
      );
    }

    return (
      <>
        <span className={`${pillClasses} bg-violet-100 text-violet-800`}>
          No admin yet
        </span>
        <CustomButton
          text="Invite admin"
          className={actionClasses}
          onClick={openInvite}
        />
      </>
    );
  };

  return (
    <div className="mt-2 flex w-[164px] flex-col items-start gap-1.5">
      {renderState()}

      <Dialog
        isOpen={dialogMode !== null}
        dialogTitle={
          isResend ? "Resend invitation" : "Invite school administrator"
        }
        subheader={school.name}
        saveButtonText={isResend ? "Resend invite" : "Send invite"}
        cancelButtonText="Cancel"
        onClose={closeDialog}
        onSave={isResend ? submitResend : submitInvite}
        busy={isBusy}
        saveDisabled={!isInviteSchoolAdminValid(formValues) || isBusy}
      >
        <InviteSchoolAdminFields
          values={formValues}
          onChange={setFormValues}
          busy={isBusy}
          helpText={
            isResend
              ? "Check the name and email before resending. A correction replaces the pending invitation."
              : undefined
          }
        />
      </Dialog>
    </div>
  );
};

export default SchoolCardStatus;
