"use client";
import React, { useState } from "react";
import SchoolCard from "@/components/common/SchoolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useRouter } from "next/navigation";
import { useCreateSchool, useGetAllSchools } from "@/hooks/super-admin";
import { useDebouncer } from "@/hooks/generalHooks";
import CustomButton from "@/components/Button";
import { Dialog } from "@/components/common/Dialog";
import InputField from "@/components/InputField";
import InviteSchoolAdminFields from "@/components/superadmin/schools/InviteSchoolAdminFields";
import SchoolCardStatus from "@/components/superadmin/schools/SchoolCardStatus";
import {
  emptyInviteSchoolAdminValues,
  InviteSchoolAdminFormValues,
  isInviteSchoolAdminValid,
  useInviteSchoolAdmin,
} from "@/hooks/invite-school-admin";
import { toast } from "react-toastify";
import { ErrorResponse, School } from "@/@types";

type CreateStep = "details" | "invite";

const SchoolsPage: React.FC = () => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState<CreateStep>("details");
  const [createdSchool, setCreatedSchool] = useState<School | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [inviteValues, setInviteValues] = useState<InviteSchoolAdminFormValues>(
    emptyInviteSchoolAdminValues,
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSchoolCardClick = (schoolId: string) => {
    router.push(`/superadmin/schools/${schoolId}`);
  };

  const { schools } = useGetAllSchools(currentPage, useDebouncer(searchQuery));
  const { mutate: createSchool, isPending } = useCreateSchool();
  const { inviteSchoolAdmin, isInviting } = useInviteSchoolAdmin();

  const closeDialog = () => {
    setIsCreateOpen(false);
    setStep("details");
    setCreatedSchool(null);
    setSchoolName("");
    setCalendlyUrl("");
    setInviteValues(emptyInviteSchoolAdminValues);
  };

  const submitSchool = () => {
    if (!schoolName.trim() || !calendlyUrl.trim()) {
      toast.error("School name and Calendly URL are required.");
      return;
    }
    createSchool(
      { name: schoolName.trim(), calendlyUrl: calendlyUrl.trim() },
      {
        onSuccess: (response) => {
          const school = (response as { data: School })?.data;
          toast.success("School created and provisioned successfully.");
          setCreatedSchool(school);
          setStep("invite");
        },
        onError: (error: unknown) => {
          toast.error(
            (error as ErrorResponse)?.response?.data?.message ||
              "Unable to create the school.",
          );
        },
      },
    );
  };

  const submitInvite = () => {
    if (!createdSchool) return;
    inviteSchoolAdmin(createdSchool.id, inviteValues, {
      onSuccess: closeDialog,
    });
  };

  const isInviteStep = step === "invite";

  return (
    <div className="px-0.5">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SearchBar
          onSearch={handleSearch}
          className="w-[366px] max-md:w-full"
        />
        <CustomButton
          text="Create School"
          onClick={() => setIsCreateOpen(true)}
        />
      </div>

      <section className="flex flex-wrap gap-5 items-start text-sm leading-4 text-center text-zinc-700 py-6">
        {schools?.map((school, index: number) => (
          <div key={school.id}>
            <SchoolCard
              onNavigateToSchoolDetail={() => handleSchoolCardClick(school.id)}
              schoolName={school.name}
              schoolId={school.id}
              logoUrl={school?.logoUrl}
              backgroundColor={index % 2 === 0 ? "bg-violet-200" : "bg-red-100"}
              textColor={index % 2 === 0 ? "text-zinc-600" : ""}
            />
            <SchoolCardStatus school={school} />
          </div>
        ))}
      </section>

      <Dialog
        isOpen={isCreateOpen}
        dialogTitle={
          isInviteStep ? "Invite school administrator" : "Create School"
        }
        subheader={
          isInviteStep
            ? `${createdSchool?.name ?? "The school"} is provisioned and ready for its administrator`
            : undefined
        }
        saveButtonText={
          isInviteStep ? "Send invite" : "Create and Provision"
        }
        cancelButtonText={isInviteStep ? "Skip for now" : "Cancel"}
        onClose={closeDialog}
        onSave={isInviteStep ? submitInvite : submitSchool}
        busy={isPending || isInviting}
        saveDisabled={
          isInviteStep
            ? !isInviteSchoolAdminValid(inviteValues) || isInviting
            : !schoolName.trim() || !calendlyUrl.trim()
        }
      >
        {isInviteStep ? (
          <InviteSchoolAdminFields
            values={inviteValues}
            onChange={setInviteValues}
            busy={isInviting}
          />
        ) : (
          <>
            <p className="text-xs text-gray-500">
              Provisioning runs immediately, then you can invite the
              administrator
            </p>
            <div className="my-3 flex flex-col gap-4">
              <InputField
                className="!py-0"
                label="School Name"
                required
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                isTransulent={isPending}
              />
              <InputField
                label="Calendly URL"
                required
                type="url"
                value={calendlyUrl}
                onChange={(event) => setCalendlyUrl(event.target.value)}
                isTransulent={isPending}
              />
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default SchoolsPage;
