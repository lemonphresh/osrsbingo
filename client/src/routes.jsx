import BoardDetails from './pages/BoardDetails';
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
        // children: [
        //   {
        //     path: '/pantry/:userId/home',
        //     element: <PantryIntro />,
        //   },
        // ],
      },
      {
        path: '/boards/:boardId',
        element: <BoardDetails />,
        errorElement: <ErrorPage />,
        // children: [
        //   {
        //     path: '/pantry/:userId/home',
        //     element: <PantryIntro />,
        //   },
        // ],
      },
      {
        path: '*',
        element: <NoMatch />,
      },
    ],
  },
];

export default routes;
