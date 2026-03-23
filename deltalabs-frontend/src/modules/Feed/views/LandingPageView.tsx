import { Button, Card, CardContent, CardHeader, CardTitle, Input, Typography } from "@/components/theme";
import { designTokens } from "@/theme/designTokens";

export function LandingPageView() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>
            <Typography as="h1" variant="h2">
              Delta Labs
            </Typography>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Typography variant="small" style={{ color: designTokens.colors.text.secondary }}>
            Foundation primitives are ready for module composition.
          </Typography>
          <Input placeholder="Search modules..." aria-label="Search modules" />
          <Button>Get Started</Button>
        </CardContent>
      </Card>
    </main>
  );
}
