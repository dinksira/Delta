/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Placeholder for enrolled courses; will be guarded by auth later. */
export function EnrolledCoursesPageView() {
  return (
    <div className="flex flex-col gap-6">
      <Typography as="h1" variant="h2">
        Enrolled courses
      </Typography>
      <Card>
        <CardHeader>
          <CardTitle>No enrollments yet</CardTitle>
          <CardDescription>
            This area will list courses after enrollment and authentication are wired.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Typography variant="small" className="text-text-secondary">
            Route protection will be enforced via middleware and UI guards per Delta Labs standards.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
