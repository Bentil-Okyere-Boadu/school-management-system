"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetSubjectTopics } from "@/hooks/school-admin";
import { HashLoader } from "react-spinners";
import { IconArrowLeft } from "@tabler/icons-react";
import { Topic } from "@/@types";

const SubjectTopicsPage: React.FC = () => {
  const { id, subjectId } = useParams();
  const router = useRouter();

  const { topics, isLoading } = useGetSubjectTopics(subjectId as string);
  console.log(id)

  return (
    <div className="px-0.5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-neutral-800">
          Topics for {topics[0]?.subjectCatalog?.name || "Subject"}
        </h1>
        <button
          className="text-sm text-purple-700 hover:text-purple-800 cursor-pointer underline"
          onClick={() => router.back()}
        >
          <IconArrowLeft size={16} className="inline-block" /> 
          Back
        </button>
      </div>

      <section className="bg-white mt-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-blue-50">
                <th className="px-6 py-3.5 text-xs font-medium text-gray-500 whitespace-nowrap border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-11 text-left max-md:px-5 max-w-[200px]">
                  <div>Name</div>
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

                if (!topics?.length) {
                  return (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                          <p className="text-lg font-medium">No topics found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Once topics are added to this subject, they will appear here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return topics.map((row: Topic) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{row.name}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-solid border-b-[color:var(--Gray-200,#EAECF0)] min-h-[72px] max-md:px-5">
                      <div>{row.description}</div>
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

export default SubjectTopicsPage;


