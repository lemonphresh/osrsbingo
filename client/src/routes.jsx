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
import SignUp from './pages/SignUp';
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
