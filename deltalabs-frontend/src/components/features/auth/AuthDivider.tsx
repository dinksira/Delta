import { Typography } from "@/components/theme";

type AuthDividerProps = Readonly<{
  text?: string;
}>;

export function AuthDivider({ text = "Or Sign in with" }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <hr className="min-w-0 flex-1 border-0 border-t border-dashed border-border-default" />
      <Typography variant="small" className="shrink-0 text-xs font-normal text-text-secondary">
        {text}
      </Typography>
      <hr className="min-w-0 flex-1 border-0 border-t border-dashed border-border-default" />
    </div>
  );
}
