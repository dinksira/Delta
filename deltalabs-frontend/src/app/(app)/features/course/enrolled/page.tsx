/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { EnrolledCoursesPageView } from "@/modules/Course/views/EnrolledCoursesPageView";
import { CourseProvider } from "@/modules/Course";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function EnrolledCoursesPage() {
  return (
    <CourseProvider>
      <EnrolledCoursesPageView />
    </CourseProvider>
  );
}
/** ################################ /COMPONENT ############################# */
