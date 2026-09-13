import { Parent, ErrorResponse } from "@/@types";
import Badge from "@/components/common/Badge";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import {
  useResendParentChildConfirmation,
  useResendParentInvitation,
} from "@/hooks/school-admin";
import { useDeleteGuardian, useUpdateGuardian } from "@/hooks/student";
import GuardianFormFields from "./GuardianFormFields";
import { validateGuardianIdentity } from "@/utils/guardians";
import { getGuardianPortalState } from "@/utils/guardianPortal";
import { IconPencil, IconSend2, IconTrashFilled } from "@tabler/icons-react";
import React, { useState } from "react";
import { toast } from "react-toastify";

interface GuardianProps {
  parent: Parent;
  count: number;
  viewMode: boolean;
  studentId: string;
  canManage: boolean;
  asAdmin?: boolean;
  refetchStudentData: () => void;
}

const Guardian = ({
  parent,
  count,
  viewMode,
  studentId,
  canManage,
  asAdmin = false,
  refetchStudentData,
}: GuardianProps) => {
  const [editParent, setEditParent] = useState(parent);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const portalState = getGuardianPortalState(parent);
  const canResend =
    canManage && asAdmin && parent.id && portalState?.resendAction;

  const { mutate: deleteGuardianMutation, isPending: isDeletePending } =
    useDeleteGuardian(parent?.id as string, { studentId, asAdmin });
  const { mutate: updateParentMutation, isPending: isUpdatePending } =
    useUpdateGuardian(parent.id as string, { studentId, asAdmin });
  const {
    mutate: resendInvitation,
    isPending: isResendingInvitation,
  } = useResendParentInvitation(parent.id ?? "");
  const {
    mutate: resendConfirmation,
    isPending: isResendingConfirmation,
  } = useResendParentChildConfirmation(parent.relationshipId ?? "");

  const isResending = isResendingInvitation || isResendingConfirmation;

  const deleteGuardian = () => {
    deleteGuardianMutation(undefined, {
      onSuccess: () => {
        toast.success("Guardian deleted successfully.");
        setIsConfirmDeleteOpen(false);
        refetchStudentData();
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify(
            (error as ErrorResponse)?.response?.data?.message ||
              "Error occurred while deleting guardian.",
          ),
        );
      },
    });
  };

  const updateParent = () => {
    const error = validateGuardianIdentity(editParent);
    if (error) {
      toast.error(error);
      return;
    }

    const updatePayload: Pick<
      Parent,
      | "address"
      | "firstName"
      | "lastName"
      | "email"
      | "occupation"
      | "phone"
      | "relationship"
    > = {
      firstName: editParent.firstName.trim(),
      lastName: editParent.lastName.trim(),
      address: editParent.address,
      email: editParent.email.trim(),
      phone: editParent.phone,
      relationship: editParent.relationship,
      occupation: editParent.occupation,
    };

    updateParentMutation(updatePayload, {
      onSuccess: () => {
        toast.success("Guardian updated successfully.");
        setDialogOpen(false);
        refetchStudentData();
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify(
            (error as ErrorResponse)?.response?.data?.message ||
              "Error occurred while updating guardian.",
          ),
        );
      },
    });
  };

  const handleResend = () => {
    if (isResending || !portalState?.resendAction || !parent.id) {
      return;
    }

    const onSuccess = () => {
      toast.success(
        portalState.resendAction === "invitation"
          ? `Invitation email resent to ${parent.email}.`
          : `Confirmation email resent to ${parent.email}.`,
      );
      refetchStudentData();
    };

    const onError = (error: unknown) => {
      toast.error(
        JSON.stringify(
          (error as ErrorResponse)?.response?.data?.message ||
            "Could not resend email. Try again shortly.",
        ),
      );
    };

    if (portalState.resendAction === "invitation") {
      resendInvitation(undefined, { onSuccess, onError });
      return;
    }

    if (parent.relationshipId) {
      resendConfirmation(undefined, { onSuccess, onError });
    }
  };

  const openEdit = () => {
    setEditParent(parent);
    setDialogOpen(true);
  };

  const resendLabel =
    portalState?.resendAction === "invitation"
      ? "Resend invitation"
      : "Resend confirmation";

  const showStudentPortalCallout =
    !asAdmin && Boolean(portalState?.resendAction);

  const studentPortalMessage =
    "If they didn't receive the email, ask your school office to resend the parent portal invitation.";

  return (
    <>
      <div className="rounded-lg border border-gray-200 p-4 mb-4">
        {viewMode && (
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold">Guardian #{count}</h4>
              {portalState && (
                <Badge
                  text={portalState.label}
                  variant={portalState.variant}
                  showDot
                />
              )}
            </div>
            {canManage && (
              <div className="flex items-center gap-3">
                <IconPencil
                  size={18}
                  className="cursor-pointer"
                  onClick={openEdit}
                  aria-label="Edit guardian"
                />
                <IconTrashFilled
                  size={18}
                  className="text-red-600 cursor-pointer"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  aria-label="Delete guardian"
                />
              </div>
            )}
          </div>
        )}

        {canResend && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-2.5">
            <p className="text-sm text-violet-950">
              {portalState?.helperText ??
                "This guardian still needs to complete portal setup."}
            </p>
            <CustomButton
              variant="outline"
              text={isResending ? "Sending…" : resendLabel}
              onClick={handleResend}
              loading={isResending}
              disabled={isResending}
              className="!px-3 !py-1.5 shrink-0"
              icon={!isResending ? <IconSend2 size={15} /> : undefined}
            />
          </div>
        )}

        {showStudentPortalCallout && (
          <div className="mb-3 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-2.5">
            <p className="text-sm text-violet-950">{studentPortalMessage}</p>
          </div>
        )}

        {portalState?.helperText && !canResend && !showStudentPortalCallout && (
          <p className="text-sm text-gray-500 mb-3">{portalState.helperText}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField
            className="!py-0"
            label="First Name"
            value={parent.firstName}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Last Name"
            value={parent.lastName}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Relationship with student"
            value={parent.relationship}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Occupation"
            value={parent.occupation}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Email"
            value={parent.email}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Street Address"
            value={parent.address}
            isTransulent={viewMode}
          />
          <InputField
            className="!py-0"
            label="Phone"
            value={parent.phone}
            isTransulent={viewMode}
          />
        </div>
      </div>

      <Dialog
        isOpen={dialogOpen}
        busy={isUpdatePending}
        dialogTitle="Edit Guardian"
        onClose={() => setDialogOpen(false)}
        onSave={updateParent}
        saveDisabled={!!validateGuardianIdentity(editParent)}
      >
        <GuardianFormFields value={editParent} onChange={setEditParent} />
      </Dialog>

      <Dialog
        isOpen={isConfirmDeleteOpen}
        busy={isDeletePending}
        dialogTitle="Confirm Delete"
        saveButtonText="Delete Guardian"
        onClose={() => setIsConfirmDeleteOpen(false)}
        onSave={deleteGuardian}
      >
        <div className="my-3 flex flex-col gap-4">
          <p className="mt-3 mb-6">
            Are you sure you want to delete this guardian?
          </p>
        </div>
      </Dialog>
    </>
  );
};

export default Guardian;
