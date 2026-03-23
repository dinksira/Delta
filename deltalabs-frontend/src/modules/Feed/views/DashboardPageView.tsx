import { Typography } from "@/components/theme";
import { designTokens } from "@/theme/designTokens";

export function DashboardPageView() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Typography as="h1" variant="h2" style={{ color: designTokens.colors.text.primary }}>
        Dashboard
      </Typography>
    </main>
  );
}
