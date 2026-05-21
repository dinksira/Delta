export function userCanManageSchoolWorkspace(permissions: readonly string[] | undefined): boolean {
  if (!permissions?.length) return false;
  return permissions.includes("*") || permissions.includes("school:manage");
}
