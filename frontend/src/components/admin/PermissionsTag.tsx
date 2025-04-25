import React from "react";
import Badge from "./Badge";

interface PermissionTagsProps {
  permissions: string[];
}

type BadgeVariant = 'purple' | 'red' | 'indigo' | 'blue';


export const PermissionTags: React.FC<PermissionTagsProps> = ({
  permissions,
}) => {
  // If there are more than 2 permissions, show only 2 and a "+X" tag
  const displayPermissions = permissions.slice(0, 2);
  const remainingCount = permissions.length - 2;
  const colors: BadgeVariant[] = ['purple', 'red', 'indigo', 'blue'];

  return (
    <div className="flex gap-1.5 items-center">
      {displayPermissions.map((permission, index) => (
        <Badge key={index} text={permission} variant={colors[index]} />
      ))}
      {remainingCount > 0 && (
        <div className="px-2 py-1.5 text-sm bg-gray-200 text-gray-500 rounded-full">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
