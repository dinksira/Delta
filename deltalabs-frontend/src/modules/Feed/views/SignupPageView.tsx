import Link from "next/link";

import { ButtonLink, Card, CardContent, CardHeader, CardTitle, Typography } from "@/components/theme";

/** Placeholder signup screen; auth wiring comes in a later phase. */
export function SignupPageView() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <Typography as="h1" variant="h2">
              Sign up
            </Typography>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Typography variant="small" className="text-text-secondary">
            Registration flows will be implemented when backend auth is ready.
          </Typography>
          <ButtonLink href="/login" variant="secondary" className="w-full justify-center">
            Already have an account?
          </ButtonLink>
          <Link
            href="/"
            className="text-center text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
