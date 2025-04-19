import React from "react";

interface PermissionTagsProps {
  permissions: string[];
}

export const PermissionTags: React.FC<PermissionTagsProps> = ({
  permissions,
}) => {
  // If there are more than 2 permissions, show only 2 and a "+X" tag
  const displayPermissions = permissions.slice(0, 2);
  const remainingCount = permissions.length - 2;

  return (
    <div className="flex gap-1.5 items-center">
      {displayPermissions.map((permission, index) => (
        <div key={index} className="px-2 py-0.5 text-base rounded-2xl">
          {permission}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="px-2 py-0.5 text-base rounded-2xl">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
