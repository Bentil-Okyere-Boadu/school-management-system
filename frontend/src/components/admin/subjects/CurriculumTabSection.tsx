"use client";
import React, { useEffect, useState } from "react";
import { CurriculumCard } from "@/components/admin/subjects/CurriculumCard";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import NoAvailableEmptyState from "@/components/common/NoAvailableEmptyState";
import { MultiSelect, Select } from "@mantine/core";
import { toast } from "react-toastify";
import {
  useCreateCurriculum,
  useDeleteCurriculum,
  useEditCurriculum,
  useGetCurricula,
} from "@/hooks/school-admin";
import { useEditCurriculumById } from "@/hooks/school-admin";
import { useGetAllSubjects, useGetCalendars, useGetTerms } from "@/hooks/school-admin";
import { Calendar, CurriculumPayload, ErrorResponse, Subject, Term } from "@/@types";
import { useRouter } from "next/navigation";

type SubjectOption = { value: string; label: string };
type CurriculumRecord = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  subjectCatalogIds?: string[];
  subjectCatalogs?: Array<{ id: string; name: string }>;
  academicTerm?: { id: string; name?: string };
};

export const CurriculumTabSection: React.FC = () => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  const [busyToggleId, setBusyToggleId] = useState<string | null>(null);

  const { curricula, refetch } = useGetCurricula();
  console.log(curricula, "here");
  const { mutate: createMutation, isPending: creating } = useCreateCurriculum();
  const { mutate: editMutation, isPending: editing } = useEditCurriculum(activeId);
  const { mutate: deleteMutation, isPending: deleting } = useDeleteCurriculum();
  const { mutate: patchCurriculum } = useEditCurriculumById();

  // Subjects
  const { subjects: allSubjects } = useGetAllSubjects(true);
  const subjectOptions: SubjectOption[] =
    allSubjects?.map((s: Subject) => ({
      value: String(s?.id ?? ""),
      label: String(s?.name ?? ""),
    })) ?? [];

  // Academic Calendars and Terms
  const { calendars } = useGetCalendars();
  const calendarOptions =
    calendars?.map((c: Calendar) => ({
      value: String(c?.id ?? ""),
      label: String(c?.name ?? ""),
    })) ?? [];

  const { terms } = useGetTerms(selectedCalendarId || "");
  const termOptions =
    terms?.map((t: Term) => ({
      value: String(t?.id ?? ""),
      label: String(t?.name ?? t?.termName ?? ""),
    })) ?? [];

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedSubjectIds([]);
    setSelectedCalendarId("");
    setSelectedTermId("");
    setActiveId("");
    setEditMode(false);
  };

  const onAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const onEdit = (item: Partial<CurriculumRecord>) => {
    setEditMode(true);
    setActiveId(item.id as string);
    setIsDialogOpen(true);
    setName(item.name || "");
    setDescription(item.description || "");
    // subjects from either subjectCatalogIds or subjectCatalogs
    const ids =
      (item.subjectCatalogIds as string[]) ??
      (item.subjectCatalogs?.map((s) => s.id) ?? []);
    setSelectedSubjectIds(ids);
    // Preselect term and calendar if present
    const termId = item.academicTerm?.id || "";
    setSelectedTermId(termId);
    if (termId && calendars?.length) {
      const owningCalendar = calendars.find((cal) =>
        (cal?.terms || []).some((t) => String(t?.id) === String(termId))
      );
      if (owningCalendar?.id) {
        setSelectedCalendarId(String(owningCalendar.id));
      }
    }
  };

  const onDeleteClick = (id?: string) => {
    if (!id) return;
    setActiveId(id);
    setIsDeleteDialogOpen(true);
  };

  // If calendars arrive after entering edit mode, derive the calendar from the selected term
  useEffect(() => {
    if (editMode && selectedTermId && !selectedCalendarId && calendars?.length) {
      const owningCalendar = calendars.find((cal) =>
        (cal?.terms || []).some((t) => String(t?.id) === String(selectedTermId))
      );
      if (owningCalendar?.id) {
        setSelectedCalendarId(String(owningCalendar.id));
      }
    }
  }, [editMode, selectedTermId, selectedCalendarId, calendars]);

  const onToggleActive = (item: CurriculumRecord) => {
    if (!item?.id) return;
    setBusyToggleId(item.id);

    // Use ID-at-call-time mutation to avoid stale/empty id and unnecessary empty fields
    patchCurriculum(
      { id: item.id, isActive: !item.isActive },
      {
        onSuccess: () => {
          refetch().finally(() => {
            setBusyToggleId(null);
            toast.success(item.isActive ? "Curriculum deactivated" : "Curriculum activated");
          });
        },
        onError: (error: unknown) => {
          setBusyToggleId(null);
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message ?? "Failed to update"));
        },
      }
    );
  };

  const onSave = () => {
    const payload = {
      name,
      description,
      subjectCatalogIds: selectedSubjectIds,
      academicTermId: selectedTermId,
      isActive: true,
    };

    if (!name || !selectedTermId || selectedSubjectIds.length === 0) {
      toast.error("Name, academic term and at least one subject are required.");
      return;
    }

    if (editMode) {
      editMutation(payload, {
        onSuccess: () => {
          toast.success("Successfully updated curriculum.");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      // require term on create
      createMutation(payload as CurriculumPayload, {
        onSuccess: () => {
          toast.success("Successfully created curriculum.");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    }
  };

  const onConfirmDelete = () => {
    deleteMutation(activeId, {
      onSuccess: () => {
        toast.success("Deleted successfully.");
        setIsDeleteDialogOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };

  const onViewSubjects = (data: CurriculumRecord): void => {
    if (!data?.id) return;
    router.push(`/admin/subjects/curriculum/${data.id}`);
  }

  return (
    <>
      <div className="pb-8">
        <div className="flex justify-end items-center flex-wrap gap-4 w-full mb-5 px-0.5">
          <CustomButton text="Add Curriculum" onClick={onAddNew} />
        </div>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 py-1 px-0.5">
          {curricula?.map((data: CurriculumRecord, index: number) => (
            <CurriculumCard
              key={data.id ?? index}
              curriculumData={{
                id: data.id,
                name: data.name,
                description: data.description,
                isActive: data.isActive,
                subjectCatalogIds:
                  data.subjectCatalogIds ??
                  (data.subjectCatalogs?.map((s) => s.id) ?? []),
              }}
              showEditAndDelete={true}
              showToggleActive={true}
              showViewSubjects={true}
              tooltipText="Toggle whether this curriculum is active for assignment."
              onEditClick={() => onEdit(data)}
              onDeleteClick={() => onDeleteClick(data.id)}
              onToggleActiveClick={() => onToggleActive(data)}
              onViewSubjectsClick={() => onViewSubjects(data)}
              subjectCount={
                data.subjectCatalogIds?.length ??
                data.subjectCatalogs?.length ??
                0
              }
              busy={busyToggleId === data.id}
            />
          ))}
        </section>

        {curricula?.length === 0 && (
          <NoAvailableEmptyState message="No curriculum available, click ‘Add Curriculum’ to create one." />
        )}
      </div>

      <Dialog
        isOpen={isDialogOpen}
        busy={editMode ? editing : creating}
        dialogTitle={`${editMode ? "Edit" : "Add New"} Curriculum`}
        saveButtonText="Save"
        onClose={() => setIsDialogOpen(false)}
        onSave={onSave}
      >
        <div className="my-3 flex flex-col gap-4">
          <InputField
            className="!py-0"
            placeholder=""
            label="Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            isTransulent={false}
          />
          <InputField
            className="!py-0"
            placeholder=""
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            isTransulent={false}
          />

          <MultiSelect
            label="Subjects"
            placeholder="Select subjects"
            data={subjectOptions}
            value={selectedSubjectIds}
            onChange={setSelectedSubjectIds}
            searchable
            clearable
          />


          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Academic Calendar"
              placeholder="Pick calendar"
              data={calendarOptions}
              value={selectedCalendarId}
              onChange={(e) => {
                setSelectedCalendarId(e as string);
                setSelectedTermId("");
              }}
              searchable
            />
            <Select
              label="Academic Term"
              placeholder="Pick term (select academic calendar first)"
              data={termOptions}
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e as string)}
              searchable
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isDeleteDialogOpen}
        busy={deleting}
        dialogTitle="Confirm Delete"
        saveButtonText="Delete"
        onClose={() => setIsDeleteDialogOpen(false)}
        onSave={onConfirmDelete}
      >
        <div className="my-3 flex flex-col gap-4">
          <p>Are you sure you want to delete this curriculum?</p>
        </div>
      </Dialog>
    </>
  );
};
