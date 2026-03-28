"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Select } from "@mantine/core";
import {
  IconCalendar,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconEdit,
  IconFlag,
  IconMessage,
  IconPlus,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";
import type {
  ClassSubjectInfo,
  CurriculumTopicNote,
  TeacherProgressTopicCard,
} from "@/@types";
import {
  CurriculumTopicNoteThread,
  countTopicNotesInTree,
} from "@/components/curriculum/CurriculumTopicNoteThread";
import {
  useCreateTeacherSubtopic,
  useDeleteTeacherSubtopic,
  useGetCalendars,
  useGetTeacherCurriculumProgress,
  useGetTeacherSubjectClasses,
  useGetTeacherTopicNotes,
  useMarkSubtopicComplete,
  useReplyToCurriculumNote,
  useUnmarkSubtopicComplete,
  useUpdateTeacherSubtopic,
  type TeacherCurriculumProgressFilters,
} from "@/hooks/teacher";
import { Dialog } from "@/components/common/Dialog";
import { TermFilterCard } from "@/components/common/TermFilterCard";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { getSortedSchoolTerms } from "@/utils/schoolTerms";

function topicStatusLabel(topic: TeacherProgressTopicCard): {
  label: string;
  className: string;
} {
  if (topic.status === "completed") {
    return {
      label: "Completed",
      className: "text-emerald-800 bg-emerald-50 border border-emerald-100",
    };
  }
  if (topic.progressPercent > 0) {
    return {
      label: "In Progress",
      className: "text-sky-800 bg-sky-50 border border-sky-100",
    };
  }
  return {
    label: "Pending",
    className:
      "text-[#cd3500] bg-[#ffedd4] border border-[#fdba74]",
  };
}

function topicBarClass(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct > 0) return "bg-violet-600";
  return "bg-gray-200";
}

/** Teacher replies require parentId — use the latest root admin note. */
function findLatestAdminRootNoteId(
  notes: CurriculumTopicNote[]
): string | null {
  const admins = notes.filter((n) => n.authorRole === "school_admin");
  if (admins.length === 0) return null;
  return [...admins].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0].id;
}

export const CurriculumProgressTabSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { studentCalendars: calendars, isLoading: calendarsLoading } =
    useGetCalendars();
  const { classSubjects, isLoading: classesLoading } =
    useGetTeacherSubjectClasses("");

  const [academicTermId, setAcademicTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");

  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(
    () => new Set()
  );

  const [subtopicDraftByTopic, setSubtopicDraftByTopic] = useState<
    Record<string, string>
  >({});
  const [noteDraftByTopic, setNoteDraftByTopic] = useState<
    Record<string, string>
  >({});

  const [editSubtopic, setEditSubtopic] = useState<{
    id: string;
    topicId: string;
    name: string;
    description: string;
  } | null>(null);
  const [deleteSubtopicId, setDeleteSubtopicId] = useState<string | null>(null);

  const { mutate: createSubtopic, isPending: creatingSub } =
    useCreateTeacherSubtopic();
  const { mutate: updateSubtopic, isPending: updatingSub } =
    useUpdateTeacherSubtopic();
  const { mutate: deleteSubtopic, isPending: deletingSub } =
    useDeleteTeacherSubtopic();
  const { mutate: markComplete, isPending: marking } =
    useMarkSubtopicComplete();
  const { mutate: unmarkComplete, isPending: unmarking } =
    useUnmarkSubtopicComplete();
  const { mutate: replyNote, isPending: replying } =
    useReplyToCurriculumNote();

  const invalidateProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["teacherCurriculumProgress"] });
  }, [queryClient]);

  const sortedTerms = useMemo(
    () => getSortedSchoolTerms(calendars),
    [calendars],
  );

  useLayoutEffect(() => {
    if (sortedTerms.length === 0) {
      setAcademicTermId("");
      return;
    }
    setAcademicTermId((prev) => {
      if (prev && sortedTerms.some((t) => t.id === prev)) return prev;
      return sortedTerms[0].id;
    });
  }, [sortedTerms]);

  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    (classSubjects as ClassSubjectInfo[] | undefined)?.forEach((cs) => {
      cs.subjects?.forEach((s) => {
        if (!map.has(s.id)) map.set(s.id, s.name);
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [classSubjects]);

  const classOptions = useMemo(() => {
    const rows = classSubjects as ClassSubjectInfo[] | undefined;
    if (!subjectId) {
      const map = new Map<string, string>();
      rows?.forEach((cs) => {
        if (!map.has(cs.classLevel.id)) {
          map.set(cs.classLevel.id, cs.classLevel.name);
        }
      });
      return Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
      }));
    }
    return (
      rows
        ?.filter((cs) => cs.subjects?.some((s) => s.id === subjectId))
        .map((cs) => ({
          value: cs.classLevel.id,
          label: cs.classLevel.name,
        })) ?? []
    );
  }, [classSubjects, subjectId]);

  const subjectSelectData = useMemo(
    () => [{ value: "", label: "All subjects" }, ...subjectOptions],
    [subjectOptions]
  );

  const classSelectData = useMemo(
    () => [{ value: "", label: "All classes" }, ...classOptions],
    [classOptions]
  );

  useEffect(() => {
    if (!classLevelId) return;
    if (!classOptions.some((o) => o.value === classLevelId)) {
      setClassLevelId("");
    }
  }, [classOptions, classLevelId]);

  const progressFilters = useMemo((): TeacherCurriculumProgressFilters | null => {
    if (!academicTermId) return null;
    return {
      academicTermId,
      ...(subjectId ? { subjectId } : {}),
      ...(classLevelId ? { classLevelId } : {}),
    };
  }, [academicTermId, subjectId, classLevelId]);

  const { dashboard, isLoading: progressLoading } =
    useGetTeacherCurriculumProgress(progressFilters);

  const toggleTopic = (topicKey: string) => {
    setExpandedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicKey)) next.delete(topicKey);
      else next.add(topicKey);
      return next;
    });
  };

  const selectionSubjectId = dashboard?.selection?.subjectId ?? subjectId;
  const selectionClassLevelId =
    (dashboard?.selection?.classLevelId ?? classLevelId) || null;

  const onAddSubtopic = (topicId: string, draftKey: string) => {
    const name = (subtopicDraftByTopic[draftKey] ?? "").trim();
    if (!name) {
      toast.warn("Enter a subtopic name.");
      return;
    }
    createSubtopic(
      { topicId, payload: { name } },
      {
        onSuccess: () => {
          setSubtopicDraftByTopic((p) => ({ ...p, [draftKey]: "" }));
          invalidateProgress();
          toast.success("Subtopic added.");
        },
        onError: () => toast.error("Could not add subtopic."),
      }
    );
  };

  const onSaveEditSubtopic = () => {
    if (!editSubtopic?.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    updateSubtopic(
      {
        id: editSubtopic.id,
        payload: {
          name: editSubtopic.name.trim(),
          description: editSubtopic.description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditSubtopic(null);
          invalidateProgress();
          toast.success("Subtopic updated.");
        },
        onError: () => toast.error("Could not update subtopic."),
      }
    );
  };

  const onConfirmDeleteSubtopic = () => {
    if (!deleteSubtopicId) return;
    deleteSubtopic(deleteSubtopicId, {
      onSuccess: () => {
        setDeleteSubtopicId(null);
        invalidateProgress();
        toast.success("Subtopic deleted.");
      },
      onError: () => toast.error("Could not delete subtopic."),
    });
  };

  const toggleSubtopicComplete = (
    subtopicId: string,
    completed: boolean,
    termId: string,
    topicSubjectId?: string,
    topicClassLevelId?: string | null
  ) => {
    const subjectForAction = topicSubjectId ?? selectionSubjectId ?? undefined;
    const classLevelForAction =
      topicClassLevelId ?? selectionClassLevelId ?? undefined;

    if (!subjectForAction) {
      toast.error("Missing subject context.");
      return;
    }
    if (!classLevelForAction) {
      toast.error("Select a class level to record progress for that class.");
      return;
    }
    if (completed) {
      unmarkComplete(
        {
          subtopicId,
          subjectId: subjectForAction,
          classLevelId: classLevelForAction,
          academicTermId: termId,
        },
        {
          onSuccess: () => {
            invalidateProgress();
            toast.success("Marked as not complete.");
          },
          onError: () => toast.error("Could not update."),
        }
      );
    } else {
      markComplete(
        {
          subtopicId,
          subjectId: subjectForAction,
          classLevelId: classLevelForAction,
          academicTermId: termId,
        },
        {
          onSuccess: () => {
            invalidateProgress();
            toast.success("Marked complete.");
          },
          onError: () => toast.error("Could not update."),
        }
      );
    }
  };

  const onSendNote = (
    topicId: string,
    topicSubjectId: string | undefined,
    draftKey: string,
    parentId: string
  ) => {
    const content = (noteDraftByTopic[draftKey] ?? "").trim();
    if (!content) {
      toast.warn("Write a message first.");
      return;
    }
    if (!topicSubjectId || !academicTermId) {
      toast.error("Missing subject or term.");
      return;
    }
    if (!parentId) {
      toast.warn("There is no admin note to reply to yet.");
      return;
    }
    replyNote(
      {
        topicId,
        content,
        subjectId: topicSubjectId,
        parentId,
        academicTermId,
      },
      {
        onSuccess: () => {
          setNoteDraftByTopic((p) => ({ ...p, [draftKey]: "" }));
          queryClient.invalidateQueries({
            queryKey: ["teacherTopicNotes", topicId],
          });
          invalidateProgress();
          toast.success("Sent.");
        },
        onError: () => toast.error("Could not send."),
      }
    );
  };

  const overall = dashboard?.overall;
  const topics = dashboard?.topics ?? [];

  const filtersBusy = calendarsLoading || classesLoading;

  return (
    <div className="pb-8 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <TermFilterCard
            fitFilterGrid
            calendars={calendars ?? []}
            calendarsLoading={calendarsLoading}
            sortedTerms={sortedTerms}
            value={academicTermId}
            onChange={(id) => setAcademicTermId(id ?? "")}
          />
          <Select
            label="Subject"
            placeholder="Subject"
            data={subjectSelectData}
            value={subjectId}
            onChange={(v) => {
              setSubjectId((v as string) ?? "");
              setClassLevelId("");
            }}
            searchable
            disabled={filtersBusy}
          />
          <Select
            label="Class level"
            placeholder="Class"
            data={classSelectData}
            value={classLevelId}
            onChange={(v) => setClassLevelId((v) ?? "")}
            searchable
            disabled={filtersBusy}
          />
        </div>
      </div>

      {!academicTermId ? (
        <p className="text-sm text-gray-500">Select a term to load progress.</p>
      ) : progressLoading ? (
        <div className="flex justify-center py-20">
          <HashLoader color="#AB58E7" size={40} />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Overall Progress
              </h3>
              <span
                className="text-2xl font-bold tabular-nums"
                style={{ color: "#805AD5" }}
              >
                {overall?.avgProgress ?? 0}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-violet-600 transition-all"
                style={{
                  width: `${Math.min(100, overall?.avgProgress ?? 0)}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {overall?.completedLabel ?? "0 of 0 topics completed"}
            </p>
          </div>

          <div className="space-y-4">
            {topics.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-500 text-sm">
                No curriculum topics for this selection.
              </div>
            ) : (
              topics.map((topic) => {
                const topicKey = `${topic.subjectId}:${topic.classLevelId ?? "none"}:${topic.topicId}`;
                return (
                <TopicAccordionRow
                  key={topicKey}
                  topic={topic}
                  expanded={expandedTopicIds.has(topicKey)}
                  onToggle={() => toggleTopic(topicKey)}
                  academicTermId={academicTermId}
                  selectionSubjectId={selectionSubjectId}
                  selectionClassLevelId={selectionClassLevelId}
                  showClassLevelChip={!classLevelId}
                  subtopicDraft={subtopicDraftByTopic[topicKey] ?? ""}
                  onSubtopicDraftChange={(v) =>
                    setSubtopicDraftByTopic((p) => ({
                      ...p,
                      [topicKey]: v,
                    }))
                  }
                  onAddSubtopic={() => onAddSubtopic(topic.topicId, topicKey)}
                  creatingSub={creatingSub}
                  onEditSubtopic={(st) =>
                    setEditSubtopic({
                      id: st.id,
                      topicId: topic.topicId,
                      name: st.name,
                      description: "",
                    })
                  }
                  onDeleteSubtopic={(id) => setDeleteSubtopicId(id)}
                  toggleSubtopicComplete={(sid, done) =>
                    toggleSubtopicComplete(
                      sid,
                      done,
                      academicTermId,
                      topic.subjectId,
                      topic.classLevelId
                    )
                  }
                  toggling={marking || unmarking}
                  noteDraft={noteDraftByTopic[topicKey] ?? ""}
                  onNoteDraftChange={(v) =>
                    setNoteDraftByTopic((p) => ({ ...p, [topicKey]: v }))
                  }
                  onSendNote={(parentId) =>
                    onSendNote(
                      topic.topicId,
                      topic.subjectId,
                      topicKey,
                      parentId
                    )
                  }
                  replying={replying}
                />
              )})
            )}
          </div>
        </>
      )}

      <Dialog
        isOpen={Boolean(editSubtopic)}
        onClose={() => setEditSubtopic(null)}
        onSave={onSaveEditSubtopic}
        dialogTitle="Edit subtopic"
        saveButtonText="Save"
        busy={updatingSub}
      >
        <div className="mt-2 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="Name"
            value={editSubtopic?.name ?? ""}
            onChange={(e) =>
              setEditSubtopic((p) =>
                p ? { ...p, name: e.target.value } : p
              )
            }
          />
          <InputField
            className="!py-0"
            label="Description"
            value={editSubtopic?.description ?? ""}
            onChange={(e) =>
              setEditSubtopic((p) =>
                p ? { ...p, description: e.target.value } : p
              )
            }
          />
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(deleteSubtopicId)}
        onClose={() => setDeleteSubtopicId(null)}
        onSave={onConfirmDeleteSubtopic}
        dialogTitle="Delete subtopic"
        saveButtonText="Delete"
        busy={deletingSub}
      >
        <p className="text-sm text-gray-600 mt-1">
          Remove this subtopic? This cannot be undone.
        </p>
      </Dialog>
    </div>
  );
};

type TopicAccordionRowProps = {
  topic: TeacherProgressTopicCard;
  expanded: boolean;
  onToggle: () => void;
  academicTermId: string;
  selectionSubjectId: string | undefined;
  selectionClassLevelId: string | null;
  showClassLevelChip?: boolean;
  subtopicDraft: string;
  onSubtopicDraftChange: (v: string) => void;
  onAddSubtopic: () => void;
  creatingSub: boolean;
  onEditSubtopic: (st: { id: string; name: string }) => void;
  onDeleteSubtopic: (id: string) => void;
  toggleSubtopicComplete: (id: string, completed: boolean) => void;
  toggling: boolean;
  noteDraft: string;
  onNoteDraftChange: (v: string) => void;
  onSendNote: (parentId: string) => void;
  replying: boolean;
};

function TopicAccordionRow({
  topic,
  expanded,
  onToggle,
  academicTermId,
  selectionSubjectId,
  selectionClassLevelId,
  showClassLevelChip = false,
  subtopicDraft,
  onSubtopicDraftChange,
  onAddSubtopic,
  creatingSub,
  onEditSubtopic,
  onDeleteSubtopic,
  toggleSubtopicComplete,
  toggling,
  noteDraft,
  onNoteDraftChange,
  onSendNote,
  replying,
}: TopicAccordionRowProps) {
  const status = topicStatusLabel(topic);
  const { notes, isLoading: notesLoading } = useGetTeacherTopicNotes(
    expanded ? topic.topicId : undefined,
    {
      subjectId: topic.subjectId || selectionSubjectId,
      academicTermId,
      enabled: expanded && Boolean(topic.subjectId || selectionSubjectId),
    }
  );

  const replyParentId = useMemo(
    () => findLatestAdminRootNoteId(notes),
    [notes]
  );
  const noteMessageCount = useMemo(
    () => countTopicNotesInTree(notes),
    [notes]
  );
  const replyLocked =
    notesLoading ||
    !replyParentId ||
    !(topic.subjectId || selectionSubjectId) ||
    !academicTermId;
  const completionLocked =
    !(topic.subjectId || selectionSubjectId) ||
    !(topic.classLevelId || selectionClassLevelId);

  const pct = topic.progressPercent;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex flex-wrap items-start gap-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
      >
        <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[2rem] h-8 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {topic.weekLabel ?? "—"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <span className="font-semibold text-gray-900">{topic.name}</span>
            {showClassLevelChip && topic.classLevelName ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                {topic.classLevelName}
              </span>
            ) : null}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          {topic.description ? (
            <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-2 max-w-md">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${topicBarClass(pct)}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {pct}%
            </span>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 ml-5">
              <span className="inline-flex items-center gap-1">
                <IconCalendar size={16} className="opacity-60" />
                {topic.plannedStartDate ?? "—"} → {topic.plannedEndDate ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1 text-gray-400">
                <IconMessage size={16} />
                {topic.notesCount}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-gray-400">
          {expanded ? (
            <IconChevronDown size={22} stroke={1.5} />
          ) : (
            <IconChevronRight size={22} stroke={1.5} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-300 pb-5 pt-3 space-y-6 bg-gray-50/40">
          <div className="px-5">
            <p className="text-xs font-semibold text-gray-600 tracking-wide uppercase mb-3">
              Subtopics ({topic.subtopicCounts.completed}/{topic.subtopicCounts.total})
            </p>
            <div className="space-y-2">
              {topic.subtopics.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-gray-300 px-3 py-2.5"
                >
                  <button
                    type="button"
                    disabled={toggling || completionLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtopicComplete(st.id, st.completed);
                    }}
                    className="pt-0.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    aria-label={st.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {st.completed ? (
                      <IconCircleCheck
                        size={22}
                        className="text-emerald-600"
                        stroke={1.5}
                      />
                    ) : (
                      <span className="inline-block w-[22px] h-[22px] rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium text-gray-900 ${
                        st.completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {st.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums shrink-0 pt-0.5">
                    {st.completedAt ?? "—"}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:text-purple-700 hover:bg-purple-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditSubtopic(st);
                      }}
                      aria-label="Edit subtopic"
                    >
                      <IconEdit size={16} stroke={1.5} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubtopic(st.id);
                      }}
                      aria-label="Delete subtopic"
                    >
                      <IconTrash size={16} stroke={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                placeholder="New subtopic name..."
                value={subtopicDraft}
                onChange={(e) => onSubtopicDraftChange(e.target.value)}
                disabled={creatingSub}
              />
              <CustomButton
                variant="outline"
                text="Add"
                icon={<IconPlus size={16} />}
                onClick={onAddSubtopic}
                loading={creatingSub}
                disabled={creatingSub}
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-3">
            <div className="px-5">
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <IconFlag size={18} stroke={1.5} />
              <p className="text-xs font-semibold tracking-wide uppercase">
                Notes ({noteMessageCount})
              </p>
            </div>
            {notesLoading ? (
              <p className="text-sm text-gray-500 mb-4">Loading notes…</p>
            ) : null}
            <ul className="space-y-3 mb-4">
              {notes.map((n) => (
                <CurriculumTopicNoteThread key={n.id} note={n} />
              ))}
            </ul>
            {!notesLoading && notes.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">
                No messages yet. You&apos;ll be able to reply after an
                administrator adds a note.
              </p>
            ) : null}
            {!notesLoading && notes.length > 0 && !replyParentId ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                Replies must be threaded to an administrator note. There is no
                admin message to reply to yet.
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 min-h-[88px] resize-y focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                  replyLocked
                    ? "border-gray-200 bg-gray-100 text-gray-500 placeholder:text-gray-400 cursor-not-allowed"
                    : "border-gray-200 bg-gray-100 placeholder:text-gray-400"
                }`}
                placeholder={
                  replyLocked
                    ? "Reply opens when an administrator posts a note…"
                    : "Write a reply…"
                }
                value={noteDraft}
                onChange={(e) => onNoteDraftChange(e.target.value)}
                disabled={replying || replyLocked}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onSendNote(replyParentId ?? "")}
                  disabled={
                    replying ||
                    replyLocked ||
                    !(noteDraft ?? "").trim()
                  }
                  title={
                    replyLocked
                      ? "An admin note is required before you can reply"
                      : "Send reply"
                  }
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send reply"
                >
                  <IconSend size={18} />
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
