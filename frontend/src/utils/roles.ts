let rolesEnum: Record<string, string> = {};

export function initializeRoles(roles: Array<{ id: string; name: string }>) {
  rolesEnum = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {} as Record<string, string>);
}

export function getRolesEnum() {
  if (Object.keys(rolesEnum).length === 0) {
    throw new Error('Roles enum not initialized');
    //console.log('Roles enum not initialized')
  }
  return rolesEnum;
}

export function getRoleId(roles: Array<{ id: string; name: string }>, roleName: string): string {
  const foundRole = roles.find((role) => role.name === roleName);
  return foundRole?.id || "";
}

export type RoleName = keyof typeof rolesEnum;