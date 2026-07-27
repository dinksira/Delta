import { CourseHomeView } from '../../views/CourseHomeView';
import { EnrolledCoursesPageView } from '../../views/EnrolledCoursesPageView';
import { CommunityView } from '../../views/CommunityView';
import { AskQuestionView } from '../../views/AskQuestionView';
import { MyQuestionsPage } from '../../views/MyQuestionsPage';

// A placeholder for the actual route definitions matching Delta Labs route standards.
// In a real application, these would map to React Router or Next.js app directory structure.
export const courseRoutes = [
  {
    path: '/course',
    component: CourseHomeView,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/course/enrolled',
    component: EnrolledCoursesPageView,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/course/chat',
    component: CommunityView,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/course/qa/ask',
    component: AskQuestionView,
    exact: true,
    guards: ['auth'],
  },
  {
    path: '/course/qa/my-questions',
    component: MyQuestionsPage,
    exact: true,
    guards: ['auth'],
  },
];
