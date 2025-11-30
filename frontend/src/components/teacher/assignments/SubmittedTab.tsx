"use client";
import React, { useState } from "react";
import { AssignmentSubmission, ErrorResponse } from "@/@types";
import { useGetAssignmentSubmittedStudents, useGradeAssignmentSubmission } from "@/hooks/teacher";
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
  const [selectedStudent, setSelectedStudent] = useState<AssignmentSubmission | null>(null);
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  const { submittedStudents, isLoading, refetch } = useGetAssignmentSubmittedStudents(assignmentId);
  const { mutate: gradeSubmission, isPending: grading } = useGradeAssignmentSubmission();

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
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxScore) {
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
                  <div>Action</div>
                </th>
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

                if (!submittedStudents?.length) {
                  return (
                    <tr>
                      <td colSpan={6}>
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
                      <CustomButton 
                        text={student.status === "graded" || (student.score !== null && student.score !== undefined) ? "View" : "Grade"}
                        onClick={() => handleGradeClick(student)} 
                      />
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
    </>
  );
};

