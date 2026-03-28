"use client";
import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Dialog } from "@/components/common/Dialog";
import { Pagination } from "@/components/common/Pagination";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { Badge, Checkbox, Combobox, Menu, Select } from "@mantine/core";
import { TermFilterCard } from "@/components/common/TermFilterCard";
import { buildTermSelectData, getSortedSchoolTerms } from "@/utils/schoolTerms";
import {
  IconCopy,
  IconDots,
  IconEdit,
  IconTrashFilled,
} from "@tabler/icons-react";
import {
  CurriculumItem,
  ErrorResponse,
  SubjectCatalog,
  Topic,
  TopicPayload,
} from "@/@types";
import {
  useCreateTopic,
  useDeleteTopic,
  useEditTopic,
  useGetCalendars,
  useGetCurricula,
  useGetCurriculumById,
  useGetTopics,
  useDuplicateTopicsToTerm,
} from "@/hooks/school-admin";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";
import { useQueryClient } from "@tanstack/react-query";

const TOPICS_PAGE_SIZE = 10;
const DUPLICATE_MODAL_TOPIC_LIMIT = 1000;

function toDateInputValue(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "";
  const s = String(iso).trim();
  return s.length >= 10 ? s.slice(0, 10) : "";
}

export const TopicsTabSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [dupSourceTermId, setDupSourceTermId] = useState("");
  const [dupTargetTermId, setDupTargetTermId] = useState("");
  const [dupSelectedIds, setDupSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dupEntireSourceTerm, setDupEntireSourceTerm] = useState(false);
  const [isCreate, setIsCreate] = useState(true);

  // Dialog selection state (moved here)
  const [dialogCurriculumId, setDialogCurriculumId] = useState<string>("");
  const [dialogSubjectId, setDialogSubjectId] = useState<string>("");
  const [dialogAcademicTermId, setDialogAcademicTermId] = useState("");
  const lastSyncedDialogCurriculumRef = useRef<string | null>(null);
  const [topic, setTopic] = useState<
    Partial<
      Topic & {
        subjectCatalogId: string;
        curriculumId: string;
        plannedStartDate: string;
        plannedEndDate: string;
      }
    >
  >({
    id: "",
    name: "",
    description: "",
    subjectCatalogId: "",
    curriculumId: "",
    plannedStartDate: "",
    plannedEndDate: "",
  });

  // Data sources
  const { curricula } = useGetCurricula();
  const curriculumOptions =
    (curricula as unknown as CurriculumItem[])?.map((c) => ({
      value: String(c.id),
      label: String(c.name),
    })) ?? [];

  const { curriculum, isLoading: curriculumDetailLoading } =
    useGetCurriculumById(dialogCurriculumId);

  const subjectOptions =
    (curriculum?.subjectCatalogs || [])?.map((s: SubjectCatalog) => ({
      value: String(s.id),
      label: String(s.name),
    })) ?? [];

  const { calendars, isLoading: calendarsLoading } = useGetCalendars();
  const [listTermFilterId, setListTermFilterId] = useState("");

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars],
  );

  const latestTermId = sortedTerms[0]?.id;

  const termDateBounds = useMemo(() => {
    const t = sortedTerms.find((x) => x.id === dialogAcademicTermId);
    const min =
      t?.startDate != null ? toDateInputValue(t.startDate) : "";
    const max = t?.endDate != null ? toDateInputValue(t.endDate) : "";
    if (!min || !max) {
      return {
        min: undefined as string | undefined,
        max: undefined as string | undefined,
      };
    }
    return { min, max };
  }, [dialogAcademicTermId, sortedTerms]);

  const duplicateTermSelectData = useMemo(
    () => buildTermSelectData(calendars ?? [], sortedTerms),
    [calendars, sortedTerms],
  );

  const duplicateModalTopicsEnabled =
    isDuplicateModalOpen && Boolean(dupSourceTermId);

  const {
    topics: dupModalTopics,
    isLoading: dupModalTopicsLoading,
    paginationValues: dupModalPagination,
  } = useGetTopics(
    "",
    1,
    DUPLICATE_MODAL_TOPIC_LIMIT,
    dupSourceTermId || undefined,
    duplicateModalTopicsEnabled,
  );

  useLayoutEffect(() => {
    if (sortedTerms.length === 0) {
      setListTermFilterId("");
      return;
    }
    setListTermFilterId((prev) => {
      if (prev && sortedTerms.some((t) => t.id === prev)) return prev;
      return sortedTerms[0].id;
    });
  }, [sortedTerms]);

  const topicsQueryEnabled =
    sortedTerms.length === 0 || Boolean(listTermFilterId);

  const { topics, isLoading, refetch, paginationValues } = useGetTopics(
    "",
    currentPage,
    TOPICS_PAGE_SIZE,
    listTermFilterId || undefined,
    topicsQueryEnabled,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [listTermFilterId]);

  useEffect(() => {
    if (!isDuplicateModalOpen) return;
    setDupSelectedIds(new Set());
    setDupEntireSourceTerm(false);
  }, [isDuplicateModalOpen, dupSourceTermId]);

  useEffect(() => {
    if (!dialogCurriculumId || !subjectOptions.length) {
      setDialogSubjectId("");
      return;
    }

    const exists = subjectOptions.some(s => s.value === dialogSubjectId);
    if (!exists) {
      // Auto-select the first subject OR leave blank (choose the behavior you prefer)
      setDialogSubjectId(subjectOptions[0]?.value || "");
    }
  }, [dialogCurriculumId, subjectOptions]);

  useEffect(() => {
    if (!dialogCurriculumId) {
      lastSyncedDialogCurriculumRef.current = null;
      return;
    }
    if (!isCreate || curriculumDetailLoading) return;
    if (lastSyncedDialogCurriculumRef.current === dialogCurriculumId) return;
    lastSyncedDialogCurriculumRef.current = dialogCurriculumId;
    const linked = curriculum?.academicTerm?.id;
    if (linked && sortedTerms.some((t) => t.id === linked)) {
      setDialogAcademicTermId(linked);
    }
  }, [
    isCreate,
    dialogCurriculumId,
    curriculumDetailLoading,
    curriculum?.academicTerm?.id,
    sortedTerms,
  ]);

  const onOpenCreate = () => {
    setIsCreate(true);
    setTopic({
      id: "",
      name: "",
      description: "",
      subjectCatalogId: "",
      curriculumId: "",
      plannedStartDate: "",
      plannedEndDate: "",
    });
    setDialogCurriculumId("");
    setDialogSubjectId("");
    setDialogAcademicTermId(
      listTermFilterId && sortedTerms.some((t) => t.id === listTermFilterId)
        ? listTermFilterId
        : sortedTerms[0]?.id ?? "",
    );
    setIsDialogOpen(true);
  };

  const onOpenEdit = (row: Topic) => {
    setIsCreate(false);
    setTopic({
      id: row.id,
      name: row.name,
      description: row.description,
      subjectCatalogId: row.subjectCatalog?.id,
      curriculumId: row.curriculum?.id,
      plannedStartDate: toDateInputValue(row.plannedStartDate),
      plannedEndDate: toDateInputValue(row.plannedEndDate),
    });

    // Preselect curriculum and subject
    const curriculumId = row.curriculum?.id;
    const subjectId = row.subjectCatalog?.id;
    setDialogCurriculumId(curriculumId || "");
    setDialogSubjectId(subjectId || "");
    setDialogAcademicTermId(
      row.academicTerm?.id ?? row.academicTermId ?? "",
    );
    setIsDialogOpen(true);
  };

  const onAskDelete = (row: Topic) => {
    setTopic({
      id: row.id,
      name: row.name,
    });
    setIsConfirmDeleteOpen(true);
  };

  const { mutate: createTopic, isPending: creating } = useCreateTopic();
  const { mutate: editTopic, isPending: editing } = useEditTopic(topic?.id || "");
  const { mutate: deleteTopic, isPending: deleting } = useDeleteTopic();
  const { mutate: duplicateTopicsToTerm, isPending: duplicatingTopics } =
    useDuplicateTopicsToTerm();

  const onOpenDuplicateModal = () => {
    const source = listTermFilterId || sortedTerms[0]?.id || "";
    const target =
      sortedTerms.find((t) => t.id !== source)?.id ?? "";
    setDupSourceTermId(source);
    setDupTargetTermId(target);
    setDupSelectedIds(new Set());
    setDupEntireSourceTerm(false);
    setIsDuplicateModalOpen(true);
  };

  const dupModalTotal = dupModalPagination?.total ?? 0;
  const dupTruncated =
    dupModalTotal > (dupModalTopics?.length ?? 0);

  const duplicateSaveButtonText = dupEntireSourceTerm
    ? "Duplicate all topics"
    : `Duplicate ${dupSelectedIds.size} topic${dupSelectedIds.size !== 1 ? "s" : ""}`;

  const duplicateSaveDisabled =
    !dupSourceTermId ||
    !dupTargetTermId ||
    dupSourceTermId === dupTargetTermId ||
    (dupModalTopicsLoading && Boolean(dupSourceTermId)) ||
    (!dupEntireSourceTerm && dupSelectedIds.size === 0) ||
    (dupEntireSourceTerm &&
      !dupModalTopicsLoading &&
      dupModalTotal === 0);

  const termSelectRightSection = (termId: string) => (
    <div className="flex items-center justify-end gap-1.5 pr-0.5">
      {latestTermId && termId === latestTermId ? (
        <Badge
          variant="light"
          size="xs"
          className="shrink-0 font-semibold"
          style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}
        >
          Latest
        </Badge>
      ) : null}
      <Combobox.Chevron size="sm" />
    </div>
  );

  const submitDuplicateTopics = () => {
    if (!dupSourceTermId || !dupTargetTermId) {
      toast.error("Select both source and target terms.");
      return;
    }
    if (dupSourceTermId === dupTargetTermId) {
      toast.error("Source and target term must be different.");
      return;
    }
    if (!dupEntireSourceTerm && dupSelectedIds.size === 0) {
      toast.error("Select at least one topic, or use Select all.");
      return;
    }
    const payload = dupEntireSourceTerm
      ? {
          sourceAcademicTermId: dupSourceTermId,
          targetAcademicTermId: dupTargetTermId,
          duplicateAllFromSource: true as const,
        }
      : {
          sourceAcademicTermId: dupSourceTermId,
          targetAcademicTermId: dupTargetTermId,
          topicIds: Array.from(dupSelectedIds),
        };
    duplicateTopicsToTerm(payload, {
      onSuccess: () => {
        toast.success(
          dupEntireSourceTerm
            ? "All topics duplicated to the target term"
            : "Selected topics duplicated to the target term",
        );
        setIsDuplicateModalOpen(false);
        setListTermFilterId(dupTargetTermId);
        setCurrentPage(1);
      },
      onError: (error: unknown) => {
        const msg = (error as ErrorResponse)?.response?.data?.message;
        toast.error(
          msg != null ? String(msg) : "Could not duplicate topics.",
        );
      },
    });
  };

  const saveTopic = () => {
    if (!topic.name || !dialogCurriculumId || !dialogSubjectId) {
      toast.error("Name, curriculum and subject are required.");
      return;
    }
    if (!dialogAcademicTermId) {
      toast.error("Select an academic term.");
      return;
    }
    if (!sortedTerms.some((t) => t.id === dialogAcademicTermId)) {
      toast.error("Invalid academic term.");
      return;
    }
    const start = topic.plannedStartDate?.trim() ?? "";
    const end = topic.plannedEndDate?.trim() ?? "";
    if ((start && !end) || (!start && end)) {
      toast.error("Enter both start and end, or clear both to remove dates.");
      return;
    }
    if (start && end) {
      const s = new Date(`${start}T12:00:00`);
      const e = new Date(`${end}T12:00:00`);
      if (s > e) {
        toast.error("Start date cannot be after end date.");
        return;
      }
      const { min, max } = termDateBounds;
      if (min && max && (start < min || start > max || end < min || end > max)) {
        toast.error("Planned dates must fall within the selected academic term.");
        return;
      }
    }
    const payload: TopicPayload = {
      name: topic.name,
      description: (topic.description as string) || undefined,
      subjectCatalogId: dialogSubjectId,
      curriculumId: dialogCurriculumId,
      academicTermId: dialogAcademicTermId,
      ...(isCreate
        ? {
            ...(start ? { plannedStartDate: start } : {}),
            ...(end ? { plannedEndDate: end } : {}),
          }
        : {
            plannedStartDate: start || null,
            plannedEndDate: end || null,
          }),
    };
    if (isCreate) {
      createTopic(payload, {
        onSuccess: () => {
          toast.success("Topic created successfully");
          setIsDialogOpen(false);
          setCurrentPage(1);
          void queryClient.invalidateQueries({ queryKey: ["curriculumTopics"] });
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    } else {
      editTopic(payload, {
        onSuccess: () => {
          toast.success("Topic updated successfully");
          setIsDialogOpen(false);
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
        },
      });
    }
  };

  const confirmDelete = () => {
    deleteTopic(topic?.id as string, {
      onSuccess: () => {
        toast.success("Topic deleted successfully");
        setIsConfirmDeleteOpen(false);
        refetch();
      },
      onError: (error: unknown) => {
        toast.error(JSON.stringify((error as ErrorResponse).response.data.message));
      },
    });
  };

  return (
    <>
      <div className="pb-8">

        <TermFilterCard
          calendars={calendars ?? []}
          calendarsLoading={calendarsLoading}
          sortedTerms={sortedTerms}
          value={listTermFilterId}
          onChange={setListTermFilterId}
          actions={
            <>
              <CustomButton
                text="Duplicate Topics"
                variant="outline"
                icon={<IconCopy size={18} />}
                onClick={onOpenDuplicateModal}
              />
              <CustomButton text="Create Topic" onClick={onOpenCreate} />
            </>
          }
        />

        <section className="bg-white mt-2">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                    <div>Topic</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Curriculum</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                    <div>Subject</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 whitespace-nowrap">
                    <div>Planned start</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 whitespace-nowrap">
                    <div>Planned end</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  if (isLoading) {
                    return (
                      <tr>
                        <td colSpan={6}>
                          <div className="relative py-20 bg-white">
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                              <HashLoader color="#AB58E7" size={40} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (!topics?.length) {
                    return (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="text-lg font-medium">No topics added</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Added topics will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  type TopicRow = Topic & {
                    subjectCatalog?: { name?: string; curriculum?: { name?: string } };
                    curriculum?: { name?: string };
                    subject?: { name?: string };
                  };
                  return topics.map((row: TopicRow) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 align-top">
                        <div className="min-w-0 max-w-md">
                          <div className="font-semibold text-gray-900">
                            {row.name}
                          </div>
                          {row.description ? (
                            <div className="text-sm text-gray-500 mt-0.5 line-clamp-3">
                              {row.description}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 align-top">
                        <div>{row?.curriculum?.name ?? row?.subjectCatalog?.curriculum?.name ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 align-top">
                        <div>{row?.subjectCatalog?.name ?? row?.subject?.name ?? "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 whitespace-nowrap text-sm text-gray-800 align-top">
                        {row.plannedStartDate}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 whitespace-nowrap text-sm text-gray-800 align-top">
                        {row.plannedEndDate}
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5 align-top">
                        <div className="flex items-center justify-end pr-6">
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <IconDots className="cursor-pointer" />
                            </Menu.Target>
                            <Menu.Dropdown className="!-ml-12 !-mt-2">
                              <Menu.Item
                                onClick={() => onOpenEdit(row)}
                                leftSection={<IconEdit size={18} color="#AB58E7" />}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                onClick={() => onAskDelete(row)}
                                leftSection={<IconTrashFilled size={18} color="red" />}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>

        <Pagination
          currentPage={currentPage}
          totalPages={paginationValues?.totalPages ?? 1}
          onPageChange={handlePageChange}
        />
      </div>

      <Dialog
        isOpen={isDialogOpen}
        busy={isCreate ? creating : editing}
        dialogTitle={isCreate ? "Create Topic" : "Edit Topic"}
        onClose={() => setIsDialogOpen(false)}
        onSave={saveTopic}
      >
        <form className="mt-3">
          <InputField
            className="!py-0"
            label="Name"
            min={1}
            placeholder="Eg. Algebra Basics"
            onChange={(e) => setTopic((p) => ({ ...p, name: e.target.value }))}
            value={topic.name || ""}
          />
          <InputField
            className="!py-0"
            label="Description"
            min={1}
            placeholder="Short summary"
            onChange={(e) => setTopic((p) => ({ ...p, description: e.target.value }))}
            value={topic.description || ""}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Curriculum"
              placeholder="Select curriculum"
              data={curriculumOptions}
              value={dialogCurriculumId}
              onChange={(v) => {
                setDialogCurriculumId(v as string);
                setDialogSubjectId("");
              }}
              searchable
            />
            <Select
              label="Subject"
              placeholder="Select subject (select curriculum first)"
              data={subjectOptions}
              value={dialogSubjectId}
              onChange={(v) => setDialogSubjectId(v as string)}
              searchable
              disabled={!dialogCurriculumId}
            />
          </div>
          <Select
            className="mt-4"
            label="Academic term"
            placeholder={
              calendarsLoading
                ? "Loading terms…"
                : sortedTerms.length === 0
                  ? "No terms configured"
                  : "Select term"
            }
            data={duplicateTermSelectData}
            value={dialogAcademicTermId}
            onChange={(v) => setDialogAcademicTermId(v ?? "")}
            searchable
            disabled={calendarsLoading || sortedTerms.length === 0}
            rightSection={termSelectRightSection(dialogAcademicTermId)}
            rightSectionWidth={
              latestTermId && dialogAcademicTermId === latestTermId
                ? 118
                : undefined
            }
          />
          <div className="mt-5">
            {termDateBounds.min && termDateBounds.max ? (
              <p className="text-sm text-gray-600 mb-3">
                Planned dates must fall between{" "}
                <span className="font-medium text-gray-800">{termDateBounds.min}</span>{" "}and{" "}
                <span className="font-medium text-gray-800">{termDateBounds.max}</span>{" "}
                (selected term).
              </p>
            ) : dialogAcademicTermId ? (
              <p className="text-sm text-gray-600 mb-3">
                This term has no start/end dates on the calendar — planned dates are
                optional and not range-checked.
              </p>
            ) : null}
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                className="!py-0"
                type="date"
                label="Planned start"
                value={topic.plannedStartDate ?? ""}
                min={termDateBounds.min}
                max={termDateBounds.max}
                onChange={(e) =>
                  setTopic((p) => ({
                    ...p,
                    plannedStartDate: e.target.value,
                  }))
                }
              />
              <InputField
                className="!py-0"
                type="date"
                label="Planned end"
                value={topic.plannedEndDate ?? ""}
                min={termDateBounds.min}
                max={termDateBounds.max}
                onChange={(e) =>
                  setTopic((p) => ({
                    ...p,
                    plannedEndDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={isConfirmDeleteOpen}
        busy={deleting}
        dialogTitle="Delete confirmation"
        saveButtonText="Delete Topic"
        onClose={() => setIsConfirmDeleteOpen(false)}
        onSave={confirmDelete}
      >
        <div className="mt-4">
          <p>
            Are you sure you want to delete this topic? The topic will be removed permanently.
          </p>
        </div>
      </Dialog>

      <Dialog
        isOpen={isDuplicateModalOpen}
        busy={duplicatingTopics}
        dialogTitle="Duplicate Topics to Another Term"
        saveButtonText={duplicateSaveButtonText}
        saveDisabled={duplicateSaveDisabled}
        onClose={() => setIsDuplicateModalOpen(false)}
        onSave={submitDuplicateTopics}
        dialogWidth="w-[min(640px,calc(100vw-2rem))] max-w-[640px]"
      >
        <div className="mt-3 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              label="Source term"
              placeholder="Select source term"
              data={duplicateTermSelectData}
              value={dupSourceTermId}
              onChange={(v) => {
                const next = v ?? "";
                setDupSourceTermId(next);
                setDupTargetTermId((prev) =>
                  prev === next
                    ? sortedTerms.find((t) => t.id !== next)?.id ?? ""
                    : prev,
                );
              }}
              searchable
              disabled={calendarsLoading || sortedTerms.length === 0}
              rightSection={termSelectRightSection(dupSourceTermId)}
              rightSectionWidth={
                latestTermId && dupSourceTermId === latestTermId
                  ? 118
                  : undefined
              }
            />
            <Select
              label="Target term"
              placeholder="Select target term"
              data={duplicateTermSelectData}
              value={dupTargetTermId}
              onChange={(v) => setDupTargetTermId(v ?? "")}
              searchable
              disabled={calendarsLoading || sortedTerms.length === 0}
              rightSection={termSelectRightSection(dupTargetTermId)}
              rightSectionWidth={
                latestTermId && dupTargetTermId === latestTermId
                  ? 118
                  : undefined
              }
            />
          </div>

          {!dupSourceTermId ? (
            <p className="text-sm text-gray-500">
              Select a source term to load topics.
            </p>
          ) : dupModalTopicsLoading ? (
            <div className="flex justify-center py-10">
              <HashLoader color="#AB58E7" size={36} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800">
                  Select topics to duplicate (
                  {dupEntireSourceTerm ? dupModalTotal : dupSelectedIds.size}/
                  {dupModalTotal || dupModalTopics.length})
                </span>
                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
                  onClick={() => {
                    setDupEntireSourceTerm(true);
                    setDupSelectedIds(
                      new Set(
                        dupModalTopics.map((t: Topic) => t.id),
                      ),
                    );
                  }}
                  disabled={!dupModalTopics.length}
                >
                  Select all
                </button>
              </div>
              {dupTruncated ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Showing the first {dupModalTopics.length} of {dupModalTotal}{" "}
                  topics. Use <strong>Select all</strong> to duplicate the
                  entire source term (including topics not listed here).
                </p>
              ) : null}
              {!dupModalTopics.length ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No topics in this term.
                </p>
              ) : (
                <ul className="border border-gray-200 rounded-lg max-h-[min(320px,50vh)] overflow-y-auto divide-y divide-gray-100">
                  {dupModalTopics.map((row: Topic) => {
                    type Row = Topic & {
                      subjectCatalog?: { name?: string };
                      curriculum?: { name?: string };
                    };
                    const r = row as Row;
                    const curriculumName =
                      r.curriculum?.name ?? "—";
                    const subjectName = r.subjectCatalog?.name ?? "—";
                    const checked =
                      dupEntireSourceTerm || dupSelectedIds.has(r.id);
                    return (
                      <li
                        key={r.id}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={checked}
                          onChange={() => {
                            if (dupEntireSourceTerm) {
                              setDupEntireSourceTerm(false);
                              const all = new Set<string>(
                                dupModalTopics.map((t: Topic) => t.id),
                              );
                              all.delete(r.id);
                              setDupSelectedIds(all);
                              return;
                            }
                            setDupSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(r.id)) next.delete(r.id);
                              else next.add(r.id);
                              return next;
                            });
                          }}
                          classNames={{ root: "pt-0.5" }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900">
                            {r.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {curriculumName} · {subjectName}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};