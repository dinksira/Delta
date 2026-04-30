/** ################################ IMPORT ############################# */
/** Imports used by this route file. */
import { SchoolWorkspaceDetailView } from "@/modules/School/views/SchoolWorkspaceDetailView";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this route. */
type SchoolWorkspacePageProps = Readonly<{
  params: Promise<{
    schoolId: string;
  }>;
  searchParams: Promise<{
    name?: string;
    view?: string;
  }>;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Thin school-detail route. UI logic lives in `modules/School/views`. */
export default async function SchoolWorkspacePage({ params, searchParams }: SchoolWorkspacePageProps) {
  const { schoolId } = await params;
  const { name, view } = await searchParams;
  return (
    <SchoolWorkspaceDetailView
      schoolId={schoolId}
      schoolName={name}
      initialView={view}
    />
  );
}
/** ################################ /COMPONENT ############################# */
