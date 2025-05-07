"use client";

import Image from "next/image";
import React from "react";

interface SchoolCardProps {
  backgroundColor: string;
  schoolName?: string;
  logoUrl: string;
  textColor?: string;
  showSchoolName?: boolean,
  onNavigateToSchoolDetail?: (schoolId: number) => void;
}

const SchoolCard: React.FC<SchoolCardProps> = ({
  backgroundColor,
  schoolName,
  logoUrl,
  textColor = "text-zinc-700",
  showSchoolName = true,
  onNavigateToSchoolDetail = () => {},
}) => {
  return (
    <article onClick={onNavigateToSchoolDetail}
      className={`overflow-hidden grow shrink self-stretch my-auto ${backgroundColor} rounded-xl max-w-[164px] ${textColor} cursor-pointer hover:shadow-sm`}
    >
      <div className="flex relative flex-col px-3.5 py-2.5 aspect-[1.065] w-[164px] max-md:px-5">
        <Image
          src={logoUrl}
          width={100}
          height={100}
          alt={`${schoolName} logo`}
          className="object-contain w-full rounded-full aspect-[1.03]"
        />
        {showSchoolName && <h3 className="relative">{schoolName}</h3>}
      </div>
    </article>
  );
};

export default SchoolCard;
