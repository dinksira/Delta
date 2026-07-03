import type { ClassRoadmapContentType } from "@/modules/School/roadmap/types";
import type { LucideIcon } from "lucide-react";
import { BookOpen, ClipboardList, FileText, PlayCircle, ScrollText } from "lucide-react";

export const CONTENT_TYPE_META: Record<
  ClassRoadmapContentType,
  Readonly<{ label: string; icon: LucideIcon }>
> = {
  video: { label: "Video", icon: PlayCircle },
  exam: { label: "Exam", icon: ScrollText },
  assignment: { label: "Assignment", icon: ClipboardList },
  session: { label: "Session", icon: FileText },
  course: { label: "Course", icon: BookOpen },
};
