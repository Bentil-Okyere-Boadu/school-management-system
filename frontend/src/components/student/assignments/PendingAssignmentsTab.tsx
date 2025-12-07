"use client";
import React, { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import FileUploadArea from "@/components/common/FileUploadArea";
import { StudentAssignment, ErrorResponse } from "@/@types";
import { useGetStudentAssignments, useSubmitAssignment } from "@/hooks/student";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { HashLoader } from "react-spinners";
import { AttachmentIcon } from "@/utils/icons";
import { IconUpload } from "@tabler/icons-react";

export const PendingAssignmentsTab: React.FC = () => {
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { assignments, isLoading, refetch } = useGetStudentAssignments("pending");
  const { mutate: submitAssignment, isPending: submitting } = useSubmitAssignment(
    selectedAssignment?.id || ""
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const handleSubmitClick = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setSelectedFile([]);
    setNotes("");
    setIsSubmitDialogOpen(true);
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFile(files);
  };

  const handleSubmit = () => {
    if (selectedFile.length === 0 && !notes.trim()) {
      toast.error("Please, either upload a file or add notes");
      return;
    }

    // Show confirmation dialog before final submission
    setIsConfirmSubmitOpen(true);
  };

  const handleConfirmSubmit = () => {
    submitAssignment(
      {
        file: selectedFile[0],
        notes: notes,
      },
      {
        onSuccess: () => {
          toast.success("Assignment submitted successfully");
          setIsSubmitDialogOpen(false);
          setIsConfirmSubmitOpen(false);
          setSelectedAssignment(null);
          setSelectedFile([]);
          setNotes("");
          // Refetch pending assignments
          refetch();
          // Refetch submitted assignments to update the count
          queryClient.invalidateQueries({ queryKey: ['studentAssignments', 'submitted'] });
        },
        onError: (error: unknown) => {
          toast.error(
            JSON.stringify((error as ErrorResponse).response?.data?.message || "Failed to submit assignment")
          );
        },
      }
    );
  };

  return (
    <>
      <section className="bg-white mt-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Assignment</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Subject</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Topic</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Type</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Teacher</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Due Date</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Status</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={8}>
                        <div className="relative py-20 bg-white">
                          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!assignments?.length) {
                  return (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No pending assignments</p>
                          <p className="text-sm text-gray-400 mt-1">
                            All assignments have been submitted.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return assignments.map((assignment: StudentAssignment) => {
                  const daysOverdue = calculateDaysOverdue(assignment.dueDate);
                  return (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div className="flex gap-2">
                          <div className="flex justify-center">
                            {assignment.attachmentPath && (
                              <a 
                                href={assignment.attachmentUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"
                                title="View attachment"
                              >
                                <AttachmentIcon />
                              </a>
                            )}
                          </div>
                          {assignment.assignment}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{assignment.subject}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{assignment.topic || "-"}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (assignment.assignmentType || "online") === "online"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {(assignment.assignmentType || "online") === "online" ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>{assignment.teacher}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <div>
                          {formatDate(assignment.dueDate)}
                          {daysOverdue > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-700">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-2 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        {assignment.assignmentType === "offline" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Offline Assignment
                          </span>
                        ) : (
                          <CustomButton
                            text="Submit"
                            onClick={() => handleSubmitClick(assignment)}
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            icon={<IconUpload size={16} />}
                          />
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        isOpen={isSubmitDialogOpen}
        busy={submitting}
        dialogTitle="Submit Assignment"
        onClose={() => {
          setIsSubmitDialogOpen(false);
          setSelectedFile([]);
          setNotes("");
        }}
        onSave={handleSubmit}
        saveButtonText="Submit Assignment"
      >
        <div className="mt-3">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Assignment: {selectedAssignment?.assignment}
            </p>
            <p className="text-xs text-gray-500">
              Subject: {selectedAssignment?.subject} | Teacher: {selectedAssignment?.teacher}
            </p>
          </div>

          {/* Display instructions if available */}
          {selectedAssignment?.instructions?.trim() && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedAssignment.instructions}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="file" className="mb-1.5 text-xs text-zinc-600 block">
              Upload File
            </label>
            <FileUploadArea
              onFileSelect={handleFileSelect}
              accept="*/*"
              multiple={false}
            />
            {selectedFile.length > 0 && (
              <div className="text-sm text-gray-700 mt-2">
                Selected: <strong>{selectedFile[0].name}</strong>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="notes" className="mb-1.5 text-xs text-zinc-600 block">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="px-3 py-2.5 h-24 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full resize-y"
              placeholder="Add any additional notes or comments..."
              onChange={(e) => setNotes(e.target.value)}
              value={notes}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isConfirmSubmitOpen}
        busy={submitting}
        dialogTitle="Confirm Submission"
        onClose={() => setIsConfirmSubmitOpen(false)}
        onSave={handleConfirmSubmit}
        dialogWidth="w-[500px]"
        saveButtonText="Yes, Submit Assignment"
      >
        <div className="mt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-yellow-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Are you sure you want to submit this assignment?
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Once submitted, you will not be able to edit or resubmit this assignment. 
                Please review your work and make sure everything is complete.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

