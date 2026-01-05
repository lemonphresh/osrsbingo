import AboutPage from './pages/About';
import BoardCreation from './pages/BoardCreation';
import BoardDetails from './pages/BoardDetails';
import BoardViewAll from './pages/BoardViewAll';
import BoardViewAllAdmin from './pages/BoardViewAllAdmin';
import Calendar from './pages/Calendar';
import ErrorPage from './pages/ErrorPage';
import Faq from './pages/Faq';
import Landing from './pages/Landing';
import LogIn from './pages/LogIn';
import NoMatch from './pages/NoMatch';
import PrivacyPage from './pages/Privacy';
import SignUp from './pages/SignUp';
import TermsPage from './pages/Terms';
import TreasureEventView from './pages/TreasureEventPage';
import TreasureHuntDashboard from './pages/TreasureHuntDashboard';
import TreasureTeamPage from './pages/TreasureTeamPage';
import UserDetails from './pages/UserDetails';
import Root from './Root';

const routes = [
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Landing />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/login',
        element: <LogIn />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/signup',
        element: <SignUp />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/faq',
        element: <Faq />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/user/:userId',
        element: <UserDetails />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards',
        element: <BoardViewAll />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/admin',
        element: <BoardViewAllAdmin />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/:boardId',
        element: <BoardDetails />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/boards/create',
        element: <BoardCreation />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/calendar',
        element: <Calendar />,
      },
      {
        path: '/gielinor-rush',
        element: <TreasureHuntDashboard />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId',
        element: <TreasureEventView />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/gielinor-rush/:eventId/team/:teamId',
        element: <TreasureTeamPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/terms',
        element: <TermsPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/privacy',
        element: <PrivacyPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '*',
        element: <NoMatch />,
      },
      {
        path: '/error',
        element: <NoMatch />,
      },
    ],
  },
];

export default routes;
