import React, { Suspense, lazy } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import ErrorPage from './pages/ErrorPage';
import Root from './Root';

// lazy load all pages
const Landing = lazy(() => import('./pages/Landing'));
const LogIn = lazy(() => import('./pages/LogIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Faq = lazy(() => import('./pages/Faq'));
const UserDetails = lazy(() => import('./pages/UserDetails'));
const BoardViewAll = lazy(() => import('./pages/bingo/BoardViewAll'));
const BoardViewAllAdmin = lazy(() => import('./pages/bingo/BoardViewAllAdmin'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const BoardDetails = lazy(() => import('./pages/bingo/BoardDetails'));
const BoardCreation = lazy(() => import('./pages/bingo/BoardCreation'));
const EGHub = lazy(() => import('./pages/EGHub'));
const GielinorRushDashboard = lazy(() => import('./pages/gielinorRush/GielinorRushDashboard'));
const GREventView = lazy(() => import('./pages/gielinorRush/GREventPage'));
const GRTeamPage = lazy(() => import('./pages/gielinorRush/GRTeamPage'));
const AboutPage = lazy(() => import('./pages/About'));
const TermsPage = lazy(() => import('./pages/Terms'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const SupportPage = lazy(() => import('./pages/SupportTheSite'));
const ChangelogPage = lazy(() => import('./pages/ChangeLog'));
const NoMatch = lazy(() => import('./pages/NoMatch'));
const StatsPage = lazy(() => import('./pages/Stats'));
const GielinorRushActiveEventsPage = lazy(() => import('./pages/gielinorRush/GielinorRushActiveEvents'));
const BingoPage = lazy(() => import('./pages/bingo/BingoPage'));
const DraftDashboard = lazy(() => import('./pages/draftRoom/DraftDashboard'));
const DraftRoomPage = lazy(() => import('./pages/draftRoom/DraftRoomPage'));
const DraftResultsPage = lazy(() => import('./pages/draftRoom/DraftResultsPage'));
const DebugComponentsPage = lazy(() => import('./debug/index'));
const ChampionForgeDashboard = lazy(() => import('./pages/championForge/ChampionForgeDashboard'));
const ChampionForgeEventPage = lazy(() => import('./pages/championForge/ChampionForgeEventPage'));
const ChampionForgeBarracksPage = lazy(() => import('./pages/championForge/ChampionForgeBarracksPage'));
const ChampionForgeBattlePage = lazy(() => import('./pages/championForge/ChampionForgeBattlePage'));
const ChampionForgeGuidePage = lazy(() => import('./pages/championForge/ChampionForgeGuidePage'));
const ChampionForgeRefsPage = lazy(() => import('./pages/championForge/ChampionForgeRefsPage'));
const ChampionForgeBattleGallery = lazy(() => import('./pages/championForge/ChampionForgeBattleGallery'));
const GielinorRushGuidePage = lazy(() => import('./pages/gielinorRush/GielinorRushGuidePage'));
const TeamBalancerPage = lazy(() => import('./pages/TeamBalancerPage'));
const GroupDashboardPage = lazy(() => import('./pages/groupDashboard/GroupDashboardPage'));
const GroupDashboardManagePage = lazy(() => import('./pages/groupDashboard/GroupDashboardManagePage'));
const GroupDashboardCreatePage = lazy(() => import('./pages/groupDashboard/GroupDashboardCreatePage'));
const GroupDashboardListPage = lazy(() => import('./pages/groupDashboard/GroupDashboardListPage'));
const GroupDashboardCompetitionsPage = lazy(() => import('./pages/groupDashboard/GroupDashboardCompetitionsPage'));
const GroupDashboardActivityPage = lazy(() => import('./pages/groupDashboard/GroupDashboardActivityPage'));
const GroupDashboardWidgetPage = lazy(() => import('./pages/groupDashboard/GroupDashboardWidgetPage'));
const WallOfShame = lazy(() => import('./pages/WallOfShame'));
const RainbowBingoBoardPage = lazy(() => import('./pages/rainbow/RainbowBingoBoardPage'));
const RainbowTeamBoardPage = lazy(() => import('./pages/rainbow/RainbowTeamBoardPage'));
const RainbowRefsPage = lazy(() => import('./pages/rainbow/RainbowRefsPage'));
const RainbowAdminPage = lazy(() => import('./pages/rainbow/RainbowAdminPage'));
const EternalGemsPage = lazy(() => import('./pages/EternalGemsPage'));
const BattleshipDashboard = lazy(() => import('./pages/battleship/BattleshipDashboard'));
const BattleshipEventPage = lazy(() => import('./pages/battleship/BattleshipEventPage'));
const BattleshipCreatePage = lazy(() => import('./pages/battleship/BattleshipCreatePage'));
const BattleshipRefsPage = lazy(() => import('./pages/battleship/BattleshipRefsPage'));
const BattleshipGuidePage = lazy(() => import('./pages/battleship/BattleshipGuidePage'));
const BattleshipAdminPage = lazy(() => import('./pages/battleship/BattleshipAdminPage'));

// loading fallback component
const PageLoader = () => (
  <Center h="60vh">
    <Spinner size="xl" color="purple.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
  </Center>
);

// wrap lazy components with Suspense
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const routes = [
  {
    path: '/group/:slug/widget',
    element: (
      <Suspense fallback={<PageLoader />}>
        <GroupDashboardWidgetPage />
      </Suspense>
    ),
    errorElement: <ErrorPage />,
  },
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
        path: '/admin/users',
        element: withSuspense(AdminUsersPage),
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
        element: withSuspense(EGHub),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush',
        element: withSuspense(GielinorRushDashboard),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/active',
        element: withSuspense(GielinorRushActiveEventsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/guide',
        element: withSuspense(GielinorRushGuidePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId',
        element: withSuspense(GREventView),
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId/team/:teamId',
        element: withSuspense(GRTeamPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/bingo',
        element: withSuspense(BingoPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/blind-draft',
        element: withSuspense(DraftDashboard),
        errorElement: <ErrorPage />,
      },
      {
        path: '/team-balancer',
        element: withSuspense(TeamBalancerPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/blind-draft/create',
        element: withSuspense(DraftRoomPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/blind-draft/:roomId',
        element: withSuspense(DraftRoomPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/blind-draft/:roomId/results',
        element: withSuspense(DraftResultsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge',
        element: withSuspense(ChampionForgeDashboard),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/:eventId',
        element: withSuspense(ChampionForgeEventPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/:eventId/barracks/:teamId',
        element: withSuspense(ChampionForgeBarracksPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/:eventId/battle',
        element: withSuspense(ChampionForgeBattlePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/:eventId/refs-only',
        element: withSuspense(ChampionForgeRefsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/guide',
        element: withSuspense(ChampionForgeGuidePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/champion-forge/gallery',
        element: withSuspense(ChampionForgeBattleGallery),
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
        path: '/group',
        element: withSuspense(GroupDashboardListPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/group/new',
        element: withSuspense(GroupDashboardCreatePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/group/:slug',
        element: withSuspense(GroupDashboardPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/group/:slug/manage',
        element: withSuspense(GroupDashboardManagePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/group/:slug/competitions',
        element: withSuspense(GroupDashboardCompetitionsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/group/activity',
        element: withSuspense(GroupDashboardActivityPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/debug/components',
        element: withSuspense(DebugComponentsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/stats',
        element: withSuspense(StatsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/wall-of-shame',
        element: withSuspense(WallOfShame),
        errorElement: <ErrorPage />,
      },
      {
        path: '/eg-rainbow',
        element: withSuspense(RainbowBingoBoardPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/eg-rainbow/team/:token',
        element: withSuspense(RainbowTeamBoardPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/eg-rainbow/refs',
        element: withSuspense(RainbowRefsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/eg-rainbow/admin',
        element: withSuspense(RainbowAdminPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/eternal-gems',
        element: withSuspense(EternalGemsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship',
        element: withSuspense(BattleshipDashboard),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship/create',
        element: withSuspense(BattleshipCreatePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship/guide',
        element: withSuspense(BattleshipGuidePage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship/:eventId',
        element: withSuspense(BattleshipEventPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship/:eventId/refs',
        element: withSuspense(BattleshipRefsPage),
        errorElement: <ErrorPage />,
      },
      {
        path: '/battleship/:eventId/admin',
        element: withSuspense(BattleshipAdminPage),
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
