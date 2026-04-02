import { Typography } from "@/components/theme";

type CreatorIdentityProps = Readonly<{
  initials: string;
  name: string;
  handle: string;
}>;

export function CreatorIdentity({ initials, name, handle }: CreatorIdentityProps) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/20 text-xs font-semibold">
        {initials}
      </span>
      <div>
        <Typography as="p" variant="label" className="text-white">
          {name}
        </Typography>
        <Typography as="p" variant="small" className="text-white/80">
          {handle}
        </Typography>
      </div>
      <button
        type="button"
        className="ml-auto inline-flex h-8 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-slate-700"
      >
        Follow
      </button>
    </div>
  );
}
