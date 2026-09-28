/**
 * RequirementCard.types
 * Prop types for the `RequirementCard` molecule.
 *
 * @example
 * ```tsx
 * <RequirementCard
 *   requirement={{
 *     id: "device",
 *     title: "Modern laptop or tablet",
 *     imageSrc: "/gaming_monitor_1.png",
 *     imageAlt: "Laptop on a desk",
 *     specs: [{ icon: "device", label: "4/8 GB RAM" }, { icon: "storage", label: ">251 GB Storage" }],
 *     status: "Purchased",
 *   }}
 *   onFindResource={(id) => {}}
 * />
 * ```
 */

/**
 * Semantic keys for the spec-row icons, resolved to glyphs via `variants.ts`.
 * Keys keep the data serialisable; components are not storable in plain data.
 */
export type RequirementSpecIcon =
  | "device"
  | "time"
  | "level"
  | "safety"
  | "lab"
  | "material"
  | "storage"
  | "performance";

/** One key/value attribute line inside a requirement card. */
export interface RequirementSpec {
  /** Which glyph marks this line. */
  icon: RequirementSpecIcon;
  /** The attribute text, e.g. `"ANSI Z87.1"`. */
  label: string;
}

/** Ownership status shown as a badge overlaid on the card image. */
export type RequirementStatus = "Purchased" | "Required" | "Recommended";

/** A course requirement: an item the learner must obtain or already owns. */
export interface CourseRequirement {
  /** Stable unique identifier. */
  id: string;
  /** Card title, e.g. `"Safety goggles"`. */
  title: string;
  /** Image path. Prefer a locally bundled asset under `public/`. */
  imageSrc: string;
  /** Alt text describing the image. */
  imageAlt: string;
  /** Attribute lines rendered with icons. */
  specs: readonly RequirementSpec[];
  /** Badge overlaid top-right. Omit to hide the badge. */
  status?: RequirementStatus;
}

/** Public props for `RequirementCard`. */
export interface RequirementCardProps {
  /** The requirement to render. */
  requirement: CourseRequirement;
  /** Invoked by the CTA. Omit to hide the action. */
  onFindResource?: (requirementId: string) => void;
  /** CTA label. Defaults to `"Look for Resource"`. */
  ctaLabel?: string;
  /** Extra classes merged onto the card root. */
  className?: string;
}
