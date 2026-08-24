export interface CourseTopSubNavProps {
  activeTab: CourseSubNavTabId;
  onTabChange: (tab: CourseSubNavTabId) => void;
}

export type CourseSubNavTabId =
  | 'intro'
  | 'about'
  | 'related'
  | 'reviews'
  | 'prerequisites'
  | 'analysis'
  | 'tutor';
