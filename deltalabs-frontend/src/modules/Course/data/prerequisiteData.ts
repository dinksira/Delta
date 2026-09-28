/**
 * prerequisiteData
 * Static prerequisites and equipment requirements for the course detail page.
 *
 * Images resolve to locally bundled assets under `public/` so the section
 * renders in the offline desktop shell without any network call.
 */

import type { CourseRequirement } from "@/components/molecules/RequirementCard";

/** Knowledge the learner is expected to bring to the course. */
export const COURSE_PREREQUISITES: readonly string[] = [
  "Basics of Chemistry.",
  "General knowledge of how nature works is recommended but not a must-have.",
  "Absolutely no understanding of advanced theories is required; this course takes you from beginner to intermediate.",
];

/** Equipment and materials the course expects the learner to have. */
export const COURSE_REQUIREMENTS: readonly CourseRequirement[] = [
  {
    id: "modern-laptop",
    title: "Modern laptop or tablet",
    imageSrc: "/gaming_monitor_1.png",
    imageAlt: "Laptop on a desk beside a monitor",
    specs: [
      { icon: "device", label: "4/8 GB RAM" },
      { icon: "storage", label: ">251 GB Storage" },
      { icon: "performance", label: "core i3 or better" },
    ],
  },
  {
    id: "safety-goggles",
    title: "Safety goggles",
    imageSrc: "/safety_goggles.png",
    imageAlt: "Laboratory safety goggles",
    status: "Purchased",
    specs: [
      { icon: "safety", label: "Anti-fog coating" },
      { icon: "level", label: "ANSI Z87.1" },
      { icon: "material", label: "Polycarbonate" },
    ],
  },
  {
    id: "laboratory-glass",
    title: "Laboratory glass",
    imageSrc: "/laboratory_glass.png",
    imageAlt: "Laboratory glassware on a bench",
    specs: [
      { icon: "lab", label: "Florence flask" },
      { icon: "material", label: "Borosilicate glass" },
      { icon: "time", label: "500 ml capacity" },
    ],
  },
  {
    id: "newtons-cradle",
    title: "Newton's cradle",
    imageSrc: "/newton_cradle.png",
    imageAlt: "Newton's cradle on a desk",
    specs: [
      { icon: "level", label: "Suspension of 5" },
      { icon: "material", label: "Stainless steel balls" },
      { icon: "device", label: "5 inches in height" },
    ],
  },
];
