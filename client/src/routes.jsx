import ErrorPage from './pages/ErrorPage';
import LandingPage from './pages/LandingPage';
import NoMatch from './pages/NoMatch';
import Root from './Root';

const routes = [
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
        errorElement: <ErrorPage />,
      },
      // {
      //   path: '/login',
      //   element: <LoginUser />,
      //   errorElement: <ErrorPage />,
      // },
      // {
      //   path: '/register',
      //   element: <RegisterUser />,
      //   errorElement: <ErrorPage />,
      // },
      // {
      //   path: '/faq',
      //   element: <Faq />,
      //   errorElement: <ErrorPage />,
      // },
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
