import ErrorPage from './pages/ErrorPage';
import Faq from './pages/Faq';
import Landing from './pages/Landing';
import LogIn from './pages/LogIn';
import NoMatch from './pages/NoMatch';
import SignUp from './pages/SignUp';
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
      // {
      //   path: '/pantry/:userId',
      //   element: <UserPantry />,
      //   errorElement: <ErrorPage />,
      //   children: [
      //     {
      //       path: '/pantry/:userId/home',
      //       element: <PantryIntro />,
      //     },
      //     {
      //       path: '/pantry/:userId/inventory/edit',
      //       element: <EditInventory />,
      //       errorElement: <ErrorPage />,
      //     },
      //     {
      //       path: '/pantry/:userId/inventory/view',
      //       element: <ViewInventory />,
      //       errorElement: <ErrorPage />,
      //     },
      //     {
      //       path: '/pantry/:userId/recipes/edit',
      //       element: <EditRecipes />,
      //       errorElement: <ErrorPage />,
      //     },
      //     {
      //       path: '/pantry/:userId/recipes/view',
      //       element: <ViewRecipes />,
      //       errorElement: <ErrorPage />,
      //     },
      //   ],
      // },
      {
        path: '*',
        element: <NoMatch />,
      },
    ],
  },
];

export default routes;
