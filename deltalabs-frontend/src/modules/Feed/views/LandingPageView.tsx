import {
  ButtonLink,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Typography,
} from "@/components/theme";

const platformFeatures = [
  {
    title: "Modular learning",
    description: "Organize schools, courses, and specializations in one cohesive platform.",
  },
  {
    title: "Progress and planning",
    description: "Track enrollments, certifications, and planner workflows as they roll out.",
  },
  {
    title: "Built for scale",
    description: "Module-first architecture and a shared design system keep UX consistent.",
  },
] as const;

/** Public marketing landing: hero and platform feature highlights. */
export function LandingPageView() {
  return (
    <div className="flex flex-col">
      <section className="border-b border-border-default bg-surface-default px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <Typography as="h1" variant="h1" className="max-w-3xl">
            Learning infrastructure for schools and builders
          </Typography>
          <Typography variant="body" className="max-w-2xl text-text-secondary">
            Delta Labs connects courses, feed, labs, and support in a single module-first experience.
          </Typography>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup" variant="primary" size="lg">
              Get started
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="lg">
              Log in
            </ButtonLink>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-20 border-b border-border-default px-4 py-16 sm:px-6 sm:py-20"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-6xl">
          <Typography as="h2" variant="h2" id="features-heading" className="mb-10 text-center">
            Platform features
          </Typography>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
