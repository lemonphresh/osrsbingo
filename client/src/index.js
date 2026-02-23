import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/700.css';
import '@fontsource/raleway/400.css';
import '@fontsource/raleway/600.css';
import '@fontsource/raleway/800.css';
import { ChakraProvider } from '@chakra-ui/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, split } from '@apollo/client';

import routes from './routes';
import theme from './theme';
import { ToastProvider } from './providers/ToastProvider';

const httpUrl = process.env.REACT_APP_SERVER_URL
  ? `${process.env.REACT_APP_SERVER_URL}/graphql`
  : '/graphql';

const wsUrl = process.env.REACT_APP_SERVER_URL
  ? `${process.env.REACT_APP_SERVER_URL.replace(/^http/, 'ws')}/graphql`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/graphql`;

const httpLink = new HttpLink({ uri: httpUrl, credentials: 'include' });

const wsLink = new GraphQLWsLink(
  createClient({
    url: wsUrl,
    connectionParams: () => {
      const token = localStorage.getItem('authToken');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ChakraProvider theme={theme} initialColorMode={theme.config.initialColorMode}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ChakraProvider>
    </ApolloProvider>
  </React.StrictMode>
);
