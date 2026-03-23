import { designTokens } from "@/theme/designTokens";

export function LandingPageView() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-semibold" style={{ color: designTokens.colors.text.primary }}>
        Delta Labs
      </h1>
    </main>
  );
}
