import Link from "next/link";

import { ButtonLink, Card, CardContent, CardHeader, CardTitle, Typography } from "@/components/theme";

/** Placeholder login screen; auth wiring comes in a later phase. */
export function LoginPageView() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <Typography as="h1" variant="h2">
              Log in
            </Typography>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Typography variant="small" className="text-text-secondary">
            Authentication will be connected in a future milestone.
          </Typography>
          <ButtonLink href="/signup" variant="secondary" className="w-full justify-center">
            Create an account
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
