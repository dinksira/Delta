export interface CompetitionDetail {
  id: string;
  title: string;
  description: string;
  endsAt: string;
  participants: number;
  tags: string[];
  backgroundImageUrl: string;
  rules: string[];
  prizes: CompetitionPrize[];
  timeline: CompetitionTimelineStep[];
}

export interface CompetitionPrize {
  rank: string;
  reward: string;
}

export interface CompetitionTimelineStep {
  label: string;
  date: string;
  description: string;
}
