"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation';
import { CustomSelectTag } from '@/components/common/CustomSelectTag';
import CustomButton from '@/components/Button';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';
import TableInputField from '@/components/common/TableInputField';

type StudentGrading = {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  classScore: number | undefined;
  examScore: number | undefined;
  totalScore: number;
};

const ClassGrading = () => {

  const { classId } = useParams();

  const studentGradingList: StudentGrading[] = [
    {
      id: 1,
      firstName: "Ama",
      lastName: "Boateng",
      studentId: "STD001",
      classScore: undefined,
      examScore: 60,
      totalScore: 85,
    },
    {
      id: 2,
      firstName: "Kwame",
      lastName: "Mensah",
      studentId: "STD002",
      classScore: undefined,
      examScore: 65,
      totalScore: 93,
    },
    {
      id: 3,
      firstName: "Akosua",
      lastName: "Owusu",
      studentId: "STD003",
      classScore: 22,
      examScore: undefined,
      totalScore: 80,
    },
    {
      id: 4,
      firstName: "Kojo",
      lastName: "Tetteh",
      studentId: "STD004",
      classScore: 30,
      examScore: 62,
      totalScore: 92,
    },
    {
      id: 5,
      firstName: "Efua",
      lastName: "Nkrumah",
      studentId: "STD005",
      classScore: undefined,
      examScore: 64,
      totalScore: 91,
    },
    {
      id: 6,
      firstName: "Yaw",
      lastName: "Johnson",
      studentId: "STD006",
      classScore: 24,
      examScore: undefined,
      totalScore: 83,
    }
  ];
  const [studentScores, setStudentScores] = useState<StudentGrading[]>([]);


  useEffect(() => {
    const initialData: StudentGrading[] = studentGradingList;
    setStudentScores(initialData);
  }, []);


  const [currentTerm, setCurrentTerm] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [currentClass, setCurrentClass] = useState("");
  const [currentSubject, setCurrentSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    type: "academicYear" | "term" | "class" | "subject"
  ) => {
    const value = event.target.value;
    if (type === "term") setCurrentTerm(value);
    else if (type === "academicYear") setCurrentAcademicYear(value);
    else if (type === "class") setCurrentClass(value);
    else if (type === "subject") setCurrentSubject(value);
  };

  const termOptions = [
    { label: "Term", value: "" },
    { label: "1st Term", value: "1" },
    { label: "2nd Term", value: "2" },
  ];

  const academicYearOptions = [
    { label: "Academic Year", value: "" },
    { label: "2022 Academic Year", value: "1" },
    { label: "2020 Academic Year", value: "2" },
  ];

  const classOptions = [
    { label: "Class", value: "" },
    { label: "Class 1", value: "1" },
    { label: "Class 2", value: "2" },
  ];

  const subjectOptions = [
    { label: "Subject", value: "" },
    { label: "Maths", value: "1" },
    { label: "French", value: "2" },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    console.log(currentPage, searchQuery, classId)
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleScoreChange = (
    id: number,
    type: 'classScore' | 'examScore',
    value: string
  ) => {
    const score = parseFloat(value) || 0;

    setStudentScores((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              [type]: score,
              totalScore:
                type === 'classScore'
                  ? score + (student.examScore ?? 0)
                  : (student.classScore ?? 0) + score,
            }
          : student
      )
    );
  };

  const onSaveChanges = () => {
    console.log(studentScores, "here")
  }

  return (
    <div className="pb-8">
      <div>
        <div className="flex gap-3 flex-wrap">
          <CustomSelectTag selectClassName="py-1.5" value={currentClass} options={classOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "class")} />
          <CustomSelectTag selectClassName="py-1.5" value={currentSubject} options={subjectOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "subject")} />
        </div>

        <h3 className="my-4 font-bold">Academic Calendar</h3>
        <div className="flex justify-between items-end mb-6">
          <div className="flex gap-3 flex-wrap">
            <CustomSelectTag selectClassName="py-2.5" value={currentAcademicYear} options={academicYearOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "academicYear")} />
            <CustomSelectTag selectClassName="py-2.5" value={currentTerm} options={termOptions} onOptionItemClick={(e) => handleSelectChange(e as React.ChangeEvent<HTMLSelectElement>, "term")} />
            <SearchBar onSearch={handleSearch} placeholder='Search by name' className="w-[366px] py-[-3px] max-md:w-full" />
          </div>

          <CustomButton text="Save Changes" onClick={onSaveChanges} />
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
                      <td className="text-sm py-1 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
                        <TableInputField
                          value={student?.classScore?.toString()}
                          placeholder="Enter class score"
                          onChange={(e) =>
                            handleScoreChange(student.id, 'classScore', e.target.value)
                          }
                        />
                      </td>
                      <td className="text-sm py-1 leading-none border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] text-zinc-800 max-md:px-5">
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