import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/800.css';
import '@fontsource/roboto/400.css';
import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { setContext } from '@apollo/client/link/context';

import routes from './routes';
import theme from './theme';
import AuthProvider from './providers/AuthProvider';
import { ApolloClient, ApolloLink, ApolloProvider, HttpLink, InMemoryCache } from '@apollo/client';

const httpLink = new HttpLink({ uri: `${process.env.REACT_APP_SERVER_URL}/graphql` });

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

const router = createBrowserRouter(routes);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ApolloProvider client={client}>
    <AuthProvider>
      <ChakraProvider theme={theme} initialColorMode={theme.config.initialColorMode}>
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>
      </ChakraProvider>
    </AuthProvider>
  </ApolloProvider>
);
