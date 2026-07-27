/**
 * Static terms and conditions content for competition enrollment.
 * Shared across all competitions.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TermsContent {
  intro: string[];
  judgingCriteria: string[];
  closing: string[];
}

// ============================================================================
// CONTENT
// ============================================================================

export const TERMS_CONTENT: TermsContent = {
  intro: [
    "By accepting these terms, you agree to participate in this competition in accordance with the rules and guidelines set forth by Delta Labs.",
    "All submissions must be original work created by the registered participant or team during the competition period.",
    "Participants retain ownership of their submissions but grant Delta Labs a non-exclusive license to showcase winning entries on platform materials and promotional content.",
    "Plagiarism or unauthorized use of third-party content will result in immediate disqualification.",
    "Teams must consist of 3-5 members. All team members must be registered on the platform and individually accept these terms.",
    "Delta Labs reserves the right to modify competition deadlines or rules with reasonable notice to participants.",
    "Decisions made by the judging panel are final and binding. No correspondence regarding judging outcomes will be entertained.",
  ],
  judgingCriteria: [
    "UX & usability — how intuitive and user-friendly the solution is",
    "Visual design — aesthetic quality, consistency, and brand alignment",
    "Innovation — originality and creative approach to solving the problem",
    "Presentation — clarity and effectiveness of the final submission and pitch",
  ],
  closing: [
    "Winners will be notified via the email address associated with their Delta Labs account within 7 days of the announcement date.",
    "Prizes will be disbursed within 30 business days of winner confirmation. Tax liabilities, if any, are the responsibility of the winner.",
    "Participants may withdraw from the competition at any time by notifying the competition administrator in writing.",
    "Delta Labs is not responsible for technical failures, lost submissions, or late entries due to platform issues beyond reasonable control.",
  ],
};
