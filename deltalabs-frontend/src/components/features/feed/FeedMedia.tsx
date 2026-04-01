const TONE_GRADIENTS = [
  "bg-[radial-gradient(circle_at_30%_20%,#a8b7be_0%,#7f8f99_45%,#2f3c45_100%)]",
  "bg-[radial-gradient(circle_at_70%_30%,#9ca8b0_0%,#5c6b76_50%,#1e2830_100%)]",
  "bg-[radial-gradient(circle_at_40%_60%,#b8c4cc_0%,#6b7c88_45%,#253038_100%)]",
  "bg-[radial-gradient(circle_at_20%_70%,#8a9aa3_0%,#4a5862_48%,#1a2228_100%)]",
  "bg-[radial-gradient(circle_at_60%_40%,#c5ced4_0%,#75808a_42%,#2a343c_100%)]",
  "bg-[radial-gradient(circle_at_50%_15%,#aeb9c2_0%,#677682_46%,#222c34_100%)]",
] as const;

type FeedMediaProps = Readonly<{
  /** Picks a distinct placeholder gradient per clip. */
  tone?: number;
}>;

export function FeedMedia({ tone = 0 }: FeedMediaProps) {
  const className = TONE_GRADIENTS[((tone % TONE_GRADIENTS.length) + TONE_GRADIENTS.length) % TONE_GRADIENTS.length];
  return <div className={`absolute inset-0 ${className}`} />;
}
