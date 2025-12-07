"use client";
import { AssignmentSubmission } from "@/@types";
import { HashLoader } from "react-spinners";
import React, { useState } from "react";
import { Dialog } from "@/components/common/Dialog";
import CustomButton from "@/components/Button";

interface SubmittedAssignmentStudentsTableProps {
  students: AssignmentSubmission[];
  isLoading?: boolean;
}

// Extended interface for admin submissions that includes additional properties
interface AdminAssignmentSubmission extends AssignmentSubmission {
  fileUrl?: string;
  mediaType?: string;
  notes?: string;
  overDue?: string;
}

const SubmittedAssignmentStudentsTable = ({ 
  students, 
  isLoading
}: SubmittedAssignmentStudentsTableProps) => {
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminAssignmentSubmission | null>(null);
  const handleViewSubmissionClick = (student: AssignmentSubmission) => {
    setSelectedStudent(student as AdminAssignmentSubmission);
    setIsSubmissionDialogOpen(true);
  };

  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "graded") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Graded
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Submitted
      </span>
    );
  };

  return (
    <>
      <section className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                  <div>Student Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-center max-md:px-5 min-w-[120px]">
                  <div>Student ID</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[200px]">
                  <div>Email</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[180px]">
                  <div>Submitted Date</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-right max-md:px-5 min-w-[120px]">
                  <div>Status</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                  <div>Score</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-[100px]">
                  <div>Action</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={7}>
                        <div className="relative py-16">
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!students?.length) {
                  return (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">
                            No submitted students found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Students who have submitted will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return students.map((student: AssignmentSubmission) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <span className="text-sm font-medium text-zinc-800">
                        {student.firstName} {student.lastName}
                      </span>
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 text-center max-md:px-5">
                      {student.studentId}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {student.email}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {formatDate(student.submittedAt)}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex justify-end">
                        {getStatusBadge(student.status)}
                      </div>
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                      {student.score !== null && student.score !== undefined 
                        ? `${student.score}/100` 
                        : "-"}
                    </td>

                    <td className="text-sm px-6 py-4 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      {/* <button 
                        onClick={() => handleViewSubmissionClick(student)}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        {student.status === "graded" ? "View" : "View & Grade"}
                      </button> */}

                        <CustomButton 
                          text="View Submission"
                          onClick={() => handleViewSubmissionClick(student)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1"
                        />
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>

      {/* Submission Details Dialog */}
      <Dialog
        isOpen={isSubmissionDialogOpen}
        busy={false}
        dialogTitle="Student Submission Details"
        dialogWidth="w-[800px] max-w-[900px]"
        hideCancelButton={true}
        onClose={() => {
          setIsSubmissionDialogOpen(false);
          setSelectedStudent(null);
        }}
        onSave={() => {
          setIsSubmissionDialogOpen(false);
          setSelectedStudent(null);
        }}
        saveButtonText="Close"
      >
        <div className="mt-3">
          {selectedStudent && (
            <>
              {/* Student Information */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Student ID:</span>
                    <p className="text-gray-900">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedStudent.status)}
                    </div>
                  </div>
                </div>
              </div>

              {/* File Attachment */}
              {selectedStudent.fileUrl && (
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
                        <p className="font-medium text-gray-900">Assignment File</p>
                        <p className="text-sm text-gray-600">
                          {selectedStudent.mediaType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "Word Document" : selectedStudent.mediaType}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {formatDate(selectedStudent.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={selectedStudent.fileUrl} 
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
              {selectedStudent.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Student Notes</h4>
                  <div className="bg-white border rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedStudent.notes}</p>
                  </div>
                </div>
              )}

              {/* Grade & Feedback */}
              {(selectedStudent.score !== null && selectedStudent.score !== undefined) && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">Grade & Feedback</h4>
                  <div className="mb-3">
                    <span className="font-medium text-green-700">Score:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-green-900">{selectedStudent.score}</span>
                      <span className="text-green-700">/ 100</span>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-sm font-medium">
                        {Math.round((selectedStudent.score / 100) * 100)}%
                      </span>
                    </div>
                  </div>
                  {selectedStudent.feedback && (
                    <div>
                      <span className="font-medium text-green-700">Feedback:</span>
                      <div className="mt-1 p-3 bg-green-100 rounded border">
                        <p className="text-green-900 whitespace-pre-wrap">{selectedStudent.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default SubmittedAssignmentStudentsTable;