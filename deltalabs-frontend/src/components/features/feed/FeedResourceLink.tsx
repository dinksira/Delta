import { Typography } from "@/components/theme";

type FeedResourceLinkProps = Readonly<{
  text: string;
}>;

export function FeedResourceLink({ text }: FeedResourceLinkProps) {
  return (
    <Typography as="p" variant="small" className="mt-3 text-white/90">
      {text}
    </Typography>
  );
}
