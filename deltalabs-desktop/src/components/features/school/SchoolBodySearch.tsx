/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { SearchInput } from "@/components/theme/SearchInput";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** School layout width; field is theme `SearchInput`. */
export function SchoolBodySearch({
  id = "school-search",
  placeholder = "Search for school...",
  className,
}: Readonly<{ id?: string; placeholder?: string; className?: string }>) {
  return (
    <div
      className={cx(
        "ms-auto min-w-0 w-full max-w-[19rem] shrink-0 sm:max-w-[22rem]",
        className,
      )}
    >
      <SearchInput
        id={id}
        placeholder={placeholder}
        className="h-9 gap-1 px-2 py-0.5 [&_svg]:size-4"
        inputClassName="py-1 text-xs"
      />
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
