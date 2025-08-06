"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { CustomSelectTag } from '@/components/common/CustomSelectTag';
import CustomButton from '@/components/Button';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import TableInputField from '@/components/common/TableInputField';
import { useGetCalendars, useGetStudentsForGrading, useGetSubjectClasses, usePostStudentGrades,  } from '@/hooks/teacher';
import { ErrorResponse, PostGradesPayload } from '@/@types';
import { toast } from 'react-toastify';

type StudentGrading = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  classScore: number | undefined;
  examScore: number | undefined;
  totalScore: number;
};

export type RawStudentScore = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  otherName: string | null;
  scores: {
    classScore: number;
    examScore: number;
    totalScore: number;
  };
};


const ClassGrading = () => {

  const { classId } = useParams();

  const [studentScores, setStudentScores] = useState<StudentGrading[]>([]);


  const [currentTerm, setCurrentTerm] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [currentSubject, setCurrentSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [termOptions, setTermOptions] = useState([{ label: "Term", value: "" }]);


  const { classSubjects } = useGetSubjectClasses();

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    type: "academicYear" | "term" | "class" | "subject"
  ) => {
    const value = event.target.value;

    if (type === "academicYear") {
      setCurrentAcademicYear(value);

      const selectedCalendar = studentCalendars.find(c => c.id === value);
      const terms = selectedCalendar?.terms || [];

      const formattedTerms = [
        { label: "Term", value: "" },
        ...terms.map(term => ({
          label: term.termName,
          value: term.id
        }))
      ];

      setTermOptions(formattedTerms);
      setCurrentTerm(terms[0]?.id ?? "");
    } else if (type === "term") {
      setCurrentTerm(value);
    } else if (type === "class") {
      setCurrentClass(value);
    } else if (type === "subject") {
      setCurrentSubject(value);
    }
  };


  const { studentCalendars } = useGetCalendars();

  const academicYearOptions = [
    { label: "Academic Year", value: "" },
    ...(studentCalendars ?? []).map((calendar) => ({
      value: calendar?.id,
      label: calendar?.name,
    })),
  ];

  useEffect(() => {
    if (studentCalendars && studentCalendars.length > 0) {
      const firstCalendar = studentCalendars[0];
      setCurrentAcademicYear(firstCalendar.id);

      const terms = firstCalendar.terms || [];
      const formattedTerms = [
        { label: "Term", value: "" },
        ...terms.map(term => ({
          label: term.termName,
          value: term.id
        }))
      ];

      setTermOptions(formattedTerms);
      if (terms.length > 0) {
        setCurrentTerm(terms[0].id);
      }
    }

    if (classId) {
      const classIdStr = classId.toString();
      setCurrentClass(classIdStr);

      const matchedItem = classSubjects?.find(
        (item) => item.classLevel.id === classIdStr
      );

      if (matchedItem?.subjects?.length) {
        setCurrentSubject(matchedItem.subjects[0].id);
      }
    }
    }, [studentCalendars, classId, classSubjects]);

  const subjectOptions = [
    { label: "Subject", value: "" },
    ...(
      classSubjects
        ?.find(item => item.classLevel.id === currentClass)
        ?.subjects.map(subject => ({
          label: subject.name,
          value: subject.id,
        })) ?? []
    )
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery, classId)
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleScoreChange = (studentId: string, field: "classScore" | "examScore", value: string) => {
    const numericValue = Number(value);
    setStudentScores((prev) =>
      prev.map((student) => {
        if (student.id.toString() === studentId) {
          const updatedStudent = {
            ...student,
            [field]: numericValue,
          };
          // update totalScore as sum of class + exam
          updatedStudent.totalScore = (updatedStudent.classScore || 0) + (updatedStudent.examScore || 0);
          return updatedStudent;
        }
        return student;
      })
    );
  };



  const { mutate: postGradesMutation } = usePostStudentGrades();

  const handleSubmitGrades = () => {
    if (!currentClass || !currentSubject || !currentTerm) {
      toast.error("Missing required fields");
      return;
    }

    const grades = studentScores.map((student) => ({
      studentId: student.id,
      classScore: student.classScore || 0,
      examScore: student.examScore || 0,
    }));

    const payload: PostGradesPayload = {
      classLevelId: currentClass,
      subjectId: currentSubject,
      academicTermId: currentTerm,
      grades,
    };

    postGradesMutation(payload, {
      onSuccess: () => {
        toast.success("Grades submitted successfully");
      },
      onError: (error: unknown) => {
        toast.error(
          JSON.stringify((error as ErrorResponse)?.response?.data?.message || "Submission failed")
        );
      },
    });
  };


  const { studentsForGrading } = useGetStudentsForGrading(
    classId as string,
    currentSubject,
    currentAcademicYear,
    currentTerm
  );

  useEffect(() => {
    if (studentsForGrading?.students?.length) {
      const normalized = studentsForGrading.students.map((s: RawStudentScore) => ({
        ...s,
        classScore: s.scores?.classScore || 0,
        examScore: s.scores?.examScore || 0,
        totalScore: s.scores?.totalScore || 0,
      }));
      setStudentScores(normalized);
    } else {
      setStudentScores([]);
    }
  }, [studentsForGrading]);

  return (
    <div className="pb-8">
      <div>
        <div className="flex gap-3 flex-wrap">
          <CustomSelectTag
            selectClassName="py-1.5"
            value={currentClass}
            options={[
              { label: classSubjects?.find(item => item.classLevel.id === currentClass)?.classLevel.name ?? "Selected Class", value: currentClass }
            ]}
            onOptionItemClick={() => {}}
          />
          <CustomSelectTag selectClassName="py-1.5" value={currentSubject} options={subjectOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "subject")} />
        </div>

        <h3 className="my-4 font-bold">Academic Calendar</h3>
        <div className="flex justify-between items-end mb-6">
          <div className="flex gap-3 flex-wrap">
            <CustomSelectTag selectClassName="py-2.5" value={currentAcademicYear} options={academicYearOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "academicYear")} />
            <CustomSelectTag selectClassName="py-2.5" value={currentTerm} options={termOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "term")} />
            <SearchBar onSearch={handleSearch} placeholder='Search by name' className="w-[366px] py-[-3px] max-md:w-full mx-0.5" />
          </div>

          <CustomButton text="Save Changes" onClick={() => handleSubmitGrades()} />
        </div>

        <section className="bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[150px]">
                    <div>First Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>Last Name</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>ID</div>
                  </th>
                  <th className="px-2 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[200px]">
                    <div>Class Score(30%)</div>
                  </th>
                  <th className="px-2 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                    <div>Exams Score(70%)</div>
                  </th>
                  <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 min-w-30 max-w-[100px]">
                    <div>Total Score(100%)</div>
                  </th>
                </tr>
              </thead>
    
              <tbody>
                {studentScores?.length > 0 ? (
                  studentScores.map((student, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                        {student.firstName}
                      </td>
                      <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        {student.lastName}
                      </td>
                      <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        {student.studentId}
                      </td>
                      <td className="text-sm px-3 py-1 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        <TableInputField
                          value={student?.classScore?.toString()}
                          placeholder="Enter class score"
                          onChange={(e) =>
                            handleScoreChange(student.id, 'classScore', e.target.value)
                          }
                        />
                      </td>
                      <td className="text-sm py-1 px-3 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        <TableInputField
                          value={student?.examScore?.toString()}
                          placeholder="Enter exam score"
                          onChange={(e) =>
                            handleScoreChange(student.id, 'examScore', e.target.value)
                          }
                        />

                      </td>
                      <td className="text-sm px-6 py-7 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        {student.totalScore}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                        <p className="text-lg font-medium">No students found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Once students are made, they will appear in this table.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Pagination
          currentPage={currentPage}
          totalPages={1}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export default ClassGrading;