"use client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useInviteUser } from "@/hooks/super-admin";
import { useAppContext } from "@/context/AppContext";
import { getRoleId } from "@/utils/roles";
import { ErrorResponse } from "@/@types";

export interface InviteSchoolAdminFormValues {
  firstName: string;
  lastName: string;
  email: string;
}

export const emptyInviteSchoolAdminValues: InviteSchoolAdminFormValues = {
  firstName: "",
  lastName: "",
  email: "",
};

export const isInviteSchoolAdminValid = (
  values: InviteSchoolAdminFormValues,
) =>
  Boolean(
    values.firstName.trim() && values.lastName.trim() && values.email.trim(),
  );

export const useInviteSchoolAdmin = () => {
  const { roles } = useAppContext();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useInviteUser();

  const inviteSchoolAdmin = (
    schoolId: string,
    values: InviteSchoolAdminFormValues,
    options?: { onSuccess?: () => void },
  ) => {
    if (!isInviteSchoolAdminValid(values)) {
      toast.error("First name, last name and email are required.");
      return;
    }

    const roleId = getRoleId(roles, "school_admin");
    if (!roleId) {
      toast.error("School admin role is not available yet. Try again shortly.");
      return;
    }

    mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        roleId,
        schoolId,
      },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email.trim()}.`);
          queryClient.invalidateQueries({ queryKey: ["allSchools"] });
          queryClient.invalidateQueries({ queryKey: ["allAdminUsers"] });
          options?.onSuccess?.();
        },
        onError: (error: unknown) => {
          const message =
            (error as ErrorResponse)?.response?.data?.message ||
            (error as { message?: string })?.message;
          toast.error(message || "Unable to send the invitation.");
        },
      },
    );
  };

  return { inviteSchoolAdmin, isInviting: isPending };
};
