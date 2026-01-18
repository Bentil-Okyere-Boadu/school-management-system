"use client";

import Image from "next/image";
import React from "react";

interface ProfileCardProps {
  backgroundColor: string;
  logoUrl: string;
  textColor?: string;
  profileId?: string,
  onNavigateToDetail?: (profileId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  backgroundColor,
  logoUrl,
  textColor = "text-zinc-700",
  profileId = "",
  onNavigateToDetail,
}) => {
  return (
    <article
      onClick={() => onNavigateToDetail && onNavigateToDetail(profileId)}
      className={`overflow-hidden grow shrink self-stretch my-auto ${backgroundColor} rounded-xl max-w-[164px] ${textColor} ${onNavigateToDetail ? 'cursor-pointer hover:shadow-sm': ''} `}
    >
      <div className="flex relative flex-col px-3.5 py-3.5 aspect-[1.065] w-[164px] max-md:px-5">
        <Image
          src={logoUrl}
          width={100}
          height={100}
          alt={`profile logo`}
          className="object-cover w-full aspect-[1.03] rounded-lg"
        />
      </div>
    </article>
  );
};

export default ProfileCard;
