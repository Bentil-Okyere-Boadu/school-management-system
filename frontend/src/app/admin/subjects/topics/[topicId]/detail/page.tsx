"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendar,
  IconCircleCheck,
  IconEdit,
  IconMessage,
  IconPlus,
  IconSend,
  IconTrash,
} from "@tabler/icons-react";
import { HashLoader } from "react-spinners";
import { toast } from "react-toastify";
import {
  useCreateCurriculumTopicNote,
  useCreateSubtopic,
  useDeleteCurriculumTopicNote,
  useDeleteSubtopic,
  useGetCurriculumTopicDetail,
  useGetCurriculumTopicNotes,
  useUpdateSubtopic,
} from "@/hooks/school-admin";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import type {
  CurriculumTopicDetailData,
  CurriculumTopicDetailSubtopic,
} from "@/@types";

function topicStatusPresentation(topic: CurriculumTopicDetailData["topic"]): {
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
    label: "To Do",
    className: "text-gray-700 bg-gray-100 border border-gray-200",
  };
}

function formatNoteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function CurriculumTopicDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = (params.topicId as string) ?? "";
  const subjectId = searchParams.get("subjectId") ?? "";
  const academicTermId = searchParams.get("academicTermId") ?? undefined;

  const { detail, isLoading, error } = useGetCurriculumTopicDetail(
    topicId,
    subjectId,
    academicTermId
  );
  const { notes, isLoading: notesLoading } = useGetCurriculumTopicNotes(
    topicId,
    subjectId,
    academicTermId
  );

  const [noteDraft, setNoteDraft] = useState("");
  const [subtopicDialogOpen, setSubtopicDialogOpen] = useState(false);
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(
    null
  );
  const [newSubtopicName, setNewSubtopicName] = useState("");
  const [newSubtopicDescription, setNewSubtopicDescription] = useState("");
  const [deleteSubtopicId, setDeleteSubtopicId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const { mutate: sendNote, isPending: noteSending } =
    useCreateCurriculumTopicNote();
  const { mutate: deleteNote, isPending: deletingNote } =
    useDeleteCurriculumTopicNote(topicId);
  const { mutate: createSubtopic, isPending: subtopicSaving } =
    useCreateSubtopic(topicId);
  const { mutate: updateSubtopic, isPending: updatingSubtopic } =
    useUpdateSubtopic(topicId);
  const { mutate: deleteSubtopic, isPending: deletingSubtopic } =
    useDeleteSubtopic(topicId);

  const topic = detail?.topic;
  const subject = detail?.subject;
  const subtopics = detail?.subtopics ?? [];

  const teacherName = useMemo(() => {
    if (!subject?.teacher) return "—";
    const t = subject.teacher;
    return (
      t.name?.trim() ||
      [t.firstName, t.lastName].filter(Boolean).join(" ").trim() ||
      "—"
    );
  }, [subject?.teacher]);

  const classLine = subject?.classLevels?.length
    ? subject.classLevels.map((c) => c.name).join(", ")
    : "—";

  const breadcrumb = subject
    ? `${subject.subjectCatalog.name} · ${classLine} · ${teacherName}`
    : "";

  const status = topic ? topicStatusPresentation(topic) : null;

  const completedSubCount = subtopics.filter((s) => s.completed).length;
  const totalSubCount = subtopics.length;

  const onSendNote = () => {
    const content = noteDraft.trim();
    if (!content) {
      toast.warn("Write a note first.");
      return;
    }
    sendNote(
      {
        topicId,
        content,
        subjectId: subjectId || undefined,
        academicTermId,
      },
      {
        onSuccess: () => {
          setNoteDraft("");
          toast.success("Note added.");
        },
        onError: () => toast.error("Could not add note."),
      }
    );
  };

  const onConfirmDeleteNote = () => {
    if (!deleteNoteId) return;
    deleteNote(deleteNoteId, {
      onSuccess: () => {
        setDeleteNoteId(null);
        toast.success("Note deleted.");
      },
      onError: () => toast.error("Could not delete note."),
    });
  };

  const closeSubtopicDialog = () => {
    setSubtopicDialogOpen(false);
    setEditingSubtopicId(null);
    setNewSubtopicName("");
    setNewSubtopicDescription("");
  };

  const openAddSubtopic = () => {
    setEditingSubtopicId(null);
    setNewSubtopicName("");
    setNewSubtopicDescription("");
    setSubtopicDialogOpen(true);
  };

  const openEditSubtopic = (st: CurriculumTopicDetailSubtopic) => {
    setEditingSubtopicId(st.id);
    setNewSubtopicName(st.name);
    setNewSubtopicDescription(st.description ?? "");
    setSubtopicDialogOpen(true);
  };

  const onSaveSubtopic = () => {
    if (!newSubtopicName.trim()) {
      toast.error("Name is required.");
      return;
    }
    const name = newSubtopicName.trim();
    const description = newSubtopicDescription.trim() || undefined;

    if (editingSubtopicId) {
      updateSubtopic(
        {
          id: editingSubtopicId,
          payload: { name, description },
        },
        {
          onSuccess: () => {
            closeSubtopicDialog();
            toast.success("Subtopic updated.");
          },
          onError: () => toast.error("Could not update subtopic."),
        }
      );
      return;
    }

    createSubtopic(
      { name, description },
      {
        onSuccess: () => {
          closeSubtopicDialog();
          toast.success("Subtopic added.");
        },
        onError: () => toast.error("Could not add subtopic."),
      }
    );
  };

  const onConfirmDeleteSubtopic = () => {
    if (!deleteSubtopicId) return;
    deleteSubtopic(deleteSubtopicId, {
      onSuccess: () => {
        setDeleteSubtopicId(null);
        toast.success("Subtopic deleted.");
      },
      onError: () => toast.error("Could not delete subtopic."),
    });
  };

  if (!subjectId) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] px-0.5 py-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/admin/subjects?tab=curriculum-progress"
            className="text-sm text-purple-700 hover:text-purple-800 underline inline-flex items-center gap-1 mb-4"
          >
            <IconArrowLeft size={16} /> Back
          </Link>
          <p className="text-gray-600">
            Missing <code className="text-sm bg-gray-100 px-1 rounded">subjectId</code>{" "}
            in the URL.
          </p>
        </div>
      </div>
    );
  }

  const progressPct = topic?.progressPercent ?? 0;
  const barClass =
    progressPct >= 100
      ? "bg-emerald-500"
      : progressPct > 0
        ? "bg-emerald-400"
        : "bg-gray-200";

  return (
    <div className="min-h-screen bg-[#f4f6f8] pb-16">
      <div className="px-0.5">
        <Link
          href="/admin/subjects?tab=curriculum-progress"
          className="text-bold text-purple-700 inline-flex items-center gap-1.5 mb-1"
        >
          <IconArrowLeft size={18} stroke={1.5} />
          Back
        </Link>

        {isLoading && (
          <div className="py-24 flex justify-center">
            <HashLoader color="#AB58E7" size={40} />
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-4 text-sm">
            Could not load topic detail.
          </div>
        )}

        {!isLoading && !error && topic && status && (
          <>
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {topic.name}
                </h1>
                {breadcrumb ? (
                  <p className="text-sm text-gray-500 mt-2">{breadcrumb}</p>
                ) : null}
                {topic.description ? (
                  <p className="text-gray-600 mt-1 max-w-3xl leading-relaxed">
                    {topic.description}
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 inline-flex text-sm font-medium px-3 py-1.5 rounded-full ${status.className}`}
              >
                {status.label}
              </span>
            </header>

            {/* Summary cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Status
                </p>
                <span
                  className={`inline-flex text-sm font-medium px-2.5 py-1 rounded-full ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Expected completion
                </p>
                <div className="flex items-center gap-2 text-gray-900">
                  <IconCalendar
                    size={20}
                    className="text-gray-400 shrink-0"
                    stroke={1.5}
                  />
                  <span className="font-medium">
                    {topic.plannedEndDate ?? "—"}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Date completed
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {topic.dateCompleted ?? "—"}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Progress
                </p>
                <p
                  className="text-2xl font-bold mb-3"
                  style={{ color: "#805AD5" }}
                >
                  {progressPct}%
                </p>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barClass}`}
                    style={{ width: `${Math.min(100, progressPct)}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Schedule */}
            <section className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Week</p>
                  <p className="text-gray-900 font-medium">
                    {topic.weekLabel ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Start date
                  </p>
                  <p className="text-gray-900 font-medium">
                    {topic.plannedStartDate ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    End date
                  </p>
                  <p className="text-gray-900 font-medium">
                    {topic.plannedEndDate ?? "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Subtopics */}
            <section className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Subtopics ({completedSubCount}/{totalSubCount})
                </h2>
                <CustomButton
                  variant="outline"
                  text="Add Subtopic"
                  icon={<IconPlus size={18} />}
                  onClick={openAddSubtopic}
                />
              </div>
              <div className="divide-y divide-gray-100">
                {subtopics.length === 0 ? (
                  <p className="px-6 py-10 text-center text-gray-500 text-sm">
                    No subtopics yet. Add one to break down this topic.
                  </p>
                ) : (
                  subtopics.map((st) => (
                    <div
                      key={st.id}
                      className="px-6 py-4 flex items-start gap-3 sm:gap-4 hover:bg-gray-50/80"
                    >
                      <div className="pt-0.5 shrink-0">
                        {st.completed ? (
                          <IconCircleCheck
                            size={22}
                            className="text-emerald-600"
                            stroke={1.5}
                          />
                        ) : (
                          <span className="inline-block w-[22px] h-[22px] rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-gray-900 ${
                            st.completed ? "line-through text-gray-500" : ""
                          }`}
                        >
                          {st.name}
                        </p>
                        {st.description ? (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {st.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 tabular-nums shrink-0 pt-0.5">
                        {st.completedAt}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 pt-0.5 pl-10">
                        <button
                          type="button"
                          onClick={() => openEditSubtopic(st)}
                          className="p-2 rounded-md text-gray-400 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                          aria-label={`Edit ${st.name}`}
                        >
                          <IconEdit size={18} stroke={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteSubtopicId(st.id)}
                          className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          aria-label={`Delete ${st.name}`}
                        >
                          <IconTrash size={18} stroke={1.5} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <IconMessage
                  size={22}
                  className="text-gray-400"
                  stroke={1.5}
                />
                <h2 className="text-lg font-semibold text-gray-900">
                  Notes ({notes.length})
                </h2>
              </div>

              <div className="px-6 py-4 min-h-[120px]">
                {notesLoading ? (
                  <div className="flex justify-center py-8">
                    <HashLoader color="#AB58E7" size={28} />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No notes yet.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {notes.map((n) => (
                      <li
                        key={n.id}
                        className="text-sm border-b border-gray-100 last:border-0 pb-4 last:pb-0 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {n.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatNoteDate(n.createdAt)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeleteNoteId(n.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-70 group-hover:opacity-100"
                            aria-label="Delete note"
                          >
                            <IconTrash size={18} stroke={1.5} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100">
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 min-h-[100px] resize-y bg-white"
                  placeholder="Add a note..."
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  disabled={noteSending}
                />
                <div className="flex justify-end mt-3">
                  <CustomButton
                    text="Send"
                    loading={noteSending}
                    disabled={noteSending}
                    icon={<IconSend size={18} />}
                    onClick={onSendNote}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog
        isOpen={subtopicDialogOpen}
        onClose={closeSubtopicDialog}
        onSave={onSaveSubtopic}
        dialogTitle={editingSubtopicId ? "Edit Subtopic" : "Add Subtopic"}
        saveButtonText={editingSubtopicId ? "Save" : "Add"}
        busy={subtopicSaving || updatingSubtopic}
      >
        <div className="mt-2 flex flex-col gap-4">
          <InputField
            className="!py-0"
            label="Name"
            placeholder="e.g. Single-digit addition"
            value={newSubtopicName}
            onChange={(e) => setNewSubtopicName(e.target.value)}
          />
          <InputField
            className="!py-0"
            label="Description"
            placeholder="Optional"
            value={newSubtopicDescription}
            onChange={(e) => setNewSubtopicDescription(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(deleteSubtopicId)}
        onClose={() => setDeleteSubtopicId(null)}
        onSave={onConfirmDeleteSubtopic}
        dialogTitle="Delete subtopic"
        saveButtonText="Delete"
        busy={deletingSubtopic}
      >
        <p className="text-sm text-gray-600 mt-1">
          This subtopic will be removed from the topic. This cannot be undone.
        </p>
      </Dialog>

      <Dialog
        isOpen={Boolean(deleteNoteId)}
        onClose={() => setDeleteNoteId(null)}
        onSave={onConfirmDeleteNote}
        dialogTitle="Delete note"
        saveButtonText="Delete"
        busy={deletingNote}
      >
        <p className="text-sm text-gray-600 mt-1">
          Remove this note permanently?
        </p>
      </Dialog>
    </div>
  );
}
