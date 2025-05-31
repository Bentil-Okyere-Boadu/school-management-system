"use client";

import Image from "next/image";
import React from "react";

interface SchoolCardProps {
  backgroundColor: string;
  schoolName?: string;
  logoUrl: string;
  textColor?: string;
  showSchoolName?: boolean,
  schoolId?: string,
  onNavigateToSchoolDetail?: (schoolId: string) => void;
}

const SchoolCard: React.FC<SchoolCardProps> = ({
  backgroundColor,
  schoolName,
  logoUrl ="",
  textColor = "text-zinc-700",
  showSchoolName = true,
  schoolId = "",
  onNavigateToSchoolDetail,
}) => {
  return (
    <article
      onClick={() => onNavigateToSchoolDetail && onNavigateToSchoolDetail(schoolId)}
      className={`overflow-hidden grow shrink self-stretch my-auto ${backgroundColor} rounded-xl max-w-[164px] ${textColor} ${onNavigateToSchoolDetail ? 'cursor-pointer hover:shadow-sm': ''} `}
    >
      <div className="flex relative flex-col px-3.5 py-2.5 aspect-[1.065] w-[164px] max-md:px-5">
        <Image
          src={logoUrl || 'https://cdn.builder.io/api/v1/image/assets/TEMP/f33b143daa0a988b8358b2dd952c60f8aadfc974?placeholderIfAbsent=true&apiKey=61b68a6030a244f09df9bfa72093b1ab'}
          width={300}
          height={300}
          alt={`school logo`}
          className="object-cover w-full rounded-full aspect-[1.03] bg-gray-100"
        />
        {showSchoolName && <h3 className="relative mt-1">{schoolName}</h3>}
      </div>
    </article>
  );
};

export default SchoolCard;
