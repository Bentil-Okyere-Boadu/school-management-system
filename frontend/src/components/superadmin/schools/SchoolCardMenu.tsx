"use client";

import React, { useState } from "react";
import { Menu } from "@mantine/core";
import { IconDotsVertical, IconTrash } from "@tabler/icons-react";
import { toast } from "react-toastify";
import { Dialog } from "@/components/common/Dialog";
import { ErrorResponse, School } from "@/@types";
import { useDeleteSchool } from "@/hooks/super-admin";
import { canRemoveSchool } from "./schoolCardUtils";

interface SchoolCardMenuProps {
  school: School;
}

const errorMessage = (error: unknown, fallback: string) =>
  (error as ErrorResponse)?.response?.data?.message ||
  (error as { message?: string })?.message ||
  fallback;

const SchoolCardMenu: React.FC<SchoolCardMenuProps> = ({ school }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: deleteSchool, isPending } = useDeleteSchool();

  if (!canRemoveSchool(school)) {
    return null;
  }

  const handleDelete = () => {
    deleteSchool(school.id, {
      onSuccess: () => {
        toast.success(`${school.name} was removed.`);
        setConfirmOpen(false);
      },
      onError: (error: unknown) =>
        toast.error(errorMessage(error, "Unable to remove this school.")),
    });
  };

  return (
    <>
      <div
        className="absolute right-2 top-2 z-10"
        onClick={(event) => event.stopPropagation()}
      >
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <button
              type="button"
              aria-label={`Actions for ${school.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow-sm hover:bg-white"
            >
              <IconDotsVertical size={16} />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => setConfirmOpen(true)}
            >
              Remove school
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>

      <Dialog
        isOpen={confirmOpen}
        dialogTitle="Remove school"
        subheader={school.name}
        saveButtonText="Remove school"
        cancelButtonText="Cancel"
        onClose={() => setConfirmOpen(false)}
        onSave={handleDelete}
        busy={isPending}
      >
        <p className="text-sm text-gray-700">
          This permanently removes the school catalog entry, drops its tenant
          schema, and clears pending invitations. It cannot be undone.
        </p>
        {(school.adminSummary?.pendingInvitation || school.provisioningStatus === "failed") && (
          <p className="mt-3 text-sm text-amber-800">
            {school.provisioningStatus === "failed"
              ? "This school failed provisioning and can be safely removed."
              : "Any pending administrator invitation will also be deleted."}
          </p>
        )}
      </Dialog>
    </>
  );
};

export default SchoolCardMenu;
