/**
 * questionSources data
 * Question-source options for the Create Topic Battle wizard (question pool
 * step). Follows the Step 7 redesign spec: Auto-Generated / Custom Questions
 * with a feature checklist and a recommendation tag. Also exports the sample
 * question categories used by the Auto-Generation preview panel.
 */

import { Star } from "lucide-react";

import type { QuestionSource } from "@/components/molecules/QuestionSourceCard";

export const QUESTION_SOURCES: QuestionSource[] = [
  {
    id: "auto",
    title: "Auto-Generated",
    description: "AI curates questions from our database",
    icon: <Star className="size-5" />,
    features: [
      "Smart difficulty balancing",
      "Topic specific questions",
      "Quality assured content",
    ],
    tag: "Recommended for most battles",
  },
  {
    id: "custom",
    title: "Custom Questions",
    description: "Upload or create your own questions",
    icon: <Star className="size-5" />,
    features: [
      "Full control over content",
      "Personalized difficulty",
      "Unique battle experience",
    ],
    tag: "Perfect for personalized topics",
  },
];

/**
 * Sample question categories shown in the preview panel, keyed by the topic
 * catalog category. Mirrors the Step 7 spec example (Physics / Chemistry /
 * Biology for Science).
 */
export const SAMPLE_QUESTION_CATEGORIES: Record<string, string[]> = {
  Science: ["Physics", "Chemistry", "Biology"],
  "Biology & Medicine": ["Anatomy", "Genetics", "Immunology"],
  History: ["Ancient", "Medieval", "Modern"],
  Math: ["Algebra", "Geometry", "Calculus"],
  Geography: ["Physical", "Human", "Cartography"],
  Tech: ["AI", "Cybersecurity", "Cloud"],
  Programming: ["Python", "JavaScript", "Algorithms"],
  Literature: ["Poetry", "Fiction", "Drama"],
  "Art & Music": ["Painting", "Music Theory", "Sculpture"],
  Sports: ["Soccer", "Basketball", "Athletics"],
  "Business & Economics": ["Finance", "Marketing", "Microeconomics"],
  "Psychology & Philosophy": ["Cognition", "Ethics", "Behavior"],
  Engineering: ["Mechanical", "Electrical", "Civil"],
  Languages: ["Grammar", "Vocabulary", "Linguistics"],
  "General Knowledge": ["World Facts", "Current Events", "Culture"],
  Entertainment: ["Film", "Music", "Gaming"],
  "Law & Politics": ["Constitutional", "Criminal", "Governance"],
  "Religion & Mythology": ["Mythology", "World Religions", "Sacred Texts"],
  "Mixed Topics": ["General", "Trivia", "Mixed"],
};

export function getSampleCategories(category: string): string[] {
  return SAMPLE_QUESTION_CATEGORIES[category] ?? SAMPLE_QUESTION_CATEGORIES["General Knowledge"];
}
