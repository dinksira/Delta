import { Typography } from "@/components/theme";

type CreatorIdentityProps = Readonly<{
  initials: string;
  name: string;
  handle: string;
}>;

export function CreatorIdentity({ initials, name, handle }: CreatorIdentityProps) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5 sm:mb-3 sm:gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/20 text-xs font-semibold sm:h-10 sm:w-10">
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
        className="ml-auto inline-flex h-7 items-center justify-center rounded-full bg-white px-3.5 text-[11px] font-semibold text-slate-700 sm:h-8 sm:px-4 sm:text-xs"
      >
        Follow
      </button>
    </div>
  );
}
