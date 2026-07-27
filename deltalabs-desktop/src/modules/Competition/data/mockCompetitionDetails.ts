/**
 * Mock competition detail data for development.
 */

import type { CompetitionDetail } from "@/modules/Competition/types/detail";

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_COMPETITION_DETAILS: Record<string, CompetitionDetail> = {
  "comp-1": {
    id: "comp-1",
    title: "UX Design Sprint",
    bannerImageUrl: "/images/card-bg.jpg",
    heroTitle: "UX Design Sprint 2025",
    heroSubtitle: "Design intuitive user experiences for real-world problems in this high-intensity design sprint competition.",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    overview:
      "The UX Design Sprint is a five-day process for answering critical business questions through design, prototyping, and testing ideas with customers. This competition challenges participants to apply the sprint methodology to solve a real-world problem provided by our industry partners. Teams will move through Understand, Diverge, Converge, Prototype, and Test phases, presenting their final solution to a panel of expert judges. The winning design will be considered for implementation by our partner organization.",
    prizes: [
      { place: "1st Place", amount: "50,000 ETB", description: "Winner receives cash prize plus mentorship opportunity with our design partners" },
      { place: "2nd Place", amount: "30,000 ETB", description: "Runner-up receives cash prize and portfolio review session" },
      { place: "3rd Place", amount: "15,000 ETB", description: "Third place receives cash prize and certificate of achievement" },
    ],
    timeline: [
      { title: "Registration Opens", dateRange: "May 20, 2025 - May 25, 2025", description: "Register your team of 3-5 members through the competition portal. All skill levels welcome." },
      { title: "Challenge Brief Drops", dateRange: "May 26, 2025", description: "The design challenge brief will be released during the opening ceremony. Teams receive the problem statement." },
      { title: "Build Phase", dateRange: "May 26, 2025 - May 30, 2025", description: "Teams work through the design sprint process: research, ideation, prototyping, and user testing." },
      { title: "Submission Deadline", dateRange: "May 30, 2025", description: "All final deliverables must be submitted through the portal by 11:59 PM EAT." },
      { title: "Judging & Review", dateRange: "May 31, 2025 - June 2, 2025", description: "Expert panel reviews submissions based on creativity, usability, feasibility, and presentation." },
      { title: "Winners Announced", dateRange: "June 3, 2025", description: "Winners are announced at the closing ceremony. Top entries will be showcased." },
    ],
  },
  "comp-2": {
    id: "comp-2",
    title: "DataViz Storytelling Challenge",
    bannerImageUrl: "/images/card2.jpg",
    heroTitle: "DataViz Storytelling Challenge 2025",
    heroSubtitle: "Turn complex datasets into compelling visual narratives that inform and inspire.",
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    overview:
      "Data visualization is both an art and a science. This competition challenges participants to take a provided dataset and transform it into a clear, engaging, and insightful visual story. Judges will evaluate submissions on data accuracy, visual design, narrative flow, and accessibility. Participants may use any visualization tool or library of their choice. The winning entry will be featured in our annual data showcase and published on our platform.",
    prizes: [
      { place: "1st Place", amount: "40,000 ETB", description: "Cash prize plus publication opportunity and data visualization workshop pass" },
      { place: "2nd Place", amount: "25,000 ETB", description: "Cash prize plus access to premium data tools for one year" },
      { place: "3rd Place", amount: "10,000 ETB", description: "Cash prize and certificate of excellence" },
    ],
    timeline: [
      { title: "Registration Opens", dateRange: "May 25, 2025 - June 1, 2025", description: "Register individually or in pairs. Dataset will be provided upon registration." },
      { title: "Challenge Brief Drops", dateRange: "June 2, 2025", description: "The dataset and challenge prompt are released during the kickoff webinar." },
      { title: "Build Phase", dateRange: "June 2, 2025 - June 14, 2025", description: "Participants analyze data and create their visualizations. Office hours available." },
      { title: "Submission Deadline", dateRange: "June 14, 2025", description: "Submit your final visualization along with a brief write-up of your approach." },
      { title: "Judging & Review", dateRange: "June 15, 2025 - June 18, 2025", description: "Expert panel evaluates submissions on clarity, creativity, and technical execution." },
      { title: "Winners Announced", dateRange: "June 20, 2025", description: "Winners announced at the virtual awards ceremony." },
    ],
  },
};
