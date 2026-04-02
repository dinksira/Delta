import { Typography } from "@/components/theme";

type FeedCaptionProps = Readonly<{
  text: string;
}>;

export function FeedCaption({ text }: FeedCaptionProps) {
  return (
    <Typography as="p" variant="body" className="max-w-xl text-white">
      {text}
    </Typography>
  );
}
