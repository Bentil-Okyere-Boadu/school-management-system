"use client";
import React, { useState } from "react";
import { AssignmentSubmission, ErrorResponse } from "@/@types";
import { useGetAssignmentSubmittedStudents, useGradeAssignmentSubmission, useGetStudentSubmissionDetails } from "@/hooks/teacher";
import { HashLoader } from "react-spinners";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";
import InputField from "@/components/InputField";
import { toast } from "react-toastify";

interface SubmittedTabProps {
  assignmentId: string;
  maxScore: number;
}

export const SubmittedTab: React.FC<SubmittedTabProps> = ({ assignmentId, maxScore }) => {
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AssignmentSubmission | null>(null);
  const [selectedStudentForSubmission, setSelectedStudentForSubmission] = useState<AssignmentSubmission | null>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  const { submittedStudents, isLoading, refetch } = useGetAssignmentSubmittedStudents(assignmentId);
  const { mutate: gradeSubmission, isPending: grading } = useGradeAssignmentSubmission();
  const { data: submissionDetails, isLoading: loadingSubmission } = useGetStudentSubmissionDetails(
    assignmentId, 
    selectedStudentForSubmission?.id || "",
    isSubmissionDialogOpen && !!selectedStudentForSubmission
  );

  const handleViewSubmissionClick = (student: AssignmentSubmission) => {
    setSelectedStudentForSubmission(student);
    setIsSubmissionDialogOpen(true);
  };

  const handleGradeClick = (student: AssignmentSubmission) => {
    setSelectedStudent(student);
    setScore(student.score?.toString() || "");
    setFeedback(student.feedback || "");
    setIsGradingDialogOpen(true);
  };

  const isGraded = (student: AssignmentSubmission) => {
    return student.status === "graded" || (student.score !== null && student.score !== undefined);
  };

  const handleGradeSubmit = () => {
    if (!selectedStudent) return;

    const scoreNum = Number.parseInt(score);
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`);
      return;
    }

    gradeSubmission(
      {
        assignmentId,
        studentId: selectedStudent.id,
        score: scoreNum,
        feedback: feedback || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Assignment graded successfully");
          setIsGradingDialogOpen(false);
          setSelectedStudent(null);
          setScore("");
          setFeedback("");
          refetch();
        },
        onError: (error: unknown) => {
          toast.error(JSON.stringify((error as ErrorResponse).response?.data?.message || "Failed to grade assignment"));
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <section className="bg-white mt-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Student Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Student ID</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Submitted Date</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Status</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5">
                  <div>Score</div>
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
                      <td colSpan={7}>
                        <div className="relative py-20 bg-white">
                          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!submittedStudents?.length) {
                  return (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No submitted assignments</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Submitted assignments will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return submittedStudents.map((student: AssignmentSubmission) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{`${student.firstName} ${student.lastName}`}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{student.studentId || "-"}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{student.submittedAt ? formatDate(student.submittedAt.toString()) : "-"}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === "graded" || (student.score !== null && student.score !== undefined)
                            ? "bg-green-200 text-green-700"
                            : "bg-purple-200 text-purple-700"
                        }`}
                      >
                        {student.status === "graded" || (student.score !== null && student.score !== undefined) ? "Graded" : "Submitted"}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>
                        {student.score !== undefined && student.score !== null
                          ? `${student.score}/${maxScore}`
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex gap-2">
                        <CustomButton 
                          text="View Submission"
                          onClick={() => handleViewSubmissionClick(student)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1"
                        />
                        <CustomButton 
                          text="Grade"
                          onClick={() => handleGradeClick(student)}
                          className="text-xs px-3 py-1" 
                        />
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        isOpen={isGradingDialogOpen}
        busy={grading}
        dialogTitle={selectedStudent && isGraded(selectedStudent) ? "View Grade" : "Grade Assignment"}
        onClose={() => {
          setIsGradingDialogOpen(false);
          setSelectedStudent(null);
          setScore("");
          setFeedback("");
        }}
        onSave={handleGradeSubmit}
        saveButtonText={selectedStudent && isGraded(selectedStudent) ? "Update Grade" : "Submit Grade"}
      >
        <div className="mt-3">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Student:</span> {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ""}
            </p>
            {selectedStudent?.studentId && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Student ID:</span> {selectedStudent.studentId}
              </p>
            )}
            {selectedStudent?.submittedAt && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Submitted:</span>{" "}
                {formatDate(selectedStudent.submittedAt.toString())}
              </p>
            )}
          </div>

          <InputField
            className="!py-0 mb-4"
            label="Score"
            type="number"
            min={0}
            max={maxScore}
            placeholder={`0-${maxScore}`}
            onChange={(e) => setScore(e.target.value)}
            value={score}
            required
          />

          <div className="mb-4">
            <label htmlFor="feedback" className="mb-1.5 text-xs text-zinc-600 block">
              Feedback (Optional)
            </label>
            <textarea
              id="feedback"
              className="px-3 py-2.5 h-24 rounded border-solid border-[0.5px] border-zinc-500 text-zinc-800 w-full resize-y"
              placeholder="Provide feedback for the student..."
              onChange={(e) => setFeedback(e.target.value)}
              value={feedback}
            />
          </div>
        </div>
      </Dialog>

      {/* Submission Details Dialog */}
      <Dialog
        isOpen={isSubmissionDialogOpen}
        busy={loadingSubmission}
        dialogTitle="Student Submission Details"
        dialogWidth="w-[800px] max-w-[900px]"
        hideCancelButton={true}
        onClose={() => {
          setIsSubmissionDialogOpen(false);
          setSelectedStudentForSubmission(null);
        }}
        onSave={() => {
          setIsSubmissionDialogOpen(false);
          setSelectedStudentForSubmission(null);
        }}
        saveButtonText="Close"
      >
        <div className="mt-3">
          {selectedStudentForSubmission && submissionDetails?.data && (
            <>
              {/* Assignment Information */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">Assignment Details</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Title:</span>
                    <p className="text-blue-900 mt-1">{submissionDetails.data.assignment?.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Instructions:</span>
                    <p className="text-blue-900 mt-1 whitespace-pre-wrap">{submissionDetails.data.assignment?.instructions}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-blue-700">Subject:</span>
                      <p className="text-blue-900">{submissionDetails.data.assignment?.subject}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Topic:</span>
                      <p className="text-blue-900">{submissionDetails.data.assignment?.topic}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Due Date:</span>
                      <p className="text-blue-900">{submissionDetails.data.assignment?.dueDate ? formatDate(submissionDetails.data.assignment.dueDate) : "-"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Max Score:</span>
                      <p className="text-blue-900">{submissionDetails.data.assignment?.maxScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Attachment */}
              {submissionDetails.data.fileUrl && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Submitted File</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Assignment File
                        </p>
                        <p className="text-sm text-gray-600">
                          {submissionDetails.data.mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "Word Document" : submissionDetails.data.mediaType}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {submissionDetails.data.submittedAt ? formatDate(submissionDetails.data.submittedAt) : "-"}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={submissionDetails.data.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}

              {/* Submission Content */}
              {submissionDetails.data.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Student&apos; notes</h4>
                  <div className="bg-white border rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{submissionDetails.data.notes}</p>
                  </div>
                </div>
              )}

              {/* Student Information */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{`${submissionDetails.data.student?.firstName} ${submissionDetails.data.student?.lastName}`}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Student ID:</span>
                    <p className="text-gray-900">{submissionDetails.data.student?.studentId || "-"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{submissionDetails.data.student?.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submissionDetails.data.status === "graded" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {submissionDetails.data.status === "graded" ? "Graded" : "Submitted"}
                      </span>
                      {submissionDetails.data.overDue && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {submissionDetails.data.overDue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade & Feedback */}
              {(submissionDetails.data.score !== null && submissionDetails.data.score !== undefined) && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">Grade & Feedback</h4>
                  <div className="mb-3">
                    <span className="font-medium text-green-700">Score:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-green-900">{submissionDetails.data.score}</span>
                      <span className="text-green-700">/ {submissionDetails.data.assignment?.maxScore}</span>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm font-medium">
                        {Math.round((submissionDetails.data.score / (submissionDetails.data.assignment?.maxScore || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                  {submissionDetails.data.feedback && (
                    <div>
                      <span className="font-medium text-green-700">Feedback:</span>
                      <div className="mt-1 p-3 bg-green-100 rounded border">
                        <p className="text-green-900 whitespace-pre-wrap">{submissionDetails.data.feedback}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-2 text-sm text-green-700">
                    Last updated: {submissionDetails.data.updatedAt ? formatDate(submissionDetails.data.updatedAt) : "-"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

