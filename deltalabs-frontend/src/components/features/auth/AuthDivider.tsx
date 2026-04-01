import { Typography } from "@/components/theme";

type AuthDividerProps = Readonly<{
  text?: string;
}>;

export function AuthDivider({ text = "Or Sign in with" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border-subtle" />
      <Typography variant="small" className="text-text-secondary">
        {text}
      </Typography>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}
