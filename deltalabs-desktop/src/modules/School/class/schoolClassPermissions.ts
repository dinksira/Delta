const ORG_MANAGE_ROLE_KEYS = new Set(["org_owner", "org_admin", "school_admin"]);
const SCHOOL_MANAGE_ROLE_KEYS = new Set(["school_owner", "school_admin"]);

/** Whether the user can create/edit/delete items in a school workspace. */
export function userCanManageSchoolWorkspace(
  orgPermissions: readonly string[] | undefined,
  orgRoleKeys?: readonly string[] | undefined,
  schoolRoleKeys?: readonly string[] | undefined,
): boolean {
  if (orgPermissions?.includes("*") || orgPermissions?.includes("school:manage")) {
    return true;
  }
  if (orgRoleKeys?.some((key) => ORG_MANAGE_ROLE_KEYS.has(key))) {
    return true;
  }
  if (schoolRoleKeys?.some((key) => SCHOOL_MANAGE_ROLE_KEYS.has(key))) {
    return true;
  }
  return false;
}
