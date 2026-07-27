/**
 * Competition detail types
 */

export interface CompetitionPrize {
  place: string;
  amount: string;
  description: string;
}

export interface CompetitionTimelineStep {
  title: string;
  dateRange: string;
  description: string;
}

export interface CompetitionDetail {
  id: string;
  title: string;
  bannerImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  deadline: string;
  overview: string;
  prizes: CompetitionPrize[];
  timeline: CompetitionTimelineStep[];
}
