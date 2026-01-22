import React, { Suspense, lazy } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import ErrorPage from './pages/ErrorPage';
import Root from './Root';

// Lazy load all pages
const Landing = lazy(() => import('./pages/Landing'));
const LogIn = lazy(() => import('./pages/LogIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Faq = lazy(() => import('./pages/Faq'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const BoardViewAll = lazy(() => import('./pages/BoardViewAll'));
const BoardViewAllAdmin = lazy(() => import('./pages/BoardViewAllAdmin'));
const BoardDetails = lazy(() => import('./pages/BoardDetails'));
const BoardCreation = lazy(() => import('./pages/BoardCreation'));
const Calendar = lazy(() => import('./pages/Calendar'));
const TreasureHuntDashboard = lazy(() => import('./pages/TreasureHuntDashboard'));
const TreasureEventView = lazy(() => import('./pages/TreasureEventPage'));
const TreasureTeamPage = lazy(() => import('./pages/TreasureTeamPage'));
const AboutPage = lazy(() => import('./pages/About'));
const TermsPage = lazy(() => import('./pages/Terms'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const SupportPage = lazy(() => import('./pages/SupportTheSite'));
const ChangelogPage = lazy(() => import('./pages/ChangeLog'));
const NoMatch = lazy(() => import('./pages/NoMatch'));
const StatsPage = lazy(() => import('./pages/Stats'));

// Loading fallback component
const PageLoader = () => (
  <Center h="60vh">
    <Spinner size="xl" color="purple.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
  </Center>
);

// Wrap lazy components with Suspense
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const routes = [
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: withSuspense(Landing),
        errorElement: <ErrorPage />,
      },
      {
        path: '/login',
        element: withSuspense(LogIn),
        errorElement: <ErrorPage />,
      },
      {
        path: '/signup',
        element: withSuspense(SignUp),
        errorElement: <ErrorPage />,
      },
      {
        path: '/faq',
        element: withSuspense(Faq),
        errorElement: <ErrorPage />,
      },
      {
        path: '/user/:userId',
        element: withSuspense(UserDetails),
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards',
        element: withSuspense(BoardViewAll),
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/admin',
        element: withSuspense(BoardViewAllAdmin),
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/:boardId',
        element: withSuspense(BoardDetails),
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/create',
        element: withSuspense(BoardCreation),
        errorElement: <ErrorPage />,
      },
      {
        path: '/calendar',
        element: withSuspense(Calendar),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush',
        element: withSuspense(TreasureHuntDashboard),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId',
        element: withSuspense(TreasureEventView),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId/team/:teamId',
        element: withSuspense(TreasureTeamPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/about',
        element: withSuspense(AboutPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/terms',
        element: withSuspense(TermsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/privacy',
        element: withSuspense(PrivacyPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/support',
        element: withSuspense(SupportPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/changelog',
        element: withSuspense(ChangelogPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/stats',
        element: withSuspense(StatsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: withSuspense(NoMatch),
      },
      {
        path: '/error',
        element: withSuspense(NoMatch),
      },
    ],
  },
];

export default routes;
