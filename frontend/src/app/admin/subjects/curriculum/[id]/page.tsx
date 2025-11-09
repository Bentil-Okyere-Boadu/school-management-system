"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetCurriculumById } from "@/hooks/school-admin";
import { HashLoader } from "react-spinners";
import { SubjectCatalog } from "@/@types";
import { SubjectCard } from "@/components/admin/subjects/SubjectCard";
import { IconArrowLeft } from "@tabler/icons-react";

const CurriculumDetailPage: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();

  const { curriculum, isLoading } = useGetCurriculumById(id as string);

  const subjects = curriculum?.subjectCatalogs || [];

  return (
    <div className="px-0.5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-neutral-800">
          Curriculum&apos;s Subjects
        </h1>
        <button
          className="text-sm text-purple-700 hover:text-purple-800 cursor-pointer underline"
          onClick={() => router.back()}
        >
          <IconArrowLeft size={16} className="inline-block" /> 
          Back
        </button>
      </div>

      {/* <div className="bg-white rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700">
          {curriculum?.description || "No description"}
        </p>
        {curriculum?.academicTerm?.name && (
          <p className="text-xs text-gray-500 mt-1">
            Term: {curriculum.academicTerm.name}
          </p>
        )}
      </div> */}

      <section className="py-2">
        {(() => {
          if (isLoading) {
            return (
              <div className="relative py-12">
                <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
                  <HashLoader color="#AB58E7" size={34} />
                </div>
              </div>
            );
          }

          if (!subjects?.length) {
            return (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 bg-white rounded-lg">
                <p className="text-lg font-medium">No subjects found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Once subjects are added to this curriculum, they will appear here.
                </p>
              </div>
            );
          }

          return (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subj: SubjectCatalog) => (
                <SubjectCard
                  key={subj.id}
                  subjectData={{
                    id: subj.id,
                    name: subj.name,
                    description: subj.description,
                    topics: subj.topics,
                  }}
                  topicsCount={subj.topics?.length}
                  showViewTopics={true}
                  onViewTopicsClick={() => router.push(`/admin/subjects/curriculum/${id as string}/subject/${subj.id}/topics`)}
                />
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
};

export default CurriculumDetailPage;


