import React from "react";

interface DocumentItemProps {
  iconSrc: string;
  name: string;
  width?: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  iconSrc,
  name,
  width = "auto",
}) => {
  return (
    <article
      className="flex gap-1 self-stretch px-2 py-2 my-auto bg-gray-200 rounded"
      style={{ width }}
    >
      <img
        src={iconSrc}
        alt="Document icon"
        className="object-contain shrink-0 my-auto aspect-square w-[13px]"
      />
      <p className="basis-auto text-sm ml-1 text-gray-800">{name}</p>
    </article>
  );
};

export default DocumentItem;
