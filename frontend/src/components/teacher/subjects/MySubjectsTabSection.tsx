"use client";
import React, { useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { useGetTeacherSubjects } from "@/hooks/teacher";
import { useDebouncer } from "@/hooks/generalHooks";
import { HashLoader } from "react-spinners";

export const MySubjectsTabSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { teacherSubjects, isLoading } = useGetTeacherSubjects(
    useDebouncer(searchQuery)
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="pb-8">
      <h1 className="text-md font-semibold text-neutral-800 mb-2">My Subjects</h1>

      <div className="w-full flex justify-between mb-4">
        {false  ? (        
          <SearchBar
            placeholder="Search subjects..."
            onSearch={handleSearch}
            className="w-full max-w-md"
          />
        ) : (
          <div></div>
        )}
      </div>

      <section className="bg-white mt-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Subject Name</div>
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Description</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={2}>
                        <div className="relative py-20 bg-white">
                          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm">
                            <HashLoader color="#AB58E7" size={40} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (!teacherSubjects?.length) {
                  return (
                    <tr>
                      <td colSpan={2}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No subjects assigned</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Subjects assigned to you will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return teacherSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{subject.name}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div className="flex flex-wrap gap-2">
                        {subject.description}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

